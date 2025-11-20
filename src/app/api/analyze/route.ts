import { createAnthropic } from '@ai-sdk/anthropic';
import { stepCountIs, streamText } from 'ai';
import { z } from 'zod';

const anthropic = createAnthropic();
import { SandboxManager } from '@anthropic-ai/sandbox-runtime';
import { SECURITY_PROFILES } from '@/lib/security-profiles';
import { writeFileSync, readFileSync, readdirSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, dataset } = await req.json();
  console.log('Received analyze request with messages:', messages);
  console.log('Dataset provided:', dataset );

  // Get the security profile
  const config = SECURITY_PROFILES.STANDARD;

  // Create a temporary directory for this execution
  const sandboxDir = join(tmpdir(), `sandbox-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(sandboxDir, { recursive: true });

  Sandbox.create('',config)

  try {
    // Initialize the sandbox manager with required config
    await SandboxManager.initialize({
      network: {
        allowedDomains: config.networkEnabled ? (config.allowedHosts || []) : [],
        deniedDomains: [],
      },
      filesystem: {
        denyRead: ['~/.ssh'],
        allowWrite: [sandboxDir, '/tmp', '/var/folders'],
        denyWrite: ['~/.ssh', '~/.gnupg', '~/.aws', '/etc'],
      },
    });

    // If the user provided data, write it into the sandbox directory
    if (dataset) {
      writeFileSync(join(sandboxDir, 'data.csv'), dataset);
    }

    const result = await streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages,
      stopWhen: stepCountIs(10),
      tools: {
        runPython: {
          description: 'Run Python code to analyze data. A file named "data.csv" may be available in the current directory if the user uploaded a dataset.',
          inputSchema: z.object({
            code: z.string().describe('The Python code to execute')
          }),
          execute: async ({ code }: { code: string }) => {
            // Quick sanity check - block obvious dangerous patterns
            const dangerousPatterns = [
              'subprocess',
              'os.system',
              'os.popen',
              '__import__',
              'eval(',
              'exec(',
              'compile(',
            ];

            for (const pattern of dangerousPatterns) {
              if (code.includes(pattern)) {
                return {
                  error: `Security Violation: "${pattern}" is blocked for security reasons.`,
                  logs: '',
                  images: [] as { filename: string; base64: string }[]
                };
              }
            }

            try {
              // Write the Python script to the sandbox directory
              const scriptPath = join(sandboxDir, 'script.py');

              // Wrap the code to ensure it runs in the sandbox directory
              const wrappedCode = `
import os
os.chdir('${sandboxDir}')
${code}
`;
              writeFileSync(scriptPath, wrappedCode);

              // Create the sandboxed command
              const sandboxedCommand = await SandboxManager.wrapWithSandbox(
                `python3 "${scriptPath}"`
              );

              // Execute with timeout
              return new Promise<{
                logs: string;
                errors?: string;
                error?: string;
                images: { filename: string; base64: string }[];
              }>((resolve) => {
                let stdout = '';
                let stderr = '';
                let timedOut = false;

                const child = spawn('sh', ['-c', sandboxedCommand], {
                  cwd: sandboxDir,
                });

                const timeout = setTimeout(() => {
                  timedOut = true;
                  child.kill('SIGKILL');
                }, config.timeoutMs);

                child.stdout.on('data', (data: Buffer) => {
                  stdout += data.toString();
                });

                child.stderr.on('data', (data: Buffer) => {
                  stderr += data.toString();
                });

                child.on('close', () => {
                  clearTimeout(timeout);

                  if (timedOut) {
                    resolve({
                      error: `Execution timed out after ${config.timeoutMs / 1000} seconds`,
                      logs: stdout,
                      images: []
                    });
                    return;
                  }

                  // Scan for generated images
                  const images: { filename: string; base64: string }[] = [];
                  try {
                    const files = readdirSync(sandboxDir);
                    for (const file of files) {
                      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
                        const buffer = readFileSync(join(sandboxDir, file));
                        images.push({
                          filename: file,
                          base64: buffer.toString('base64')
                        });
                      }
                    }
                  } catch {
                    // Ignore errors reading images
                  }

                  resolve({
                    logs: stdout || '(No output)',
                    errors: stderr || undefined,
                    images
                  });
                });

                child.on('error', (err: Error) => {
                  clearTimeout(timeout);
                  resolve({
                    error: `Execution error: ${err.message}`,
                    logs: '',
                    images: []
                  });
                });
              });
            } catch (err) {
              return {
                error: `Failed to execute code: ${err instanceof Error ? err.message : 'Unknown error'}`,
                logs: '',
                images: [] as { filename: string; base64: string }[]
              };
            }
          },
        },
      },
      system: `You are a Python Data Analyst assistant. You help users analyze data by writing and executing Python code.

When the user provides a dataset, it will be available as a file named 'data.csv' in the current directory.

Guidelines:
- Write clear, well-commented Python code
- Use pandas for data manipulation
- Use matplotlib or seaborn for visualizations
- Save any generated charts as .png files (e.g., plt.savefig('chart.png'))
- Print results and insights to stdout
- Handle errors gracefully

Available libraries: pandas, matplotlib, numpy, seaborn (standard data science stack)

When generating visualizations:
1. Create informative titles and labels
2. Use appropriate chart types for the data
3. Save figures with plt.savefig() before plt.show()
4. Close figures with plt.close() after saving to free memory`,
    });

    return result.toTextStreamResponse();

  } finally {
    // Cleanup: remove the temporary sandbox directory
    try {
      rmSync(sandboxDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

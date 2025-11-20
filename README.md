# Claude Agent Sandbox Demo

A Next.js chat application demonstrating secure AI agent architecture with sandboxed code execution.

## Blog Post

This repository accompanies my Medium blog post:

**[Building Secure AI Agents with Claude and Sandboxed Code Execution](https://medium.com/@jasimea/TODO)**

<!-- TODO: Replace with actual Medium URL -->

## Overview

This demo showcases how to build an AI-powered data analyst that can:
- Execute Python code to analyze uploaded CSV files
- Generate visualizations and charts
- Run all code in a secure, isolated sandbox environment

The architecture uses the [Anthropic Sandbox Runtime](https://github.com/anthropic-experimental/sandbox-runtime) to ensure that AI-generated code cannot access sensitive files, make unauthorized network connections, or harm the host system.

## Features

- Real-time streaming chat interface
- CSV file upload with drag-and-drop support
- Syntax-highlighted Python code display
- Inline image/chart rendering
- Security profile badges showing sandbox status
- Dark/light mode support

## Prerequisites

### Required
- Node.js 18+
- Python 3.x with `pip`
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Platform-Specific Requirements

**macOS:**
- No additional dependencies (uses built-in `sandbox-exec`)

**Linux:**
- Install `bubblewrap`:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install bubblewrap

  # Fedora
  sudo dnf install bubblewrap

  # Arch Linux
  sudo pacman -S bubblewrap
  ```

### Python Dependencies

The sandbox will automatically try to install these, but you can pre-install them:

```bash
pip install pandas matplotlib numpy seaborn
```

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jasimea/claude-agent-sandbox-demo.git
   cd claude-agent-sandbox-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a CSV file** by clicking the upload button or dragging and dropping
2. **Ask questions** about your data:
   - "What columns are in this dataset?"
   - "Show me basic statistics for each column"
   - "Create a histogram of the 'age' column"
   - "Find correlations between numeric columns"
   - "Generate a scatter plot of X vs Y"

## Architecture

### Security Model

The application uses a "dual isolation" model:

1. **Filesystem Isolation:** The sandbox sees a temporary, isolated filesystem. Your server's sensitive files (`.env`, `~/.ssh`, etc.) are completely invisible.

2. **Network Isolation:** Outbound connections are restricted to an allowlist (PyPI for package downloads). All other network access is blocked.

### Security Profiles

Two profiles are defined in `src/lib/security-profiles.ts`:

- **RESTRICTED:** 10s timeout, 128MB RAM, no network access
- **STANDARD:** 30s timeout, 512MB RAM, allowlisted network access (PyPI only)

### Tech Stack

- **Frontend:** Next.js 16, React 19, shadcn/ui, Tailwind CSS
- **AI SDK:** Vercel AI SDK 5 with Anthropic Claude Sonnet 4
- **Sandbox:** @anthropic-ai/sandbox-runtime
- **Code Display:** react-syntax-highlighter

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # Main API endpoint with sandbox
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── chat.tsx              # Main chat container
│   ├── chat-message.tsx      # Message display
│   ├── chat-input.tsx        # Input with file upload
│   ├── code-block.tsx        # Syntax highlighting
│   └── image-display.tsx     # Chart rendering
└── lib/
    ├── security-profiles.ts  # Sandbox configurations
    └── utils.ts              # Utility functions
```

## Troubleshooting

### "Permission denied" errors
- Ensure Python is installed and accessible in your PATH
- On Linux, verify bubblewrap is installed: `which bwrap`

### "Network blocked" errors
- This is expected behavior! The sandbox blocks most network access
- Only PyPI is allowed for package installation

### Slow first execution
- The first execution may be slow as packages (pandas, matplotlib) are installed
- Subsequent executions will be faster

### Images not displaying
- Ensure your code saves images with `plt.savefig('filename.png')`
- Call `plt.close()` after saving to free memory

## Security Considerations

This demo is designed for educational purposes. For production use:

- Implement proper authentication
- Add rate limiting
- Consider per-user sandbox isolation
- Monitor resource usage
- Implement audit logging

## Resources

- [Anthropic Sandbox Runtime (GitHub)](https://github.com/anthropic-experimental/sandbox-runtime)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Bubblewrap](https://github.com/containers/bubblewrap) - Linux sandboxing primitive
- [Claude Code Sandboxing Docs](https://docs.claude.com/en/docs/claude-code/sandboxing)

## Author

**Jasim EA**

- GitHub: [@jasimea](https://github.com/jasimea)

## License

MIT

---

If you found this helpful, please give it a star!

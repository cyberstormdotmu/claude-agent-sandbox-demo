'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { CodeBlock } from '@/components/code-block';
import { ImageDisplay } from '@/components/image-display';
import { User, Bot, Terminal, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolResult {
  logs?: string;
  errors?: string;
  error?: string;
  images?: { filename: string; base64: string }[];
}

interface MessagePart {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    args: {
      code?: string;
    };
    result?: ToolResult;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className={cn('h-8 w-8 flex-none', isUser ? 'bg-primary' : 'bg-secondary')}>
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {message.parts?.map((part, index) => {
          // Text content
          if (part.type === 'text' && part.text) {
            return (
              <Card key={index} className={cn(
                'px-4 py-2.5 text-sm',
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}>
                <p className="whitespace-pre-wrap">{part.text}</p>
              </Card>
            );
          }

          // Tool invocation
          if (part.type === 'tool-invocation' && part.toolInvocation) {
            const toolInvocation = part.toolInvocation;

            return (
              <div key={index} className="w-full space-y-2">
                {/* Show the code that was executed */}
                {toolInvocation.toolName === 'runPython' && toolInvocation.args.code && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Terminal className="h-3 w-3" />
                      <span>Python Code</span>
                    </div>
                    <CodeBlock code={toolInvocation.args.code} language="python" />
                  </div>
                )}

                {/* Show the result */}
                {toolInvocation.result && (
                  <div className="space-y-2">
                    {/* Error */}
                    {toolInvocation.result.error && (
                      <Card className="p-3 bg-destructive/10 border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive flex-none mt-0.5" />
                          <p className="text-sm text-destructive">{toolInvocation.result.error}</p>
                        </div>
                      </Card>
                    )}

                    {/* Stderr */}
                    {toolInvocation.result.errors && (
                      <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
                        <p className="text-sm font-mono text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap">
                          {toolInvocation.result.errors}
                        </p>
                      </Card>
                    )}

                    {/* Stdout */}
                    {toolInvocation.result.logs && (
                      <Card className="p-3 bg-muted">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {toolInvocation.result.logs}
                        </p>
                      </Card>
                    )}

                    {/* Images */}
                    {toolInvocation.result.images && toolInvocation.result.images.length > 0 && (
                      <div className="space-y-2">
                        {toolInvocation.result.images.map((image, imgIndex) => (
                          <ImageDisplay
                            key={imgIndex}
                            base64={image.base64}
                            filename={image.filename}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

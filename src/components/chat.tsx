'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/components/chat-message';
import { ChatInput } from '@/components/chat-input';
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: string;
    text?: string;
    toolInvocation?: {
      toolName: string;
      args: { code?: string };
      result?: {
        logs?: string;
        errors?: string;
        error?: string;
        images?: { filename: string; base64: string }[];
      };
    };
  }>;
}

export function Chat() {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input }],
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.parts.find(p => p.type === 'text')?.text || '',
          })),
          dataset: csvData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantText = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === 'assistant') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              parts: [{ type: 'text', text: assistantText }],
            };
          }
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, csvData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      setCsvFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleClearFile = () => {
    setCsvData(null);
    setCsvFileName(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Secure Data Analyst</h1>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file and ask questions about your data
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs">Sandboxed</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-muted-foreground">
              <Shield className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="font-medium text-lg mb-2">Welcome to the Secure Data Analyst</h3>
              <p className="text-sm max-w-md">
                Upload a CSV file to get started, then ask questions about your data.
                All code execution happens in an isolated sandbox environment.
              </p>
              <div className="mt-6 text-xs space-y-1">
                <p>Try asking:</p>
                <p className="italic">&ldquo;What columns are in this dataset?&rdquo;</p>
                <p className="italic">&ldquo;Show me the distribution of values in column X&rdquo;</p>
                <p className="italic">&ldquo;Create a correlation heatmap&rdquo;</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex-none border-t bg-destructive/10">
          <div className="max-w-7xl mx-auto px-4 py-2 text-destructive text-sm">
            Error: {error.message}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-none border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <ChatInput
            input={input}
            isLoading={isLoading}
            csvFileName={csvFileName}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onFileUpload={handleFileUpload}
            onClearFile={handleClearFile}
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'python' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="relative overflow-hidden">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-70 hover:opacity-100"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          paddingRight: '2.5rem',
          fontSize: '0.8rem',
          lineHeight: '1.4',
          borderRadius: 'inherit',
        }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </Card>
  );
}

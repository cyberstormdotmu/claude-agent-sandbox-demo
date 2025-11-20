'use client';

import { FormEvent, useRef, ChangeEvent, DragEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Upload, X, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  csvFileName: string | null;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onFileUpload: (file: File) => void;
  onClearFile: () => void;
}

export function ChatInput({
  input,
  isLoading,
  csvFileName,
  onInputChange,
  onSubmit,
  onFileUpload,
  onClearFile,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      onFileUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* File upload indicator */}
      {csvFileName && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="text-xs truncate max-w-[200px]">{csvFileName}</span>
            <button
              onClick={onClearFile}
              className="ml-1 hover:text-destructive"
              aria-label="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={onSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex items-center gap-2 rounded-lg border p-1 transition-colors',
          isDragging && 'border-primary bg-primary/5'
        )}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-none"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload CSV file</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <Input
          value={input}
          onChange={onInputChange}
          placeholder={csvFileName ? 'Ask about your data...' : 'Upload a CSV file to start...'}
          disabled={isLoading}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="flex-none"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Drag and drop hint */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg pointer-events-none">
          <p className="text-sm text-muted-foreground">Drop your CSV file here</p>
        </div>
      )}
    </div>
  );
}

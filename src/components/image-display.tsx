'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';

interface ImageDisplayProps {
  base64: string;
  filename: string;
}

export function ImageDisplay({ base64, filename }: ImageDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageSrc = `data:image/png;base64,${base64}`;

  return (
    <>
      <Card className="relative overflow-hidden group">
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(true)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="relative w-full aspect-video bg-white">
          <Image
            src={imageSrc}
            alt={filename}
            fill
            className="object-contain p-2"
            unoptimized
          />
        </div>
        <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
          {filename}
        </div>
      </Card>

      {/* Expanded view modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Card className="overflow-hidden">
              <div className="relative w-full h-[80vh] bg-white">
                <Image
                  src={imageSrc}
                  alt={filename}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              </div>
              <div className="px-4 py-2 flex items-center justify-between border-t">
                <span className="text-sm text-muted-foreground">{filename}</span>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

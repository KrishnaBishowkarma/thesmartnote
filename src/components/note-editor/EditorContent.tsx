
import { useRef } from "react";

interface EditorContentProps {
  content: string;
  onContentChange: (content: string) => void;
  interimText: string;
  contentRef: React.RefObject<HTMLTextAreaElement>;
}

export function EditorContent({ 
  content, 
  onContentChange, 
  interimText,
  contentRef 
}: EditorContentProps) {
  return (
    <div className="flex-1 p-4 relative">
      <textarea
        ref={contentRef}
        placeholder="Start writing..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        className="h-full w-full resize-none bg-transparent text-lg outline-none placeholder:text-muted-foreground"
      />
      {interimText && (
        <div className="absolute bottom-4 left-4 right-4 bg-background/50 p-2 rounded text-foreground">
          {interimText}
        </div>
      )}
    </div>
  );
}


import { Paperclip } from "lucide-react";
import { Attachment } from "@/types/note";

interface NoteDetailAttachmentsProps {
  attachments: Attachment[];
}

export function NoteDetailAttachments({ attachments }: NoteDetailAttachmentsProps) {
  if (attachments.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Attachments</h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id} 
            className="flex items-center gap-2 bg-muted p-2 rounded-md"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {attachment.filename || "Attachment"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

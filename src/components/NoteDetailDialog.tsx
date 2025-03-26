
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Note } from "@/types/note";
import { NoteDetailContent } from "./note-detail/NoteDetailContent";
import { NoteDetailFooter } from "./note-detail/NoteDetailFooter";
import { NoteDetailTags } from "./note-detail/NoteDetailTags";
import { NoteDetailAttachments } from "./note-detail/NoteDetailAttachments";
import { summarizeContent } from "@/utils/summarizeContent";
import { toast } from "sonner";
import { SummaryToast } from "./SummaryToast";

interface NoteDetailDialogProps {
  note: Note | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export function NoteDetailDialog({
  note,
  isOpen,
  onOpenChange,
  onEdit,
  onDelete,
}: NoteDetailDialogProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  if (!note) return null;
  
  const handleSummarize = async () => {
    if (!note.content.trim()) {
      toast.error("No content to summarize");
      return;
    }
    
    setIsSummarizing(true);
    
    try {
      const summary = await summarizeContent(note.content);
      
      toast.custom((toastData) => (
        <SummaryToast 
          summary={summary} 
          onClose={() => toast.dismiss(toastData)} 
        />
      ), { duration: 0 });
    } catch (error) {
      console.error("Error summarizing content:", error);
      toast.error("Failed to summarize content. Please try again later.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{note.title}</DialogTitle>
        </DialogHeader>
        
        <NoteDetailContent content={note.content} />
        
        <div className="space-y-4">
          <NoteDetailTags tags={note.tags || []} />
          <NoteDetailAttachments attachments={note.attachments || []} />
        </div>
        
        <NoteDetailFooter 
          note={note} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onClose={() => onOpenChange(false)}
          onSummarize={handleSummarize}
          isSummarizing={isSummarizing}
        />
      </DialogContent>
    </Dialog>
  );
}


import { Button } from "@/components/ui/button";
import { Note } from "@/types/note";
import { FileTextIcon } from "lucide-react";
import { AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface NoteDetailFooterProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onClose: () => void;
  onSummarize: () => void;
  isSummarizing: boolean;
}

export function NoteDetailFooter({ 
  note, 
  onEdit, 
  onDelete, 
  onClose,
  onSummarize,
  isSummarizing
}: NoteDetailFooterProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleEdit = () => {
    onEdit(note);
  };
  
  const handleDelete = () => {
    onDelete(note.id);
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <div className="flex justify-between items-center mt-4">
      <div className="text-xs text-muted-foreground">
        Last updated: {new Date(note.updated_at).toLocaleString()}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onSummarize}
          disabled={isSummarizing}
          className={isSummarizing ? "opacity-50" : ""}
        >
          <FileTextIcon className="h-4 w-4 mr-1" />
          {isSummarizing ? "Summarizing..." : "Summarize"}
        </Button>
        
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        
        <Button variant="secondary" onClick={handleEdit}>
          Edit
        </Button>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

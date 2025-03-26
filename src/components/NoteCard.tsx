
import { CalendarIcon, Trash2Icon, Tag, Paperclip } from "lucide-react";
import { Note } from "@/types/note";
import { Badge } from "@/components/ui/badge";

interface NoteCardProps {
  note: Note;
  onDeleteClick: (id: string) => void;
  onNoteClick: (note: Note) => void;
}

export function NoteCard({ note, onDeleteClick, onNoteClick }: NoteCardProps) {
  const hasAttachments = note.attachments && note.attachments.length > 0;
  const hasTags = note.tags && note.tags.length > 0;
  
  return (
    <div className="relative cursor-pointer bg-note p-4 transition-colors hover:bg-note-hover group">
      <div onClick={() => onNoteClick(note)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate pr-6">{note.title}</h3>
          {!note.is_synced && (
            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
              Not synced
            </span>
          )}
        </div>
        
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {note.content}
        </p>
        
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarIcon className="h-3 w-3" />
          <span>
            {new Date(note.updated_at).toLocaleDateString()}
          </span>
          {note.folders?.name && (
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5">
              {note.folders.name}
            </span>
          )}
          {hasAttachments && (
            <span className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              {note.attachments.length}
            </span>
          )}
        </div>
        
        {hasTags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map(tag => (
              <Badge key={tag.id} variant="outline" className="text-xs py-0">
                {tag.name}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-xs py-0">
                +{note.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick(note.id);
        }}
        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2Icon className="h-4 w-4 text-destructive hover:text-destructive/80" />
      </button>
    </div>
  );
}

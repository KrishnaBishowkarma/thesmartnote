
import { useState } from "react";
import { Note, Tag, Attachment } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { saveNoteOffline } from "@/services/offlineStorage";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface NoteSaveHandlerProps {
  note: Note | null;
  title: string;
  content: string;
  selectedFolder: string;
  tags: Tag[];
  attachments: Attachment[];
  onNoteSaved: () => void;
  onNoteChange?: (note: Note | null) => void;
}

export function useNoteSaveHandler({
  note,
  title,
  content,
  selectedFolder,
  tags,
  attachments,
  onNoteSaved,
  onNoteChange
}: NoteSaveHandlerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save notes");
        setIsSaving(false);
        return;
      }

      const noteData = {
        title,
        content,
        folder_id: selectedFolder || null,
        user_id: user.id
      };

      let noteId = note?.id;
      let savedNote: Note | null = null;
      
      if (navigator.onLine) {
        const { data, error } = note
          ? await supabase
              .from("notes")
              .update(noteData)
              .eq("id", note.id)
              .select()
              .single()
          : await supabase
              .from("notes")
              .insert(noteData)
              .select()
              .single();

        if (error) {
          throw error;
        }
        
        noteId = data.id;
        savedNote = data;
        
        if (tags.length > 0) {
          await supabase
            .from("note_tags")
            .delete()
            .eq("note_id", noteId);
            
          const tagRelationships = tags.map(tag => ({
            note_id: noteId,
            tag_id: tag.id
          }));
          
          await supabase
            .from("note_tags")
            .insert(tagRelationships);
        }
        
        if (attachments.length > 0) {
          const temporaryAttachments = attachments.filter(a => a.note_id === 'temp');
          
          if (temporaryAttachments.length > 0) {
            const updatedAttachments = temporaryAttachments.map(a => ({
              ...a,
              note_id: noteId,
              user_id: user.id
            }));
            
            await supabase
              .from("attachments")
              .insert(updatedAttachments);
          }
        }
      }
      
      if (noteId) {
        const offlineNote = {
          id: noteId,
          title,
          content,
          folder_id: selectedFolder || null,
          user_id: user.id,
          created_at: note?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tags,
          attachments
        };
        
        await saveNoteOffline(offlineNote);
        
        if (onNoteChange && savedNote) {
          savedNote.tags = tags;
          savedNote.attachments = attachments;
          onNoteChange(null);
        }
      }

      toast.success("Note saved successfully");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      onNoteSaved();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note: " + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSave, isSaving };
}

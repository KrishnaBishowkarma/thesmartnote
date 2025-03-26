import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { NoteCard } from "./NoteCard";
import { NoteDetailDialog } from "./NoteDetailDialog";
import { getOfflineNotes } from "@/services/offlineStorage";
import { ExportFormat, exportNotes } from "@/services/exportService";
import { NoteFilters } from "./note-list/NoteFilters";
import { WifiOff, Loader2 } from "lucide-react";

async function getNotes(folderId?: string) {
  const query = supabase
    .from("notes")
    .select("*, folders(name), attachments(*)")
    .order("updated_at", { ascending: false });

  if (folderId) {
    query.eq("folder_id", folderId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data as Note[];
}

export function NoteList({ onNoteSelect }: { onNoteSelect: (note: Note | null) => void }) {
  const { folderId } = useParams();
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mergedNotes, setMergedNotes] = useState<Note[]>([]);

  const { data: onlineNotes = [], isLoading, error } = useQuery({
    queryKey: ["notes", folderId],
    queryFn: () => getNotes(folderId),
    enabled: isOnline,
    retry: 1
  });

  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const loadAllNotes = async () => {
      if (isOnline) {
        setMergedNotes(onlineNotes);
      } else {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          if (userData.user) {
            const offlineNotes = await getOfflineNotes(userData.user.id);
            
            const filteredNotes = folderId
              ? offlineNotes.filter(note => note.folder_id === folderId)
              : offlineNotes;
              
            setMergedNotes(filteredNotes);
          }
        } catch (error) {
          console.error("Error loading offline notes:", error);
          toast.error("Failed to load offline notes");
        }
      }
    };
    
    loadAllNotes();
  }, [isOnline, onlineNotes, folderId]);

  useEffect(() => {
    if (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes. Please try again.");
    }
  }, [error]);

  const handleDelete = async (noteId: string) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to delete note");
      return;
    }

    toast.success("Note deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    
    if (selectedNote && selectedNote.id === noteId) {
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (note: Note) => {
    onNoteSelect(note);
    setIsDialogOpen(false);
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };

  const handleExportAll = (format: ExportFormat) => {
    if (filteredNotes.length > 0) {
      exportNotes(filteredNotes, format);
      toast.success("Notes exported successfully");
    } else {
      toast.error("No notes to export");
    }
  };

  const filteredNotes = mergedNotes
    .filter(note => {
      const matchesSearch = searchTerm
        ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
        
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "created_at") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  return (
    <div className="h-full border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notes</h2>
          {!isOnline && (
            <div className="flex items-center gap-1 text-destructive text-xs">
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredNotes.length} notes in total
        </p>
        
        <NoteFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onExportAll={handleExportAll}
          notesCount={filteredNotes.length}
        />
      </div>
      
      <div className="flex-1 overflow-auto divide-y">
        {isLoading && isOnline ? (
          <div className="p-4 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Loading notes...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-destructive">
            <p>Failed to load notes. Please try again.</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDeleteClick={handleDelete}
              onNoteClick={handleNoteClick}
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? "No matching notes found" : "No notes yet"}
          </div>
        )}
      </div>
      
      <NoteDetailDialog
        note={selectedNote}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

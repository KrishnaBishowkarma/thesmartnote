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
import { WifiOff } from "lucide-react";

async function getNotes(folderId?: string) {
  const query = supabase
    .from("notes")
    .select("*, folders(name), note_tags(tag_id), attachments(*)")
    .order("updated_at", { ascending: false });

  if (folderId) {
    query.eq("folder_id", folderId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  if (data && data.length > 0) {
    const tagIds = new Set<string>();
    data.forEach(note => {
      if (note.note_tags) {
        note.note_tags.forEach((tagRel: any) => {
          tagIds.add(tagRel.tag_id);
        });
      }
    });
    
    let tagsData: any[] = [];
    if (tagIds.size > 0) {
      const { data: tagsResult, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .in("id", Array.from(tagIds));
        
      if (!tagsError) {
        tagsData = tagsResult;
      }
    }
    
    return data.map(note => {
      const noteTags = note.note_tags 
        ? tagsData.filter(tag => 
            note.note_tags.some((tagRel: any) => tagRel.tag_id === tag.id)
          )
        : [];
        
      return {
        ...note,
        tags: noteTags,
        note_tags: undefined
      };
    }) as Note[];
  }
  
  return data as Note[];
}

export function NoteList({ onNoteSelect }: { onNoteSelect: (note: Note | null) => void }) {
  const { folderId } = useParams();
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("updated_at");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mergedNotes, setMergedNotes] = useState<Note[]>([]);

  const { data: onlineNotes = [], isLoading } = useQuery({
    queryKey: ["notes", folderId],
    queryFn: () => getNotes(folderId),
    enabled: isOnline,
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
          const { data: userData } = await supabase.auth.getUser();
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

  const allTags = Array.from(
    new Set(
      mergedNotes
        .filter(note => note.tags && note.tags.length > 0)
        .flatMap(note => note.tags || [])
        .map(tag => tag.id)
    )
  ).map(tagId => {
    const tag = mergedNotes
      .flatMap(note => note.tags || [])
      .find(tag => tag.id === tagId);
    return tag;
  }).filter(Boolean);

  const filteredNotes = mergedNotes
    .filter(note => {
      const matchesSearch = searchTerm
        ? note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
        
      const matchesTag = tagFilter
        ? note.tags && note.tags.some(tag => tag.id === tagFilter)
        : true;
        
      return matchesSearch && matchesTag;
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
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          allTags={allTags}
          onExportAll={handleExportAll}
          notesCount={filteredNotes.length}
        />
      </div>
      
      <div className="flex-1 overflow-auto divide-y">
        {isLoading && isOnline ? (
          <div className="p-4 text-center text-muted-foreground">Loading notes...</div>
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
            {searchTerm || tagFilter ? "No matching notes found" : "No notes yet"}
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

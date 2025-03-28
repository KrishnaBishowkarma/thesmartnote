
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Note } from "@/types/note";
import { EditorToolbar } from "./note-editor/EditorToolbar";
import { FolderSelector } from "./note-editor/FolderSelector";
import { registerSyncEvents } from "@/services/offlineStorage";
import { ExportFormat } from "@/services/exportService";
import { useSpeechRecognition } from "./note-editor/useSpeechRecognition";
import { useNoteUtilities } from "./note-editor/NoteUtilities";
import { useNoteSaveHandler } from "./note-editor/NoteSaveHandler";
import { EditorTabs } from "./note-editor/EditorTabs";

// Import functions for data fetching
async function getNoteTags(noteId: string) {
  const { data, error } = await supabase
    .from("note_tags")
    .select("tag_id")
    .eq("note_id", noteId);
    
  if (error) throw error;
  
  if (data.length === 0) return [];
  
  const tagIds = data.map(item => item.tag_id);
  
  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select("*")
    .in("id", tagIds);
    
  if (tagsError) throw tagsError;
  
  return tags;
}

async function getNoteAttachments(noteId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("note_id", noteId);
    
  if (error) throw error;
  
  return data;
}

interface NoteEditorProps {
  note: Note | null;
  onNoteChange?: (note: Note | null) => void;
}

export function NoteEditor({ note = null, onNoteChange }: NoteEditorProps) {
  // State management
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [selectedFolder, setSelectedFolder] = useState(note?.folder_id || "");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tags, setTags] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("content");
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Load note data when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSelectedFolder(note.folder_id || "");
      
      getNoteTags(note.id)
        .then(tagsData => {
          setTags(tagsData);
        })
        .catch(error => {
          console.error("Error loading note tags:", error);
        });
        
      getNoteAttachments(note.id)
        .then(attachmentsData => {
          setAttachments(attachmentsData);
        })
        .catch(error => {
          console.error("Error loading note attachments:", error);
        });
    } else {
      setTitle("");
      setContent("");
      setSelectedFolder("");
      setTags([]);
      setAttachments([]);
      setActiveTab("content");
    }
  }, [note]);

  // Register sync events
  useEffect(() => {
    registerSyncEvents(supabase);
  }, []);

  // Speech recognition handler
  const handleFinalTranscript = (text: string, position?: number) => {
    if (position !== undefined && contentRef.current) {
      const cursorPosition = position || contentRef.current.selectionStart;
      const newContent = 
        content.substring(0, cursorPosition) + 
        text + 
        content.substring(cursorPosition);
      setContent(newContent);
    } else {
      setContent(prevContent => prevContent + " " + text);
    }
  };

  // Custom hooks
  const { isRecording, interimText, toggleSpeechRecognition } = 
    useSpeechRecognition(handleFinalTranscript);

  const { handleFormat, summarizeNoteContent, handleExport } = useNoteUtilities({
    title,
    content,
    selectedFolder,
    tags,
    attachments,
    note,
    contentRef
  });

  const { handleSave, isSaving } = useNoteSaveHandler({
    note,
    title,
    content,
    selectedFolder,
    tags,
    attachments,
    onNoteSaved: () => {
      setTitle("");
      setContent("");
      setSelectedFolder("");
      setTags([]);
      setAttachments([]);
      setActiveTab("content");
      
      if (onNoteChange) {
        onNoteChange(null);
      }
    },
    onNoteChange
  });

  // Event handlers
  const handleFormatClick = (type: 'bold' | 'italic' | 'list') => {
    const result = handleFormat(type);
    if (result) {
      setContent(result.newContent);
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          contentRef.current.setSelectionRange(result.newStart, result.newEnd);
        }
      }, 0);
    }
  };

  const handleSummarizeClick = async () => {
    setIsSummarizing(true);
    await summarizeNoteContent();
    setIsSummarizing(false);
  };

  const handleExportClick = (format: ExportFormat) => {
    handleExport(format);
  };

  const clearEditorState = () => {
    setTitle("");
    setContent("");
    setSelectedFolder("");
    setTags([]);
    setAttachments([]);
    setActiveTab("content");
    
    if (onNoteChange) {
      onNoteChange(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-4 flex items-center justify-between">
          <EditorToolbar 
            onFormat={handleFormatClick}
            onToggleSpeechRecognition={toggleSpeechRecognition}
            onSummarize={handleSummarizeClick}
            onExport={handleExportClick}
            isRecording={isRecording}
            isSummarizing={isSummarizing}
          />
          <div className="flex items-center gap-2">
            <FolderSelector 
              selectedFolder={selectedFolder} 
              onFolderChange={setSelectedFolder} 
            />
            <Button variant="secondary" onClick={clearEditorState}>
              Exit
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
      
      <EditorTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        content={content}
        setContent={setContent}
        interimText={interimText}
        contentRef={contentRef}
        tags={tags}
        setTags={setTags}
        attachments={attachments}
        setAttachments={setAttachments}
        noteId={note?.id}
      />
    </div>
  );
}

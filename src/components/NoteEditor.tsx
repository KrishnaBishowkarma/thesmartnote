
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Note, Attachment, Tag as TagType } from "@/types/note";
import { EditorToolbar } from "./note-editor/EditorToolbar";
import { FolderSelector } from "./note-editor/FolderSelector";
import { EditorContent } from "./note-editor/EditorContent";
import { FileAttachments } from "./FileAttachments";
import { TagsManager } from "./TagsManager";
import { registerSyncEvents } from "@/services/offlineStorage";
import { ExportFormat } from "@/services/exportService";
import { useSpeechRecognition } from "./note-editor/useSpeechRecognition";
import { useNoteUtilities } from "./note-editor/NoteUtilities";
import { useNoteSaveHandler } from "./note-editor/NoteSaveHandler";

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
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [selectedFolder, setSelectedFolder] = useState(note?.folder_id || "");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tags, setTags] = useState<TagType[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeTab, setActiveTab] = useState("content");
  const contentRef = useRef<HTMLTextAreaElement>(null);

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

  const { isRecording, interimText, toggleSpeechRecognition } = 
    useSpeechRecognition(handleFinalTranscript);

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

  useEffect(() => {
    registerSyncEvents(supabase);
  }, []);

  const { handleFormat, summarizeNoteContent, handleExport } = useNoteUtilities({
    title,
    content,
    selectedFolder,
    tags,
    attachments,
    note,
    contentRef
  });

  const handleFormatClick = (type: 'bold' | 'italic' | 'list') => {
    const result = handleFormat(type);
    if (result) {
      setContent(result.newContent);
      // Re-focus and set selection if needed
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
  
  const { handleSave, isSaving } = useNoteSaveHandler({
    note,
    title,
    content,
    selectedFolder,
    tags,
    attachments,
    onNoteSaved: clearEditorState,
    onNoteChange
  });

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="flex-1">
          <EditorContent 
            content={content}
            onContentChange={setContent}
            interimText={interimText}
            contentRef={contentRef}
          />
        </TabsContent>
        
        <TabsContent value="tags" className="flex-1 p-4">
          <TagsManager 
            noteId={note?.id} 
            selectedTags={tags} 
            onTagsChange={setTags} 
          />
        </TabsContent>
        
        <TabsContent value="attachments" className="flex-1 p-4">
          <FileAttachments 
            noteId={note?.id} 
            attachments={attachments} 
            onAttachmentsChange={setAttachments} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

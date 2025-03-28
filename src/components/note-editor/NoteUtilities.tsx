
import { RefObject } from "react";
import { summarizeContent } from "@/utils/summarizeContent";
import { ExportFormat, exportNote } from "@/services/exportService";
import { Note, Tag, Attachment } from "@/types/note";
import { toast } from "sonner";
import { SummaryToast } from "../SummaryToast";

interface NoteUtilitiesProps {
  title: string;
  content: string;
  selectedFolder: string;
  tags: Tag[];
  attachments: Attachment[];
  note: Note | null;
  contentRef: RefObject<HTMLTextAreaElement>;
}

export function useNoteUtilities({
  title,
  content, 
  selectedFolder,
  tags,
  attachments,
  note,
  contentRef
}: NoteUtilitiesProps) {
  
  const handleFormat = (type: 'bold' | 'italic' | 'list') => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newText = '';
    switch (type) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `_${selectedText}_`;
        break;
      case 'list':
        newText = selectedText
          .split('\n')
          .map(line => `• ${line}`)
          .join('\n');
        break;
    }
    
    return {
      newContent: content.substring(0, start) + newText + content.substring(end),
      newStart: start,
      newEnd: start + newText.length
    };
  };

  const summarizeNoteContent = async () => {
    if (!content.trim()) {
      toast.error("Please add some content to summarize");
      return;
    }

    try {
      const summary = await summarizeContent(content);
      
      toast.custom((toastData) => (
        <SummaryToast 
          summary={summary} 
          onClose={() => toast.dismiss(toastData)} 
        />
      ), { 
        duration: 0,  // This ensures the toast stays until manually dismissed
        position: 'top-center'  // Changed from 'center' to 'top-center'
      });
      
      return true;
    } catch (error) {
      console.error("Error summarizing content:", error);
      toast.error("Failed to summarize content. Please try again later.");
      return false;
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!title || !content) {
      toast.error("Please add a title and content before exporting");
      return;
    }
    
    const tempNote: Note = {
      id: note?.id || "temp",
      title,
      content,
      user_id: "temp",
      created_at: note?.created_at || new Date().toISOString(),
      updated_at: note?.updated_at || new Date().toISOString(),
      folder_id: selectedFolder,
      tags,
      attachments
    };
    
    try {
      await exportNote(tempNote, format);
      toast.success(`Note exported as ${format.toUpperCase()}`);
      return true;
    } catch (error) {
      console.error("Error exporting note:", error);
      toast.error("Failed to export note. Please try again later.");
      return false;
    }
  };

  return {
    handleFormat,
    summarizeNoteContent,
    handleExport
  };
}


import { Button } from "@/components/ui/button";
import { BoldIcon, ItalicIcon, ListIcon, MicIcon, FileTextIcon, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportFormat } from "@/services/exportService";

interface EditorToolbarProps {
  onFormat: (type: 'bold' | 'italic' | 'list') => void;
  onToggleSpeechRecognition: () => void;
  onSummarize: () => void;
  onExport: (format: ExportFormat) => void;
  isRecording: boolean;
  isSummarizing: boolean;
}

export function EditorToolbar({
  onFormat,
  onToggleSpeechRecognition,
  onSummarize,
  onExport,
  isRecording,
  isSummarizing
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={() => onFormat('bold')}>
        <BoldIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormat('italic')}>
        <ItalicIcon className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onFormat('list')}>
        <ListIcon className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onToggleSpeechRecognition}
        className={isRecording ? "bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300" : ""}
      >
        <MicIcon className="h-4 w-4" />
      </Button>
      {isRecording && <span className="text-xs text-red-500 animate-pulse">Recording...</span>}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onSummarize}
        disabled={isSummarizing}
        className={isSummarizing ? "opacity-50" : ""}
      >
        <FileTextIcon className="h-4 w-4" />
        {isSummarizing ? "Summarizing..." : "Summarize"}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onExport(ExportFormat.PDF)}>
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport(ExportFormat.MARKDOWN)}>
            Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport(ExportFormat.HTML)}>
            HTML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport(ExportFormat.TEXT)}>
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExport(ExportFormat.JSON)}>
            JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

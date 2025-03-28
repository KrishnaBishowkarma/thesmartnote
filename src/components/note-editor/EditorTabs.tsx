
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorContent } from "./EditorContent";
import { FileAttachments } from "../FileAttachments";
import { TagsManager } from "../TagsManager";
import { Note, Tag, Attachment } from "@/types/note";

interface EditorTabsProps {
  activeTab: string;
  setActiveTab: (value: string) => void;
  content: string;
  setContent: (content: string) => void;
  interimText: string;
  contentRef: React.RefObject<HTMLTextAreaElement>;
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  attachments: Attachment[];
  setAttachments: (attachments: Attachment[]) => void;
  noteId?: string;
}

export function EditorTabs({
  activeTab,
  setActiveTab,
  content,
  setContent,
  interimText,
  contentRef,
  tags,
  setTags,
  attachments,
  setAttachments,
  noteId
}: EditorTabsProps) {
  return (
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
          noteId={noteId} 
          selectedTags={tags} 
          onTagsChange={setTags} 
        />
      </TabsContent>
      
      <TabsContent value="attachments" className="flex-1 p-4">
        <FileAttachments 
          noteId={noteId} 
          attachments={attachments} 
          onAttachmentsChange={setAttachments} 
        />
      </TabsContent>
    </Tabs>
  );
}

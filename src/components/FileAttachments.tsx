
import { useState } from "react";
import { Attachment } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileIcon, ImageIcon, TrashIcon, UploadIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface FileAttachmentsProps {
  noteId?: string;
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
}

export function FileAttachments({ noteId, attachments, onAttachmentsChange }: FileAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${noteId || 'temp'}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('note_attachments')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('note_attachments')
          .getPublicUrl(filePath);
          
        if (!urlData.publicUrl) {
          throw new Error("Failed to get public URL for uploaded file");
        }
        
        const newAttachment: Attachment = {
          id: uuidv4(),
          note_id: noteId || 'temp',
          user_id: 'temp',
          filename: file.name,
          filesize: file.size,
          filetype: file.type,
          url: urlData.publicUrl,
          created_at: new Date().toISOString()
        };
        
        // If we have a noteId, save to database
        if (noteId) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error: dbError } = await supabase.from("attachments").insert({
              ...newAttachment,
              user_id: userData.user.id
            });
            
            if (dbError) throw dbError;
          }
        }
        
        // Update state
        onAttachmentsChange([...attachments, newAttachment]);
      }
      
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) return;
      
      // Extract the path from the URL
      const path = attachment.url.split('note_attachments/')[1];
      
      // Delete from storage
      if (path) {
        const { error: storageError } = await supabase.storage
          .from('note_attachments')
          .remove([path]);
          
        if (storageError) throw storageError;
      }
      
      // If we have a noteId, delete from database
      if (noteId) {
        const { error: dbError } = await supabase
          .from("attachments")
          .delete()
          .eq("id", attachmentId);
          
        if (dbError) throw dbError;
      }
      
      // Update state
      onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
      toast.success("File removed successfully");
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error("Failed to remove file");
    }
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Files"}
        </Button>
      </div>
      
      {attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Attached Files</h4>
          <div className="space-y-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id} 
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  {isImage(attachment.filetype) ? (
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {attachment.filename}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(attachment.filesize / 1024)} KB
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                >
                  <TrashIcon className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

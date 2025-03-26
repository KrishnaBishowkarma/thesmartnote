
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";

async function getFolders() {
  const { data, error } = await supabase.from("folders").select("*");
  if (error) throw error;
  return data;
}

interface FolderSelectorProps {
  selectedFolder: string;
  onFolderChange: (folderId: string) => void;
}

export function FolderSelector({ selectedFolder, onFolderChange }: FolderSelectorProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ["folders"],
    queryFn: getFolders,
  });

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to create folders");
      return;
    }

    const { data: existingFolders } = await supabase
      .from("folders")
      .select("*")
      .eq("name", newFolderName)
      .eq("user_id", user.id);

    if (existingFolders && existingFolders.length > 0) {
      toast.error("A folder with this name already exists");
      return;
    }

    const { error, data } = await supabase
      .from("folders")
      .insert([{ name: newFolderName, user_id: user.id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error("A folder with this name already exists");
      } else {
        toast.error("Failed to create folder");
      }
      return;
    }

    toast.success("Folder created successfully");
    setNewFolderName("");
    setIsDialogOpen(false);
    onFolderChange(data.id);
    queryClient.invalidateQueries({ queryKey: ["folders"] });
  };

  return (
    <Select value={selectedFolder} onValueChange={onFolderChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select folder" />
      </SelectTrigger>
      <SelectContent>
        {folders.map((folder) => (
          <SelectItem key={folder.id} value={folder.id}>
            {folder.name}
          </SelectItem>
        ))}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <PlusIcon className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for your new folder
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button onClick={createFolder} className="w-full">
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SelectContent>
    </Select>
  );
}

import { FolderIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

async function getFolders() {
  const { data, error } = await supabase.from("folders").select("*");
  if (error) throw error;
  return data;
}

export function NoteSidebar() {
  const navigate = useNavigate();
  const [newFolderName, setNewFolderName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: folders = [], refetch } = useQuery({
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

    // Check if folder with same name exists
    const { data: existingFolders } = await supabase
      .from("folders")
      .select("*")
      .eq("name", newFolderName)
      .eq("user_id", user.id);

    if (existingFolders && existingFolders.length > 0) {
      toast.error("A folder with this name already exists");
      return;
    }

    const { error } = await supabase
      .from("folders")
      .insert([{ name: newFolderName, user_id: user.id }]);

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
  };

  const deleteFolder = async (folderId: string) => {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId);

    if (error) {
      toast.error("Failed to delete folder");
      return;
    }

    toast.success("Folder deleted successfully");
    refetch();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4">
          <Button
            className="w-full justify-start gap-2"
            onClick={() => navigate("/new")}
          >
            <PlusIcon className="h-4 w-4" />
            New Note
          </Button>
          <div className="relative mt-4">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <input
              type="search"
              placeholder="Search notes..."
              className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/notes" className="flex items-center gap-2">
                    <FolderIcon className="h-4 w-4" />
                    <span>All Notes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton asChild className="flex-1">
                      <a
                        href={`/folder/${folder.id}`}
                        className="flex items-center gap-2"
                      >
                        <FolderIcon className="h-4 w-4" />
                        <span>{folder.name}</span>
                      </a>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteFolder(folder.id)}
                    >
                      <Trash2Icon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
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
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
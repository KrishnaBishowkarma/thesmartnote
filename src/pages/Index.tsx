import { NoteSidebar } from "@/components/NoteSidebar";
import { NoteList } from "@/components/NoteList";
import { NoteEditor } from "@/components/NoteEditor";
import { UserMenu } from "@/components/UserMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";
import { Note } from "@/types/note";
import { useNavigate } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const navigate = useNavigate();
  const { loading, user } = useAuth();

  // This handler ensures we stay on the notes page after saving
  const handleNoteChange = (updatedNote: Note | null) => {
    setSelectedNote(updatedNote);
    
    // If we're on a different route, navigate to /notes without a full page refresh
    if (window.location.pathname !== "/notes") {
      navigate("/notes", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden pt-16">
        <NoteSidebar />
        <div className="flex-1">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-primary">SmartNote</h1>
            <UserMenu />
          </div>
          <div className="grid grid-cols-[350px,1fr]">
            <NoteList onNoteSelect={setSelectedNote} />
            <NoteEditor 
              note={selectedNote} 
              onNoteChange={handleNoteChange} 
            />
          </div>
        </div>
      </div>
      <OfflineIndicator />
    </SidebarProvider>
  );
};

export default Index;

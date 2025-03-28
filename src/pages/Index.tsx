
import { NoteSidebar } from "@/components/NoteSidebar";
import { NoteList } from "@/components/NoteList";
import { NoteEditor } from "@/components/NoteEditor";
import { UserMenu } from "@/components/UserMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { Note } from "@/types/note";
import { useNavigate, useLocation } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ensure we're properly authenticated before rendering
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading state until authentication is resolved
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-lg text-primary">Loading...</div>
      </div>
    );
  }

  // Don't render the main content until we're sure the user is authenticated
  if (!user) return null;

  // This handler ensures we stay on the notes page after saving
  const handleNoteChange = (updatedNote: Note | null) => {
    setSelectedNote(updatedNote);
    
    // If we're on a different route, navigate to /notes without a full page refresh
    if (window.location.pathname !== "/notes") {
      navigate("/notes", { replace: true });
    }
  };

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

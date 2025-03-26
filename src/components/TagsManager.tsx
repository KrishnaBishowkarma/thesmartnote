
import { useState, useEffect } from "react";
import { Tag } from "@/types/note";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

interface TagsManagerProps {
  noteId?: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function TagsManager({ noteId, selectedTags, onTagsChange }: TagsManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("tags").select("*");
      
      if (error) throw error;
      
      setTags(data as Tag[]);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      // Check if tag already exists for this user
      const existingTag = tags.find(tag => 
        tag.name.toLowerCase() === newTagName.trim().toLowerCase()
      );
      
      if (existingTag) {
        // If tag exists but isn't selected, select it
        if (!selectedTags.some(tag => tag.id === existingTag.id)) {
          const updatedTags = [...selectedTags, existingTag];
          onTagsChange(updatedTags);
          
          // If we have a noteId, save the relationship
          if (noteId) {
            await supabase.from("note_tags").insert({
              note_id: noteId,
              tag_id: existingTag.id
            });
          }
        }
      } else {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("You must be logged in to create tags");
          return;
        }
        
        // Create new tag with user_id
        const { data, error } = await supabase
          .from("tags")
          .insert({ 
            name: newTagName.trim(),
            user_id: user.id
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Add to available tags
        setTags(prev => [...prev, data]);
        
        // Select the new tag
        const updatedTags = [...selectedTags, data];
        onTagsChange(updatedTags);
        
        // If we have a noteId, save the relationship
        if (noteId) {
          await supabase.from("note_tags").insert({
            note_id: noteId,
            tag_id: data.id
          });
        }
      }
      
      // Clear input
      setNewTagName("");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const updatedTags = selectedTags.filter(tag => tag.id !== tagId);
      onTagsChange(updatedTags);
      
      // If we have a noteId, remove the relationship
      if (noteId) {
        await supabase
          .from("note_tags")
          .delete()
          .match({ note_id: noteId, tag_id: tagId });
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Failed to remove tag");
    }
  };

  const handleTagClick = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      handleRemoveTag(tag.id);
    } else {
      onTagsChange([...selectedTags, tag]);
      
      // If we have a noteId, save the relationship
      if (noteId) {
        supabase.from("note_tags").insert({
          note_id: noteId,
          tag_id: tag.id
        }).then(({ error }) => {
          if (error) {
            console.error("Error saving tag relationship:", error);
            toast.error("Failed to add tag to note");
          }
        });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Add a tag..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddTag}
          disabled={!newTagName.trim()}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
            {tag.name}
            <button 
              type="button" 
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 rounded-full hover:bg-secondary-foreground/10"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      {tags.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Available Tags</h4>
          <div className="flex flex-wrap gap-2">
            {tags.filter(tag => !selectedTags.some(t => t.id === tag.id)).map(tag => (
              <Badge
                key={tag.id}
                variant="outline"
                className="cursor-pointer hover:bg-secondary"
                onClick={() => handleTagClick(tag)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

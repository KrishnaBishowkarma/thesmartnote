
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types/note";

interface NoteDetailTagsProps {
  tags: Tag[];
}

export function NoteDetailTags({ tags }: NoteDetailTagsProps) {
  if (tags.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

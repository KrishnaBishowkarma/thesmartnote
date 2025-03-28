
import { SearchIcon, FilterIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ExportFormat, exportNotes } from "@/services/exportService";
import { Tag } from "@/types/note";
import { toast } from "sonner";

interface NoteFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  allTags: Tag[];
  onExportAll: (format: ExportFormat) => void;
  notesCount: number;
}

export function NoteFilters({
  searchTerm,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  sortBy,
  onSortByChange,
  allTags,
  onExportAll,
  notesCount
}: NoteFiltersProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="flex gap-2">
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={onTagFilterChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tags</SelectItem>
              {allTags.map(tag => tag && (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={notesCount === 0}>
              <FilterIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExportAll(ExportFormat.PDF)}>
              Export All as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportAll(ExportFormat.MARKDOWN)}>
              Export All as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportAll(ExportFormat.TEXT)}>
              Export All as Text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

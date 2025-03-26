
import { cn } from "@/lib/utils";

interface NoteDetailContentProps {
  content: string;
}

export function NoteDetailContent({ content }: NoteDetailContentProps) {
  // Simple markdown-like rendering for basic formatting
  const formattedContent = content
    .split("\n")
    .map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic text
      line = line.replace(/_(.*?)_/g, "<em>$1</em>");
      // Bullet points
      line = line.replace(/^• (.*)$/gm, "<li>$1</li>");
      
      // Add list wrapper if needed
      if (line.includes("<li>")) {
        line = `<ul class="list-disc pl-5">${line}</ul>`;
      }
      
      return line;
    })
    .join("<br />");

  return (
    <div className="border rounded-md p-4 my-4 bg-background">
      <div 
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
}

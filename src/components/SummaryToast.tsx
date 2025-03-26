
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SummaryToastProps {
  summary: string;
  onClose: () => void;
}

export function SummaryToast({ summary, onClose }: SummaryToastProps) {
  return (
    <div className="bg-card rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">Note Summary</h3>
      <div className="text-sm text-card-foreground whitespace-pre-wrap mb-4">{summary}</div>
      <div className="flex justify-end">
        <Button 
          size="sm" 
          onClick={() => {
            navigator.clipboard.writeText(summary);
            toast.success("Summary copied to clipboard");
          }}
          className="mr-2"
        >
          Copy
        </Button>
        <Button 
          size="sm"
          variant="outline" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

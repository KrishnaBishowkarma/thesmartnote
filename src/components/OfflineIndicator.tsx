
import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      
      if (!navigator.onLine) {
        setIsVisible(true);
        // Hide the indicator after 5 seconds when going offline
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
        return () => clearTimeout(timer);
      } else {
        // When coming back online, show briefly then hide
        setIsVisible(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };
    
    // Check initial status
    handleOnlineStatus();
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  if (!isOffline && !isVisible) return null;
  
  return (
    <div className={cn("fixed bottom-4 right-4 z-50 transition-opacity", 
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}>
      <Alert variant={isOffline ? "destructive" : "default"} className="w-72">
        <WifiOff className="h-4 w-4 mr-2" />
        <AlertTitle>
          {isOffline ? "Offline Mode" : "Back Online"}
        </AlertTitle>
        <AlertDescription>
          {isOffline 
            ? "Changes will be saved locally and synced when you're back online." 
            : "Your changes are now being synced."}
        </AlertDescription>
      </Alert>
    </div>
  );
}

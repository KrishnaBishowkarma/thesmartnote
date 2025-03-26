
import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";

export function useSpeechRecognition(onFinalTranscript: (text: string, position?: number) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setInterimText(interimTranscript);

        if (finalTranscript) {
          onFinalTranscript(finalTranscript);
          setInterimText("");
        }
      };

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setInterimText("");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast.error("Speech recognition failed: " + event.error);
        setIsRecording(false);
        setInterimText("");
      };

      recognitionRef.current.start();
    } else {
      toast.error("Speech recognition is not supported in this browser");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  return {
    isRecording,
    interimText,
    toggleSpeechRecognition
  };
}

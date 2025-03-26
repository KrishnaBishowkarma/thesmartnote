
import { Note } from "@/types/note";

// Define the database name and version
const DB_NAME = "smartnote_offline";
const DB_VERSION = 1;

// IndexedDB setup
export const initOfflineStorage = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Error opening offline database", event);
      reject("Failed to open offline database");
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" });
        notesStore.createIndex("user_id", "user_id", { unique: false });
        notesStore.createIndex("is_synced", "is_synced", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("sync_queue")) {
        db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Save note to IndexedDB
export const saveNoteOffline = async (note: Note): Promise<string> => {
  const db = await initOfflineStorage();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notes"], "readwrite");
    const store = transaction.objectStore("notes");
    
    // Mark as not synced if we're storing offline
    const offlineNote = {
      ...note,
      is_synced: navigator.onLine,
      last_synced_at: navigator.onLine ? new Date().toISOString() : null
    };
    
    const request = store.put(offlineNote);
    
    request.onsuccess = () => {
      resolve(note.id);
      // If we're offline, add to sync queue
      if (!navigator.onLine) {
        addToSyncQueue(note);
      }
    };
    
    request.onerror = (error) => {
      console.error("Error saving note offline", error);
      reject(error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Get all notes from IndexedDB
export const getOfflineNotes = async (userId: string): Promise<Note[]> => {
  const db = await initOfflineStorage();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notes"], "readonly");
    const store = transaction.objectStore("notes");
    const index = store.index("user_id");
    const request = index.getAll(userId);
    
    request.onsuccess = () => {
      resolve(request.result as Note[]);
    };
    
    request.onerror = (error) => {
      console.error("Error retrieving offline notes", error);
      reject(error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Add to sync queue for when we come back online
const addToSyncQueue = async (note: Note): Promise<void> => {
  const db = await initOfflineStorage();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["sync_queue"], "readwrite");
    const store = transaction.objectStore("sync_queue");
    
    const request = store.add({
      type: "note",
      action: note.id ? "update" : "create",
      data: note,
      timestamp: new Date().toISOString()
    });
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = (error) => {
      console.error("Error adding to sync queue", error);
      reject(error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Process sync queue when we come back online
export const processSyncQueue = async (supabaseClient: any): Promise<void> => {
  if (!navigator.onLine) return;
  
  const db = await initOfflineStorage();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["sync_queue", "notes"], "readwrite");
    const queueStore = transaction.objectStore("sync_queue");
    const notesStore = transaction.objectStore("notes");
    
    const request = queueStore.getAll();
    
    request.onsuccess = async () => {
      const syncItems = request.result;
      
      // Process each item in the queue
      for (const item of syncItems) {
        try {
          if (item.type === "note") {
            if (item.action === "create" || item.action === "update") {
              // Sync with Supabase
              const { error } = await supabaseClient
                .from("notes")
                .upsert(item.data);
              
              if (!error) {
                // Update note in IndexedDB
                const noteRequest = notesStore.get(item.data.id);
                noteRequest.onsuccess = () => {
                  if (noteRequest.result) {
                    const updatedNote = {
                      ...noteRequest.result,
                      is_synced: true,
                      last_synced_at: new Date().toISOString()
                    };
                    notesStore.put(updatedNote);
                  }
                };
                
                // Remove from queue
                queueStore.delete(item.id);
              }
            }
          }
        } catch (error) {
          console.error("Error processing sync item", error);
        }
      }
      
      resolve();
    };
    
    request.onerror = (error) => {
      console.error("Error retrieving sync queue", error);
      reject(error);
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Register online/offline event listeners
export const registerSyncEvents = (supabaseClient: any): void => {
  window.addEventListener("online", () => {
    console.log("Back online, processing sync queue...");
    processSyncQueue(supabaseClient);
  });
  
  window.addEventListener("offline", () => {
    console.log("App is offline. Changes will be synced when connection is restored.");
  });
};

// Export/download notes in specific format
export enum ExportFormat {
  JSON = "json",
  TEXT = "txt",
  MARKDOWN = "md"
}

export const exportNotes = (notes: Note[], format: ExportFormat): void => {
  let content = '';
  let filename = `smartnote_export_${new Date().toISOString().split('T')[0]}`;
  let mimeType = 'text/plain';
  
  switch (format) {
    case ExportFormat.JSON:
      content = JSON.stringify(notes, null, 2);
      filename += '.json';
      mimeType = 'application/json';
      break;
      
    case ExportFormat.MARKDOWN:
      content = notes.map(note => {
        let md = `# ${note.title}\n\n`;
        md += `${note.content}\n\n`;
        md += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
        md += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
        if (note.tags && note.tags.length > 0) {
          md += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
        }
        md += '\n---\n\n';
        return md;
      }).join('');
      filename += '.md';
      break;
      
    case ExportFormat.TEXT:
    default:
      content = notes.map(note => {
        let txt = `${note.title}\n\n`;
        txt += `${note.content}\n\n`;
        txt += `Created: ${new Date(note.created_at).toLocaleString()}\n`;
        txt += `Updated: ${new Date(note.updated_at).toLocaleString()}\n`;
        if (note.tags && note.tags.length > 0) {
          txt += `Tags: ${note.tags.map(tag => tag.name).join(', ')}\n`;
        }
        txt += '\n---\n\n';
        return txt;
      }).join('');
      filename += '.txt';
      break;
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

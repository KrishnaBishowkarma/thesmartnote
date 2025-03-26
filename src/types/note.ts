export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_synced?: boolean;
  last_synced_at?: string;
  folders?: {
    name: string;
  };
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  note_id: string;
  user_id: string;
  filename: string;
  filesize: number;
  filetype: string;
  url: string;
  created_at: string;
}

export interface BackupHistory {
  id: string;
  user_id: string;
  backup_time: string;
  notes_count: number;
  status: string;
  backup_url?: string;
}

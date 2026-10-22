export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export type Document = {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  status: DocumentStatus;
  error_message: string | null;
  created_at: string;
};

export type DocumentListResponse = {
  documents: Document[];
  total: number;
  skip: number;
  limit: number;
};

export type DocumentStatusResponse = {
  id: number;
  filename: string;
  status: DocumentStatus;
  error_message: string | null;
};

export type UploadResponse = {
  message: string;
  document: Document;
};

export type DeleteResponse = {
  message: string;
  document_id: number;
};

export type Chunk = {
  id: number;
  document_id: number;
  chunk_index: number;
  content: string;
  doc_metadata: Record<string, unknown> | null;
  created_at: string;
};

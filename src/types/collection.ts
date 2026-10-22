export type Collection = {
  id: number;
  organization_id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  document_count: number;
  created_at: string;
  updated_at: string;
};

export type CollectionDocumentItem = {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
};

export type CollectionDetail = Collection & {
  documents: CollectionDocumentItem[];
};

export type CollectionListResponse = {
  collections: Collection[];
  total: number;
};

export type CollectionCreate = {
  name: string;
  description?: string | null;
};

export type CollectionUpdate = {
  name?: string;
  description?: string | null;
};

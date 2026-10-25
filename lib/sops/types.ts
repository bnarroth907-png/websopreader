export type SopSource = "library" | "uploads";
export type SopDocumentType = "markdown" | "pdf";

export interface SopMeta {
  id: string;
  title: string;
  category: string;
  description: string;
  type: SopDocumentType;
  source: SopSource;
  originalFilename: string;
  createdAt: string;
}

export interface SopListItem extends SopMeta {
  isUploaded: boolean;
}

export interface SopDetail extends SopListItem {
  content: string;
  fileUrl: string | null;
}

export interface PaginatedSops {
  items: SopListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort: SopSortField;
}

export type SopSortField = "title" | "category" | "createdAt";

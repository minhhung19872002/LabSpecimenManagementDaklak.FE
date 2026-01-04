export interface NoteDto {
  id: string;
  code: string;
  content: string;
  isActive: boolean;
  sortOrder: number;
  creationTime: string;
  lastModificationTime?: string;
}

export interface CreateNoteDto {
  content: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateNoteDto {
  content: string;
  isActive: boolean;
  sortOrder: number;
}

export interface NoteFilterDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
  search?: string;
  isActive?: boolean;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface NotesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface NotesActions {
  handleCreate: () => void;
  handleDownloadTemplate: () => void;
  handleImport: () => void;
}

// Import types
export interface ImportRowError {
  rowNumber: number;
  columnName: string;
  errorMessage: string;
  value?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportRowError[];
}

export interface NoteImportPreviewItem {
  rowNumber: number;
  content: string;
  isNew: boolean;
  existingId?: string;
  isValid: boolean;
  errors: string[];
}

export interface NoteImportPreviewDto {
  validationResult: ImportValidationResult;
  items: NoteImportPreviewItem[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newNotes: number;
  updateNotes: number;
  errorFileBase64?: string;
  errorFileName?: string;
}

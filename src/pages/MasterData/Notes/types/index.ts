export interface NotesTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

export interface NotesActions {
  handleCreate: () => void;
}

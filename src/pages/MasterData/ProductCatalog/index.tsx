export { default } from "./ProductCatalogList";

export interface ProductCatalogActions {
  handleCreate: () => void;
}

export interface ProductCatalogTabProps {
  onDataChange?: () => void;
  refreshKey?: number;
}

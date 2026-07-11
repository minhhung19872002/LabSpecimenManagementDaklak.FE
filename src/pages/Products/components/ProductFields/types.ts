import React from "react";
import { ProductAttachmentDto, CreateProductAttachmentDto } from "../../../../services/productService";

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  title: string;
}

export interface IdentCodeOption {
  value: string;
  label: string;
  disabled: boolean;
}

export interface BaseProductOption {
  value: string;
  label: string;
  title: string;
  productType: number;
}

export interface BaseFieldsProps {
  consumableUnitOptions: SelectOption[];
  identificationCodeOptions: IdentCodeOption[];
}

export interface SharedFieldsProps {
  categoryTags: string[];
  categoryTagInput: string;
  setCategoryTagInput: (v: string) => void;
  handleAddTag: (field: "categories", value: string, setInput: (v: string) => void) => void;
  handleRemoveTag: (field: "categories", tag: string) => void;
  existingAttachments: ProductAttachmentDto[];
  newAttachments: CreateProductAttachmentDto[];
  setNewAttachments: React.Dispatch<React.SetStateAction<CreateProductAttachmentDto[]>>;
  setExistingAttachments: React.Dispatch<React.SetStateAction<ProductAttachmentDto[]>>;
  setRemovedAttachmentIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface PreparedSolutionFieldsProps extends BaseFieldsProps {
  baseProductOptions: BaseProductOption[];
  hasBaseSubstance: boolean;
  setHasBaseSubstance: (v: boolean) => void;
}

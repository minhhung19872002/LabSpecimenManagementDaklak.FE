// Quotation Status enum
export enum QuotationStatus {
  Draft = 0,
  Sent = 1,
  Cancelled = 2,
}

// Status display configuration
export const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; color: string }
> = {
  [QuotationStatus.Draft]: { label: "Nháp", color: "default" },
  [QuotationStatus.Sent]: { label: "Đã gửi", color: "success" },
  [QuotationStatus.Cancelled]: { label: "Đã hủy", color: "error" },
};

// Quotation Item DTO
export interface QuotationItemDto {
  id: string;
  quotationId: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  sampleCount: number;
  unitPrice: number;
  totalPrice: number;
  sortOrder: number;
}

// Quotation DTO (full detail)
export interface QuotationDto {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  organizationId?: string;
  organizationName?: string;
  customerName: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  totalCost: number;
  notes?: string;
  status: QuotationStatus;
  items: QuotationItemDto[];
  creationTime: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

// Quotation List DTO (simplified for list view)
export interface QuotationListDto {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  customerName: string;
  phone?: string;
  totalCost: number;
  status: QuotationStatus;
  itemCount: number;
  sampleCount: number;
  creationTime: string;
  creatorUserName?: string;
}

// Create/Update Quotation Item DTO
export interface CreateUpdateQuotationItemDto {
  id?: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  testMethodName: string;
  sampleCount: number;
  unitPrice: number;
  sortOrder: number;
}

// Create/Update Quotation DTO
export interface CreateUpdateQuotationDto {
  quotationDate: string;
  organizationId?: string;
  customerName: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  status: QuotationStatus;
  items: CreateUpdateQuotationItemDto[];
}

// Get Quotation List Input
export interface GetQuotationListInput {
  filter?: string;
  status?: QuotationStatus;
  fromDate?: string;
  toDate?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

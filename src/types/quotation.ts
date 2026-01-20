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

// Quotation Sample Indicator DTO
export interface QuotationSampleIndicatorDto {
  id: string;
  quotationSampleId: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  unitPrice: number;
  sortOrder: number;
}

// Quotation Sample DTO
export interface QuotationSampleDto {
  id: string;
  quotationId: string;
  sortOrder: number;
  sampleName: string;
  totalPrice: number;
  indicators: QuotationSampleIndicatorDto[];
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
  samples: QuotationSampleDto[];
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
  sampleCount: number;
  indicatorCount: number;
  creationTime: string;
  creatorUserName?: string;
}

// Create/Update Quotation Sample Indicator DTO
export interface CreateUpdateQuotationSampleIndicatorDto {
  id?: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  testMethodName: string;
  unitPrice: number;
  sortOrder: number;
}

// Create/Update Quotation Sample DTO
export interface CreateUpdateQuotationSampleDto {
  id?: string;
  sortOrder: number;
  sampleName: string;
  indicators: CreateUpdateQuotationSampleIndicatorDto[];
}

// Create/Update Quotation DTO
export interface CreateUpdateQuotationDto {
  quotationDate: string;
  organizationId?: string;
  customerName?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  status: QuotationStatus;
  samples: CreateUpdateQuotationSampleDto[];
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

// Form data types for frontend state management
export interface QuotationSampleIndicatorFormData {
  key: string; // indicatorId_testMethodId
  id?: string;
  indicatorId: string;
  testMethodId: string;
  indicatorName: string;
  indicatorFormattedName?: string | null;
  testMethodName: string;
  testMethodFormattedName?: string | null;
  unitPrice: number;
  sortOrder: number;
}

export interface QuotationSampleFormData {
  key: string;
  id?: string;
  sortOrder: number;
  sampleName: string;
  indicators: QuotationSampleIndicatorFormData[];
}

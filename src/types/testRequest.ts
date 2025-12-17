// Enums
export enum TestRequestStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3
}

export enum ResultLanguage {
  Vietnamese = 0,
  English = 1,
  VietnameseAndEnglish = 2
}

export enum SamplingRequirement {
  LabSampling = 0,
  CustomerSampling = 1
}

export enum SampleStorageOption {
  No = 0,
  Yes = 1
}

export enum SampleStatus {
  Normal = 0,
  Damaged = 1,
  NotMeetRequirements = 2,
  Testing = 3,
  Completed = 4
}

// Sample Indicator DTOs
export interface TestRequestSampleIndicatorDto {
  id: string;
  testRequestSampleId: string;
  indicatorId: string;
  indicatorCode?: string;
  indicatorName?: string;
  indicatorGroupName?: string;
  unitPrice: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment: boolean;
}

export interface CreateTestRequestSampleIndicatorDto {
  indicatorId: string;
  unitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
}

export interface UpdateTestRequestSampleIndicatorDto {
  id?: string;
  indicatorId: string;
  unitPrice?: number;
  notes?: string;
  transferDate?: string;
  requestDate?: string;
  sentToDepartment?: boolean;
}

// Sample DTOs
export interface TestRequestSampleDto {
  id: string;
  testRequestId: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  totalIndicatorCost: number;
  indicators: TestRequestSampleIndicatorDto[];
}

export interface CreateTestRequestSampleDto {
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  indicators: CreateTestRequestSampleIndicatorDto[];
}

export interface UpdateTestRequestSampleDto {
  id?: string;
  sortOrder: number;
  sampleCode: string;
  sampleName: string;
  samplingAddress?: string;
  sampleQuantity?: string;
  status: SampleStatus;
  statusText?: string;
  processingStatus?: string;
  notes?: string;
  storageLocation?: string;
  indicators: UpdateTestRequestSampleIndicatorDto[];
}

// Main TestRequest DTOs
export interface TestRequestDto {
  id: string;

  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting: boolean;
  paymentReceived: boolean;
  sentToDepartment: boolean;
  resultReturned: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount: number;

  // Testing Method Info
  methodWestHighlandInstitute: boolean;
  methodCustomer: boolean;
  methodCustomerDetail?: string;
  resultLanguage: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement: SamplingRequirement;
  deliveryDirectPickup: boolean;
  deliveryPostal: boolean;
  returnStoredSample: boolean;
  sampleTypeService: boolean;
  sampleTypeContract: boolean;
  sampleTypeTask: boolean;
  sampleTypeSubContract: boolean;
  resultDeliveryDate?: string;
  sampleStorage: SampleStorageOption;
  totalCost: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  supervisorName?: string;
  directorId?: string;
  directorName?: string;
  changeRequest?: string;
  agreeTerms: boolean;

  // Legacy fields
  requestNumber: string;
  requestDate: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Samples
  samples: TestRequestSampleDto[];

  // Audit fields from ABP Framework
  isDeleted?: boolean;
  deleterId?: string | null;
  deletionTime?: string | null;
  lastModificationTime?: string | null;
  lastModifierId?: string | null;
  creationTime?: string;
  creatorId?: string | null;
}

export interface CreateTestRequestDto {
  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting?: boolean;
  paymentReceived?: boolean;
  sentToDepartment?: boolean;
  resultReturned?: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount?: number;

  // Testing Method Info
  methodWestHighlandInstitute?: boolean;
  methodCustomer?: boolean;
  methodCustomerDetail?: string;
  resultLanguage?: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults?: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement?: SamplingRequirement;
  deliveryDirectPickup?: boolean;
  deliveryPostal?: boolean;
  returnStoredSample?: boolean;
  sampleTypeService?: boolean;
  sampleTypeContract?: boolean;
  sampleTypeTask?: boolean;
  sampleTypeSubContract?: boolean;
  resultDeliveryDate?: string;
  sampleStorage?: SampleStorageOption;
  totalCost?: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  directorId?: string;
  changeRequest?: string;
  agreeTerms?: boolean;

  // Legacy fields
  requestDate: string;
  notes?: string;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Samples
  samples: CreateTestRequestSampleDto[];
}

export interface UpdateTestRequestDto {
  // Contract Info
  contractNumber?: string;
  contractDate?: string;
  sentToAccounting?: boolean;
  paymentReceived?: boolean;
  sentToDepartment?: boolean;
  resultReturned?: boolean;
  customerName: string;
  provinceCode?: string;
  province?: string;
  districtCode?: string;
  district?: string;
  wardCode?: string;
  ward?: string;
  address?: string;
  taxCode?: string;
  contactPerson?: string;
  phone?: string;

  // Sample count
  totalSampleCount?: number;

  // Testing Method Info
  methodWestHighlandInstitute?: boolean;
  methodCustomer?: boolean;
  methodCustomerDetail?: string;
  resultLanguage?: ResultLanguage;
  resultCopyCount?: string;
  separatePassedResults?: boolean;
  conformityDeclaration?: string;
  otherRequirements?: string;
  subContract?: string;
  samplingRequirement?: SamplingRequirement;
  deliveryDirectPickup?: boolean;
  deliveryPostal?: boolean;
  returnStoredSample?: boolean;
  sampleTypeService?: boolean;
  sampleTypeContract?: boolean;
  sampleTypeTask?: boolean;
  sampleTypeSubContract?: boolean;
  resultDeliveryDate?: string;
  sampleStorage?: SampleStorageOption;
  totalCost?: number;
  totalCostInWords?: string;
  receiptNumber?: string;

  // User References
  supervisorId?: string;
  directorId?: string;
  changeRequest?: string;
  agreeTerms?: boolean;

  // Legacy fields
  requestDate: string;
  notes?: string;
  status: TestRequestStatus;
  expectedCompletionDate?: string;
  subcontractor?: string;

  // Samples
  samples: UpdateTestRequestSampleDto[];
}

// Paging DTOs
export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface PagedAndSortedResultRequestDto {
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

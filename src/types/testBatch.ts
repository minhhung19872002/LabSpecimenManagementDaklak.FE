export enum TestBatchStatus {
  Draft = 0,
  Running = 1,
  Completed = 2,
  Cancelled = 3,
}

export const TestBatchStatusLabels: Record<TestBatchStatus, string> = {
  [TestBatchStatus.Draft]: 'Cần làm',
  [TestBatchStatus.Running]: 'Đang thực hiện',
  [TestBatchStatus.Completed]: 'Hoàn thành',
  [TestBatchStatus.Cancelled]: 'Đã hủy',
};

export const TestBatchStatusColors: Record<TestBatchStatus, string> = {
  [TestBatchStatus.Draft]: 'default',
  [TestBatchStatus.Running]: 'processing',
  [TestBatchStatus.Completed]: 'success',
  [TestBatchStatus.Cancelled]: 'error',
};

export interface TestBatchListDto {
  id: string;
  code: string;
  name: string;
  indicatorId: string;
  indicatorName?: string;
  methodId: string;
  methodName?: string;
  specimenTypeId?: string;
  specimenTypeName?: string;
  status: TestBatchStatus;
  testDate?: string;
  itemCount: number;
  submittedItemCount: number;
  contractCount: number;
  requestCompletionDate?: string;
  creationTime: string;
  creatorId?: string;
  creatorName?: string;
}

export interface TestBatchItemDto {
  id: string;
  testBatchId: string;
  laboratoryTaskIndicatorId: string;
  laboratoryTaskId: string;
  contractNumber?: string;
  sampleCode?: string;
  sampleName?: string;
  technicianName?: string;
  indicatorName?: string;
  methodName?: string;
  unit?: string;
  submitDate?: string;
  rejectionReason?: string;
  result?: string;
  testDate?: string;
  isSubmitted: boolean;
  isExternallyCompleted: boolean;
}

export interface TestBatchConsumptionDto {
  id: string;
  testBatchId: string;
  productId?: string;
  productName?: string;
  equipmentId?: string;
  equipmentName?: string;
  unitId?: string;
  unitName?: string;
  recommendedQuantity: number;
  actualQuantity: number;
  isDeducted: boolean;
}

export interface TestBatchDto {
  id: string;
  code: string;
  name: string;
  indicatorId: string;
  indicatorName?: string;
  methodId: string;
  methodName?: string;
  specimenTypeId?: string;
  specimenTypeName?: string;
  status: TestBatchStatus;
  testDate?: string;
  completedDate?: string;
  completedById?: string;
  completedByName?: string;
  note?: string;
  consumptionConfirmed: boolean;
  consumptionConfirmedDate?: string;
  creationTime: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
  isDeleted: boolean;
  deleterId?: string;
  deletionTime?: string;
  items: TestBatchItemDto[];
  consumptions: TestBatchConsumptionDto[];
}

export interface GetTestBatchListInput {
  filter?: string;
  status?: TestBatchStatus;
  indicatorId?: string;
  indicatorIds?: string[];
  methodId?: string;
  specimenTypeId?: string;
  fromDate?: string;
  toDate?: string;
  technicianIds?: string[];
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface CreateTestBatchDto {
  name: string;
  note?: string;
  laboratoryTaskIndicatorIds: string[];
}

export interface SaveTestBatchResultsDto {
  testDate?: string;
  items: TestBatchItemResultDto[];
}

export interface TestBatchItemResultDto {
  itemId: string;
  result?: string;
  testDate?: string;
}

export interface ConfirmConsumptionDto {
  items: ConsumptionItemDto[];
}

export interface ConsumptionItemDto {
  consumptionId: string;
  actualQuantity: number;
}

export interface GetAvailableIndicatorsInput {
  indicatorId?: string;
  methodId?: string;
  specimenTypeId?: string;
  filter?: string;
  technicianId?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface AvailableIndicatorDto {
  id: string;
  laboratoryTaskId: string;
  contractNumber?: string;
  sampleCode?: string;
  sampleName?: string;
  technicianName?: string;
  technicianId?: string;
  indicatorId?: string;
  indicatorName?: string;
  methodId?: string;
  methodName?: string;
  specimenTypeId?: string;
  specimenTypeName?: string;
  requestCompletionDate?: string;
  sampleSentDate?: string;
  isAlreadyInBatch: boolean;
}

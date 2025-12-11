export enum ResultApprovalStatus {
  Draft = 0,
  Submitted = 1,
  Step1Reviewed = 2,
  Step2Approved = 3,
  Rejected = 4
}

export interface TestResultDto {
  id: string;
  testId: string;
  parameter: string;
  value: string;
  unit: string;
  lowerLimit?: number;
  upperLimit?: number;
  isPass?: boolean;
  approvalStatus: ResultApprovalStatus;
  enteredById?: string;
  entryDate?: string;
  reviewerId?: string;
  reviewDate?: string;
  reviewComment?: string;
  approverId?: string;
  approvalDate?: string;
  approvalComment?: string;
  chartData?: string;
  notes?: string;
  testCode?: string;
  testName?: string;
  creationTime: string;
  lastModificationTime?: string;
}

export interface CreateTestResultDto {
  testId: string;
  parameter: string;
  value: string;
  unit: string;
  lowerLimit?: number;
  upperLimit?: number;
  isPass?: boolean;
  chartData?: string;
  notes?: string;
}

export interface UpdateTestResultDto {
  parameter: string;
  value: string;
  unit: string;
  lowerLimit?: number;
  upperLimit?: number;
  isPass?: boolean;
  approvalStatus: ResultApprovalStatus;
  enteredById?: string;
  entryDate?: string;
  reviewerId?: string;
  reviewDate?: string;
  reviewComment?: string;
  approverId?: string;
  approvalDate?: string;
  approvalComment?: string;
  chartData?: string;
  notes?: string;
}

/**
 * Receipt Status Enum
 */
export enum ReceiptStatus {
  PendingPayment = 0, // Chờ thanh toán
  Unpaid = 1, // Chưa thanh toán
  Paid = 2, // Đã thanh toán
  Cancelled = 3, // Hủy yêu cầu
}

/**
 * Receipt status labels
 */
export const ReceiptStatusLabels: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PendingPayment]: 'Chờ thanh toán',
  [ReceiptStatus.Unpaid]: 'Chưa thanh toán',
  [ReceiptStatus.Paid]: 'Đã thanh toán',
  [ReceiptStatus.Cancelled]: 'Hủy yêu cầu',
};

/**
 * Receipt status colors for Tag component
 */
export const ReceiptStatusColors: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PendingPayment]: 'gold',
  [ReceiptStatus.Unpaid]: 'orange',
  [ReceiptStatus.Paid]: 'green',
  [ReceiptStatus.Cancelled]: 'red',
};

/**
 * Receipt DTO from API
 */
export interface ReceiptDto {
  id: string;
  testRequestId: string;
  receiptNumber?: string;
  voucherCode?: string; // Mã số biên lai
  status: ReceiptStatus;
  notes?: string;
  paidDate?: string;
  creationTime: string;
  lastModificationTime?: string;
  creatorId?: string;
  lastModifierId?: string;

  // From TestRequest
  contractNumber?: string;
  requestDate?: string;
  expectedCompletionDate?: string;
  totalCost: number;
  customerName?: string;
}

/**
 * Input for getting receipt list
 */
export interface GetReceiptListInput {
  filter?: string;
  status?: ReceiptStatus;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

/**
 * Receipt Detail DTO - includes full TestRequest data
 */
export interface ReceiptDetailDto extends ReceiptDto {
  // TestRequest detail - import from testRequest.ts
  testRequestDetail?: import('./testRequest').TestRequestDto;
}

/**
 * DTO for updating receipt info
 */
export interface UpdateReceiptDto {
  receiptNumber?: string;
  voucherCode?: string;
}

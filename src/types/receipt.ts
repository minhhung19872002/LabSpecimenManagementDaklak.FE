/**
 * Receipt Status Enum
 */
export enum ReceiptStatus {
  PendingPayment = 0, // Chờ thanh toán
  Unpaid = 1, // Chưa thanh toán
  Paid = 2, // Đã thanh toán
  Cancelled = 3, // Hủy yêu cầu
  NoPaymentRequired = 4, // Không cần thanh toán (Mẫu nhiệm vụ)
  PartiallyPaid = 5, // Đã thanh toán 1 phần
}

/**
 * Receipt status labels
 */
export const ReceiptStatusLabels: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PendingPayment]: 'Chờ thanh toán',
  [ReceiptStatus.Unpaid]: 'Chưa thanh toán',
  [ReceiptStatus.Paid]: 'Đã thanh toán',
  [ReceiptStatus.Cancelled]: 'Hủy yêu cầu',
  [ReceiptStatus.NoPaymentRequired]: 'Không cần thanh toán',
  [ReceiptStatus.PartiallyPaid]: 'Đã thanh toán 1 phần',
};

/**
 * Receipt status colors for Tag component
 */
export const ReceiptStatusColors: Record<ReceiptStatus, string> = {
  [ReceiptStatus.PendingPayment]: 'gold',
  [ReceiptStatus.Unpaid]: 'orange',
  [ReceiptStatus.Paid]: 'green',
  [ReceiptStatus.Cancelled]: 'red',
  [ReceiptStatus.NoPaymentRequired]: 'cyan',
  [ReceiptStatus.PartiallyPaid]: 'blue',
};

/**
 * Payment Method Enum
 */
export enum PaymentMethod {
  Cash = 0, // Tiền mặt
  BankTransfer = 1, // Chuyển khoản
}

/**
 * Payment Method labels
 */
export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.Cash]: 'Tiền mặt',
  [PaymentMethod.BankTransfer]: 'Chuyển khoản',
};

/**
 * Receipt DTO from API
 */
export interface ReceiptDto {
  id: string;
  testRequestId: string;
  receiptNumber?: string;
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
}

/**
 * Payment History DTO
 */
export interface PaymentHistoryDto {
  id: string;
  receiptId: string;
  paymentNumber: number;
  amount: number;
  remainingAmountBeforePayment: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  creationTime: string;
  creatorName?: string;
}

/**
 * Payment Info DTO - for modal display
 */
export interface PaymentInfoDto {
  receiptId: string;
  testRequestId: string;
  contractNumber?: string;
  totalCost: number;
  paidAmount: number;
  remainingAmount: number;
  status: ReceiptStatus;
  paymentHistories: PaymentHistoryDto[];
}

/**
 * Input for creating a new payment
 */
export interface CreatePaymentInput {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Payment Result DTO - response after processing payment
 */
export interface PaymentResultDto {
  paymentHistoryId: string;
  paidAmount: number;
  remainingAmount: number;
  receiptStatus: ReceiptStatus;
  message: string;
}

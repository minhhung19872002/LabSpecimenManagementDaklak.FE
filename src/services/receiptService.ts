import { api, PagedResultDto } from './api';
import {
  ReceiptDto,
  ReceiptDetailDto,
  GetReceiptListInput,
  UpdateReceiptDto,
  PaymentInfoDto,
  CreatePaymentInput,
  PaymentResultDto,
} from '../types/receipt';

const BASE_URL = '/api/v1/receipts';

export const receiptService = {
  // Get list of receipts with pagination
  getList: async (
    params: GetReceiptListInput
  ): Promise<PagedResultDto<ReceiptDto>> => {
    const response = await api.get<PagedResultDto<ReceiptDto>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  // Get receipt by id
  get: async (id: string): Promise<ReceiptDto> => {
    const response = await api.get<ReceiptDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Get receipt detail with full TestRequest data
  getDetail: async (id: string): Promise<ReceiptDetailDto> => {
    const response = await api.get<ReceiptDetailDto>(`${BASE_URL}/${id}/detail`);
    return response.data;
  },

  // Update receipt info (receipt number, voucher code)
  update: async (id: string, data: UpdateReceiptDto): Promise<void> => {
    await api.put(`${BASE_URL}/${id}`, data);
  },

  // Mark as paid
  markAsPaid: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/mark-paid`);
  },

  // Mark as unpaid
  markAsUnpaid: async (id: string): Promise<void> => {
    await api.post(`${BASE_URL}/${id}/mark-unpaid`);
  },

  // Get payment info for modal - auto creates Receipt if not exists
  getPaymentInfo: async (testRequestId: string): Promise<PaymentInfoDto> => {
    const response = await api.get<PaymentInfoDto>(
      `${BASE_URL}/payment-info/${testRequestId}`
    );
    return response.data;
  },

  // Process a new payment
  processPayment: async (
    receiptId: string,
    input: CreatePaymentInput
  ): Promise<PaymentResultDto> => {
    const response = await api.post<PaymentResultDto>(
      `${BASE_URL}/${receiptId}/payments`,
      input
    );
    return response.data;
  },
};

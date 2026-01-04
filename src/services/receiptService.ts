import { api, PagedResultDto } from './api';
import { ReceiptDto, GetReceiptListInput } from '../types/receipt';

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
};

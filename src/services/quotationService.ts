import { api, PagedResultDto } from "./api";
import {
  QuotationDto,
  QuotationListDto,
  CreateUpdateQuotationDto,
  GetQuotationListInput,
} from "../types/quotation";

const BASE_URL = "/api/v1/quotations";

export const quotationService = {
  // Get list of quotations with pagination
  getList: async (
    params: GetQuotationListInput
  ): Promise<PagedResultDto<QuotationListDto>> => {
    const response = await api.get<PagedResultDto<QuotationListDto>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  // Get quotation by id
  get: async (id: string): Promise<QuotationDto> => {
    const response = await api.get<QuotationDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create new quotation
  create: async (data: CreateUpdateQuotationDto): Promise<QuotationDto> => {
    const response = await api.post<QuotationDto>(BASE_URL, data);
    return response.data;
  },

  // Update quotation
  update: async (
    id: string,
    data: CreateUpdateQuotationDto
  ): Promise<QuotationDto> => {
    const response = await api.put<QuotationDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // Delete quotation
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  // Generate new quotation number
  generateNumber: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/generate-number`);
    return response.data;
  },
};

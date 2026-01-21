import { api, PagedResultDto } from "./api";
import {
  QuotationDto,
  QuotationListDto,
  CreateUpdateQuotationDto,
  GetQuotationListInput,
} from "../types/quotation";
import { createOfflineService, BaseCrudService } from "./offline/createOfflineService";

const BASE_URL = "/api/v1/quotations";

// PDF generation DTOs
export interface QuotationPdfIndicatorDto {
  indicatorName: string;
  quantity: number;
  unitPrice: number;
}

export interface QuotationPdfSampleDto {
  sampleName: string;
  quantity: number;
  indicators: QuotationPdfIndicatorDto[];
}

export interface SendQuotationEmailDto {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  customerName: string;
  samples: QuotationPdfSampleDto[];
  totalPrice: number;
}

export interface GenerateQuotationPdfDto {
  customerName?: string;
  samples: QuotationPdfSampleDto[];
  totalPrice: number;
}

const quotationApiService = {
  getList: async (params: GetQuotationListInput): Promise<PagedResultDto<QuotationListDto>> => {
    const response = await api.get<PagedResultDto<QuotationListDto>>(BASE_URL, { params });
    return response.data;
  },
  get: async (id: string): Promise<QuotationDto> => {
    const response = await api.get<QuotationDto>(`${BASE_URL}/${id}`);
    return response.data;
  },
  create: async (data: CreateUpdateQuotationDto): Promise<QuotationDto> => {
    const response = await api.post<QuotationDto>(BASE_URL, data);
    return response.data;
  },
  update: async (id: string, data: CreateUpdateQuotationDto): Promise<QuotationDto> => {
    const response = await api.put<QuotationDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};

// Use QuotationListDto for list operations, QuotationDto for single item operations
const baseService: BaseCrudService<QuotationListDto, CreateUpdateQuotationDto, CreateUpdateQuotationDto, GetQuotationListInput> = {
  getList: quotationApiService.getList,
  get: quotationApiService.get as unknown as (id: string) => Promise<QuotationListDto>,
  create: quotationApiService.create as unknown as (data: CreateUpdateQuotationDto) => Promise<QuotationListDto>,
  update: quotationApiService.update as unknown as (id: string, data: CreateUpdateQuotationDto) => Promise<QuotationListDto>,
  delete: quotationApiService.delete,
};

const offlineEnabledService = createOfflineService<QuotationListDto, CreateUpdateQuotationDto, CreateUpdateQuotationDto, GetQuotationListInput>('Quotation', baseService);

export const quotationService = {
  getList: offlineEnabledService.getList,
  get: async (id: string): Promise<QuotationDto> => {
    if (offlineEnabledService.isOnline()) {
      try {
        return await quotationApiService.get(id);
      } catch (error) {
        console.warn('Online get failed, returning cached data:', error);
      }
    }
    const cached = await offlineEnabledService.getCached(id);
    if (cached) {
      return cached as unknown as QuotationDto;
    }
    throw new Error('Item not found in cache and currently offline');
  },
  create: offlineEnabledService.create as unknown as (data: CreateUpdateQuotationDto) => Promise<QuotationDto>,
  update: offlineEnabledService.update as unknown as (id: string, data: CreateUpdateQuotationDto) => Promise<QuotationDto>,
  delete: offlineEnabledService.delete,
  isOnline: offlineEnabledService.isOnline,
  getPendingSyncCount: offlineEnabledService.getPendingSyncCount,
  forceSync: offlineEnabledService.forceSync,
  getCachedList: offlineEnabledService.getCachedList,
  getCached: offlineEnabledService.getCached,
  generateNumber: async (): Promise<string> => {
    const response = await api.get<string>(`${BASE_URL}/generate-number`);
    return response.data;
  },
  sendEmail: async (data: SendQuotationEmailDto): Promise<void> => {
    await api.post(`${BASE_URL}/send-email`, data);
  },
  generatePdf: async (data: GenerateQuotationPdfDto): Promise<string> => {
    const response = await api.post(`${BASE_URL}/generate-pdf`, data, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  },
};

import api from "./api";
import type {
  SampleStorageDto,
  SampleStorageDetailDto,
  GetSampleStorageListDto,
  UpdateSampleDto,
} from "../types/sampleStorage";

const BASE_URL = "/api/v1/sample-storage";

interface PagedResult<T> {
  items: T[];
  totalCount: number;
}

export const sampleStorageService = {
  /**
   * Lấy danh sách HĐ có mẫu (status >= SampleSent)
   */
  getList: async (
    params: GetSampleStorageListDto
  ): Promise<PagedResult<SampleStorageDto>> => {
    const response = await api.get<PagedResult<SampleStorageDto>>(BASE_URL, {
      params,
    });
    return response.data;
  },

  /**
   * Lấy chi tiết HĐ + danh sách mẫu
   */
  get: async (id: string): Promise<SampleStorageDetailDto> => {
    const response = await api.get<SampleStorageDetailDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Cập nhật thông tin mẫu
   */
  updateSample: async (
    sampleId: string,
    data: UpdateSampleDto
  ): Promise<void> => {
    await api.put(`${BASE_URL}/samples/${sampleId}`, data);
  },

  /**
   * Hủy 1 mẫu
   */
  cancelSample: async (sampleId: string): Promise<void> => {
    await api.post(`${BASE_URL}/samples/${sampleId}/cancel`);
  },

  /**
   * Hủy tất cả mẫu trong HĐ
   */
  cancelAllSamples: async (testRequestId: string): Promise<void> => {
    await api.post(`${BASE_URL}/${testRequestId}/cancel-all`);
  },
};

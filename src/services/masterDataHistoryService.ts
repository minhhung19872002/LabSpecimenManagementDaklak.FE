import api from './api';
import type {
  MasterDataChangeDto,
  MasterDataHistoryEntityType,
} from '../types/masterDataHistory';

const BASE_URL = '/api/v1/master-data-histories';

export const masterDataHistoryService = {
  /**
   * Lịch sử tạo / sửa / ngừng hoạt động / xóa của 1 bản ghi master data (mới nhất trước)
   */
  getList: async (
    entityType: MasterDataHistoryEntityType,
    entityId: string,
  ): Promise<MasterDataChangeDto[]> => {
    // Wrapper BE trả ListResultDto dạng mảng phẳng ({ data: [...] }) → interceptor unwrap thành mảng;
    // vẫn nhận dạng { items } phòng khi wrapper đổi
    const response = await api.get<MasterDataChangeDto[] | { items?: MasterDataChangeDto[] }>(
      `${BASE_URL}/${entityType}/${entityId}`,
    );
    const data = response.data;
    return Array.isArray(data) ? data : data?.items ?? [];
  },
};

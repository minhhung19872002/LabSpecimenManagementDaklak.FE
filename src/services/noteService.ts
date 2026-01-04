import api from './api';
import {
  NoteDto,
  CreateNoteDto,
  UpdateNoteDto,
  NoteFilterDto,
  PagedResultDto,
} from '../types/note';

const BASE_URL = '/api/v1/notes';

export const noteService = {
  /**
   * Lấy danh sách ghi chú có lọc và phân trang
   */
  getList: async (params: NoteFilterDto): Promise<PagedResultDto<NoteDto>> => {
    const response = await api.get<PagedResultDto<NoteDto>>(BASE_URL, { params });
    return response.data;
  },

  /**
   * Lấy chi tiết ghi chú theo ID
   */
  get: async (id: string): Promise<NoteDto> => {
    const response = await api.get<NoteDto>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Tạo ghi chú mới
   */
  create: async (data: CreateNoteDto): Promise<NoteDto> => {
    const response = await api.post<NoteDto>(BASE_URL, data);
    return response.data;
  },

  /**
   * Cập nhật ghi chú
   */
  update: async (id: string, data: UpdateNoteDto): Promise<NoteDto> => {
    const response = await api.put<NoteDto>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Xóa ghi chú
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Bật/tắt trạng thái hoạt động
   */
  toggleActive: async (id: string): Promise<NoteDto> => {
    const response = await api.put<NoteDto>(`${BASE_URL}/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Lấy danh sách ghi chú đang hoạt động (cho dropdown selection)
   */
  getActiveNotes: async (): Promise<NoteDto[]> => {
    const response = await api.get<NoteDto[]>(`${BASE_URL}/active`);
    return response.data;
  },
};

export default noteService;

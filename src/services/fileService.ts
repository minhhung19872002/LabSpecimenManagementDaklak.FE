import { api } from './api';

const BASE_URL = '/api/v1/files';

// ==================== DTOs ====================

export interface FileUploadResultDto {
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
}

export interface SampleAttachmentDto {
  id: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  url: string;
}

// ==================== File Service ====================

export const fileService = {
  /**
   * Upload a single image file
   * @param file File to upload (max 10MB, images only)
   * @returns Upload result with fileId and url
   */
  uploadImage: async (file: File): Promise<FileUploadResultDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.upload<FileUploadResultDto>(`${BASE_URL}/upload`, formData);
    return response.data;
  },

  /**
   * Upload multiple image files
   * @param files Array of files to upload
   * @returns Array of upload results
   */
  uploadMultipleImages: async (files: File[]): Promise<FileUploadResultDto[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    const response = await api.upload<FileUploadResultDto[]>(`${BASE_URL}/upload-multiple`, formData);
    return response.data;
  },

  /**
   * Get file URL by fileId
   * @param fileId File ID
   * @returns Full URL to access the file
   */
  getFileUrl: (fileId: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:44381';
    return `${baseUrl}${BASE_URL}/${fileId}`;
  },

  /**
   * Delete a file by fileId
   * @param fileId File ID to delete
   */
  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${fileId}`);
  },

  /**
   * Download a file by fileId
   * @param fileId File ID
   * @returns Blob data of the file
   */
  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await api.download(`${BASE_URL}/${fileId}`);
    return response.data;
  },

  /**
   * Validate if file is a valid image
   * @param file File to validate
   * @returns true if valid, false otherwise
   */
  isValidImage: (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  },

  /**
   * Get validation error message for file
   * @param file File to validate
   * @returns Error message or null if valid
   */
  getValidationError: (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Chỉ cho phép upload file hình ảnh (jpg, png, gif, bmp, webp)';
    }

    if (file.size > maxSize) {
      return 'Kích thước file không được vượt quá 10 MB';
    }

    return null;
  },

  /**
   * Format file size for display
   * @param bytes File size in bytes
   * @returns Formatted string (e.g., "1.5 MB")
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

export default fileService;

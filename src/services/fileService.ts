import { api } from './api';
import {
  addPendingFileUpload,
  getPendingFileUpload,
  getPendingFileUploads,
  updatePendingFileUploadStatus,
  removePendingFileUpload,
  regenerateLocalUrl,
  PendingFileUpload,
} from './offline/db';

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

export interface OfflineFileInfo {
  fileId: string; // tempId for offline files, actual fileId for uploaded files
  fileName: string;
  fileSize: number;
  url: string;
  isOffline: boolean;
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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
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

  // ==================== Offline-Aware Methods ====================

  /**
   * Check if online
   */
  isOnline: (): boolean => {
    return navigator.onLine;
  },

  /**
   * Upload image with offline support
   * If offline, stores blob locally and returns a temp result
   * @param file File to upload
   * @returns Upload result (real or offline)
   */
  uploadImageOffline: async (file: File): Promise<OfflineFileInfo> => {
    // Validate first
    const error = fileService.getValidationError(file);
    if (error) {
      throw new Error(error);
    }

    if (navigator.onLine) {
      try {
        const result = await fileService.uploadImage(file);
        return {
          fileId: result.fileId,
          fileName: result.fileName,
          fileSize: result.fileSize,
          url: fileService.getFileUrl(result.fileId),
          isOffline: false,
        };
      } catch (error) {
        console.warn('Online upload failed, storing offline:', error);
      }
    }

    // Store offline
    const pendingUpload = await addPendingFileUpload(file, file.name);
    return {
      fileId: pendingUpload.tempId,
      fileName: pendingUpload.fileName,
      fileSize: pendingUpload.fileSize,
      url: pendingUpload.localUrl,
      isOffline: true,
    };
  },

  /**
   * Upload multiple images with offline support
   * @param files Array of files to upload
   * @returns Array of upload results (real or offline)
   */
  uploadMultipleImagesOffline: async (files: File[]): Promise<OfflineFileInfo[]> => {
    const results: OfflineFileInfo[] = [];

    for (const file of files) {
      const result = await fileService.uploadImageOffline(file);
      results.push(result);
    }

    return results;
  },

  /**
   * Get file URL - handles both online and offline files
   * @param fileId File ID or temp ID
   * @returns URL to access the file
   */
  getFileUrlOffline: async (fileId: string): Promise<string> => {
    // Check if it's an offline file
    if (fileId.startsWith('offline-file-')) {
      const pending = await getPendingFileUpload(fileId);
      if (pending) {
        // Regenerate URL if blob exists (in case the URL was revoked)
        if (pending.blob && (!pending.localUrl || !pending.localUrl.startsWith('blob:'))) {
          const newUrl = await regenerateLocalUrl(fileId);
          if (newUrl) return newUrl;
        }
        return pending.localUrl;
      }
    }
    // Return online URL
    return fileService.getFileUrl(fileId);
  },

  /**
   * Check if a file ID is an offline file
   */
  isOfflineFile: (fileId: string): boolean => {
    return fileId.startsWith('offline-file-');
  },

  /**
   * Sync all pending file uploads
   * @returns Array of synced results with mapping from tempId to serverId
   */
  syncPendingUploads: async (): Promise<Array<{ tempId: string; serverId: string; success: boolean }>> => {
    if (!navigator.onLine) {
      return [];
    }

    const pending = await getPendingFileUploads();
    const results: Array<{ tempId: string; serverId: string; success: boolean }> = [];

    for (const item of pending) {
      try {
        await updatePendingFileUploadStatus(item.tempId, 'uploading');

        // Convert blob to File for upload
        const file = new File([item.blob], item.fileName, { type: item.mimeType });
        const uploadResult = await fileService.uploadImage(file);

        await updatePendingFileUploadStatus(item.tempId, 'uploaded', uploadResult.fileId);
        results.push({ tempId: item.tempId, serverId: uploadResult.fileId, success: true });
      } catch (error: any) {
        await updatePendingFileUploadStatus(
          item.tempId,
          item.retryCount >= 2 ? 'failed' : 'pending',
          undefined,
          error.message
        );
        results.push({ tempId: item.tempId, serverId: '', success: false });
      }
    }

    return results;
  },

  /**
   * Get pending upload info by temp ID
   */
  getPendingUpload: async (tempId: string): Promise<PendingFileUpload | undefined> => {
    return getPendingFileUpload(tempId);
  },

  /**
   * Remove a pending upload (e.g., when user removes the image)
   */
  removePendingUpload: async (tempId: string): Promise<void> => {
    await removePendingFileUpload(tempId);
  },
};

export default fileService;

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadResult {
  url: string;
  path: string;
  type: string;
  size: number;
  name: string;
}

class UploadService {
  private generateFileName(originalName: string, userId: string, taskId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    return `evidence/${userId}/${taskId}/${timestamp}_${originalName}`;
  }

  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: '文件大小不能超过10MB' };
    }

    // Check file type
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      // Audio
      'audio/mp3',
      'audio/wav',
      'audio/aac',
      'audio/ogg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支持的文件类型' };
    }

    return { valid: true };
  }

  async uploadFile(
    file: File,
    userId: string,
    taskId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // Generate unique file name
      const fileName = this.generateFileName(file.name, userId, taskId);
      const storageRef = ref(storage, fileName);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        url: downloadURL,
        path: fileName,
        type: file.type,
        size: file.size,
        name: file.name,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('文件上传失败，请重试');
    }
  }

  async uploadMultipleFiles(
    files: File[],
    userId: string,
    taskId: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadFile(
          file,
          userId,
          taskId,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        );
        results.push(result);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    }

    return results;
  }

  async uploadFileToBackend(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    // 校验文件类型和大小（与后端一致）
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png',
      'video/mp4', 'video/mov', 'video/webm',
    ];
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过100MB');
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件类型');
    }
    const formData = new FormData();
    formData.append('file', file);
    // 进度回调
    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.open('POST', '/api/daily-tasks/evidence/upload');
      xhr.responseType = 'json';
      xhr.onload = () => {
        if (xhr.status === 200 && xhr.response.success) {
          resolve(xhr.response.data);
        } else {
          reject(new Error(xhr.response?.error || '上传失败'));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误，上传失败'));
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress({
              bytesTransferred: event.loaded,
              totalBytes: event.total,
              progress: (event.loaded / event.total) * 100,
            });
          }
        };
      }
      xhr.send(formData);
    });
  }

  async uploadMultipleFilesToBackend(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadFileToBackend(
          file,
          onProgress ? (progress) => onProgress(i, progress) : undefined
        );
        results.push(result);
      } catch (error) {
        throw error;
      }
    }
    return results;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('文件删除失败');
    }
  }

  getFileType(fileName: string): 'image' | 'video' | 'audio' | 'unknown' {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExts = ['mp3', 'wav', 'aac', 'ogg'];

    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    return 'unknown';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const uploadService = new UploadService();
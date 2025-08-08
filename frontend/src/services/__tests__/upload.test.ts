import { uploadService } from '../upload';

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    test('accepts valid image files', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = (uploadService as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('accepts valid video files', () => {
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      const result = (uploadService as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('accepts valid audio files', () => {
      const file = new File([''], 'test.mp3', { type: 'audio/mp3' });
      const result = (uploadService as any).validateFile(file);
      expect(result.valid).toBe(true);
    });

    test('rejects files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = (uploadService as any).validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('文件大小不能超过10MB');
    });

    test('rejects unsupported file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const result = (uploadService as any).validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('不支持的文件类型');
    });
  });

  describe('generateFileName', () => {
    test('generates correct file path structure', () => {
      const fileName = (uploadService as any).generateFileName(
        'test.jpg',
        'user123',
        'task456'
      );
      expect(fileName).toMatch(/^evidence\/user123\/task456\/\d+_test\.jpg$/);
    });

    test('includes timestamp in filename', () => {
      const originalNow = Date.now;
      Date.now = jest.fn(() => 1234567890);

      const fileName = (uploadService as any).generateFileName(
        'test.jpg',
        'user123',
        'task456'
      );
      expect(fileName).toBe('evidence/user123/task456/1234567890_test.jpg');

      Date.now = originalNow;
    });
  });

  describe('getFileType', () => {
    test('correctly identifies image files', () => {
      expect(uploadService.getFileType('photo.jpg')).toBe('image');
      expect(uploadService.getFileType('image.png')).toBe('image');
      expect(uploadService.getFileType('picture.gif')).toBe('image');
    });

    test('correctly identifies video files', () => {
      expect(uploadService.getFileType('video.mp4')).toBe('video');
      expect(uploadService.getFileType('movie.avi')).toBe('video');
      expect(uploadService.getFileType('clip.mov')).toBe('video');
    });

    test('correctly identifies audio files', () => {
      expect(uploadService.getFileType('song.mp3')).toBe('audio');
      expect(uploadService.getFileType('sound.wav')).toBe('audio');
      expect(uploadService.getFileType('audio.aac')).toBe('audio');
    });

    test('returns unknown for unsupported files', () => {
      expect(uploadService.getFileType('document.pdf')).toBe('unknown');
      expect(uploadService.getFileType('text.txt')).toBe('unknown');
    });

    test('handles files without extensions', () => {
      expect(uploadService.getFileType('filename')).toBe('unknown');
    });

    test('handles case insensitive extensions', () => {
      expect(uploadService.getFileType('photo.JPG')).toBe('image');
      expect(uploadService.getFileType('video.MP4')).toBe('video');
    });
  });

  describe('formatFileSize', () => {
    test('formats bytes correctly', () => {
      expect(uploadService.formatFileSize(0)).toBe('0 B');
      expect(uploadService.formatFileSize(500)).toBe('500 B');
    });

    test('formats kilobytes correctly', () => {
      expect(uploadService.formatFileSize(1024)).toBe('1 KB');
      expect(uploadService.formatFileSize(1536)).toBe('1.5 KB');
    });

    test('formats megabytes correctly', () => {
      expect(uploadService.formatFileSize(1048576)).toBe('1 MB');
      expect(uploadService.formatFileSize(2097152)).toBe('2 MB');
    });

    test('formats gigabytes correctly', () => {
      expect(uploadService.formatFileSize(1073741824)).toBe('1 GB');
    });

    test('handles decimal places correctly', () => {
      expect(uploadService.formatFileSize(1536)).toBe('1.5 KB');
      expect(uploadService.formatFileSize(1638400)).toBe('1.56 MB');
    });
  });
});
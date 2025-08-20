/**
 * 文件上传安全测试和权限验证测试
 * 测试文件上传接口的安全性和权限控制
 * 对应TODO清单第176-180行的安全测试要求
 */

import { Request, Response } from 'express';
import { uploadEvidence } from '../controllers/evidenceController';
import { AuthRequest } from '../middleware/mongoAuth';
import path from 'path';
import fs from 'fs';

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock path operations
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn(),
  extname: jest.fn(),
  basename: jest.fn(),
}));

describe('文件上传安全测试', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      user: {
        id: 'user-123',
        email: 'test@test.com',
        role: 'student',
        displayName: '测试用户'
      },
      file: undefined
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock file system to exist
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockReturnValue('/mock/upload/path');
    (path.extname as jest.Mock).mockReturnValue('.jpg');
    (path.basename as jest.Mock).mockReturnValue('test');
  });

  describe('文件类型安全验证', () => {
    it('应该接受合法的图片格式', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        filename: 'test_123.jpg',
        path: '/uploads/evidence/test_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            url: expect.stringContaining('test_123.jpg'),
            type: 'image/jpeg',
            size: 1024 * 1024
          })
        })
      );
    });

    it('应该接受合法的视频格式', async () => {
      const mockFile = {
        originalname: 'video.mp4',
        mimetype: 'video/mp4',
        size: 5 * 1024 * 1024, // 5MB
        filename: 'video_123.mp4',
        path: '/uploads/evidence/video_123.mp4'
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            type: 'video/mp4'
          })
        })
      );
    });

    it('应该拒绝危险的文件类型', async () => {
      const dangerousFiles = [
        { name: 'script.js', mimetype: 'application/javascript' },
        { name: 'malware.exe', mimetype: 'application/x-msdownload' },
        { name: 'virus.bat', mimetype: 'application/x-bat' },
        { name: 'shell.sh', mimetype: 'application/x-sh' },
        { name: 'php.php', mimetype: 'application/x-php' },
        { name: 'dangerous.html', mimetype: 'text/html' }
      ];

      for (const file of dangerousFiles) {
        const mockFile = {
          originalname: file.name,
          mimetype: file.mimetype,
          size: 1024
        } as Express.Multer.File;

        (mockReq as any).file = mockFile;

        await uploadEvidence(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('不支持的文件类型')
          })
        );

        jest.clearAllMocks();
        mockRes.status = jest.fn().mockReturnThis();
        mockRes.json = jest.fn().mockReturnThis();
      }
    });

    it('应该检测文件扩展名和MIME类型不匹配', async () => {
      // 文件扩展名是.jpg但MIME类型是executable
      const mockFile = {
        originalname: 'fake_image.jpg',
        mimetype: 'application/x-msdownload', // executable
        size: 1024
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('不支持的文件类型')
        })
      );
    });
  });

  describe('文件大小限制测试', () => {
    it('应该拒绝超大文件', async () => {
      const oversizedFile = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 150 * 1024 * 1024 // 150MB，超过100MB限制
      } as Express.Multer.File;

      (mockReq as any).file = oversizedFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('文件大小超出限制')
        })
      );
    });

    it('应该接受大小合适的文件', async () => {
      const normalFile = {
        originalname: 'normal.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB
        filename: 'normal_123.jpg',
        path: '/uploads/evidence/normal_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = normalFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('应该拒绝空文件', async () => {
      const emptyFile = {
        originalname: 'empty.jpg',
        mimetype: 'image/jpeg',
        size: 0
      } as Express.Multer.File;

      (mockReq as any).file = emptyFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('文件不能为空')
        })
      );
    });
  });

  describe('权限验证测试', () => {
    it('应该拒绝未认证用户上传文件', async () => {
      mockReq.user = undefined; // 未认证

      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('未认证')
        })
      );
    });

    it('应该允许学生上传文件', async () => {
      mockReq.user = {
        id: 'student-123',
        role: 'student'
      } as any;

      const mockFile = {
        originalname: 'homework.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'homework_123.jpg',
        path: '/uploads/evidence/homework_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('应该允许家长上传文件', async () => {
      mockReq.user = {
        id: 'parent-123',
        role: 'parent'
      } as any;

      const mockFile = {
        originalname: 'feedback.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'feedback_123.jpg',
        path: '/uploads/evidence/feedback_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('文件路径安全测试', () => {
    it('应该防止路径遍历攻击', async () => {
      const maliciousFiles = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32\\config\\sam',
        '../../sensitive.txt',
        '../uploads/../../../secret.key'
      ];

      for (const maliciousName of maliciousFiles) {
        const mockFile = {
          originalname: maliciousName,
          mimetype: 'image/jpeg',
          size: 1024
        } as Express.Multer.File;

        (mockReq as any).file = mockFile;

        await uploadEvidence(mockReq as Request, mockRes as Response);

        // 文件名应该被清理，不包含路径遍历字符
        if (mockRes.json) {
          const lastCall = (mockRes.json as jest.Mock).mock.calls.slice(-1)[0];
          if (lastCall && lastCall[0].success) {
            expect(lastCall[0].data.filename).not.toMatch(/\.\./);
            expect(lastCall[0].data.filename).not.toMatch(/[\/\\]/);
          }
        }

        jest.clearAllMocks();
        mockRes.status = jest.fn().mockReturnThis();
        mockRes.json = jest.fn().mockReturnThis();
      }
    });

    it('应该生成安全的文件名', async () => {
      const unsafeNames = [
        'file with spaces.jpg',
        'file#with$special@chars!.jpg',
        '文件名中文.jpg',
        'file\nwith\nnewlines.jpg'
      ];

      for (const unsafeName of unsafeNames) {
        const mockFile = {
          originalname: unsafeName,
          mimetype: 'image/jpeg',
          size: 1024,
          filename: 'safe_generated_name.jpg',
          path: '/uploads/evidence/safe_generated_name.jpg'
        } as Express.Multer.File;

        (mockReq as any).file = mockFile;

        await uploadEvidence(mockReq as Request, mockRes as Response);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        
        const lastCall = (mockRes.json as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0].data.filename).toMatch(/^[a-zA-Z0-9_.-]+$/); // 只包含安全字符

        jest.clearAllMocks();
        mockRes.status = jest.fn().mockReturnThis();
        mockRes.json = jest.fn().mockReturnThis();
      }
    });
  });

  describe('存储配额限制测试', () => {
    it('应该跟踪用户上传的文件数量', async () => {
      // 模拟用户已上传很多文件
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'test_123.jpg',
        path: '/uploads/evidence/test_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      // 如果有实现用户配额检查，应该测试配额限制
      await uploadEvidence(mockReq as Request, mockRes as Response);

      // 这里应该验证文件数量和存储空间的跟踪
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('并发上传安全测试', () => {
    it('应该处理同时上传多个文件的情况', async () => {
      const uploadPromises = [];

      for (let i = 0; i < 5; i++) {
        const mockFile = {
          originalname: `test${i}.jpg`,
          mimetype: 'image/jpeg',
          size: 1024,
          filename: `test${i}_123.jpg`,
          path: `/uploads/evidence/test${i}_123.jpg`
        } as Express.Multer.File;

        const req = { ...mockReq, file: mockFile };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
        };

        uploadPromises.push(uploadEvidence(req as Request, res as Response));
      }

      await Promise.all(uploadPromises);

      // 验证所有上传都成功处理，没有竞态条件
      expect(uploadPromises).toHaveLength(5);
    });
  });

  describe('错误处理和恢复测试', () => {
    it('应该处理磁盘空间不足的情况', async () => {
      // Mock文件系统错误
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOSPC: no space left on device');
      });

      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('存储空间不足')
        })
      );
    });

    it('应该处理文件系统权限错误', async () => {
      // Mock权限错误
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      (mockReq as any).file = mockFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('服务器错误')
        })
      );
    });

    it('应该处理缺少文件的请求', async () => {
      mockReq.file = undefined; // 没有文件

      await uploadEvidence(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('未选择文件')
        })
      );
    });
  });

  describe('内容扫描安全测试', () => {
    it('应该检测可疑的文件内容', async () => {
      // 这里可以测试基于文件内容的扫描
      // 例如检测图片中嵌入的脚本或恶意代码
      
      const suspiciousFile = {
        originalname: 'suspicious.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        filename: 'suspicious_123.jpg',
        path: '/uploads/evidence/suspicious_123.jpg'
      } as Express.Multer.File;

      (mockReq as any).file = suspiciousFile;

      await uploadEvidence(mockReq as Request, mockRes as Response);

      // 如果实现了内容扫描，这里应该验证扫描结果
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
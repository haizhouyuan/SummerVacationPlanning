import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 支持的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mov', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// 创建本地存储目录
const evidenceDir = path.join(__dirname, '../../uploads/evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Multer 存储配置
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, evidenceDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const timestamp = Date.now();
    cb(null, `${timestamp}_${base}${ext}`);
  },
});

// 文件类型校验
function fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (
    ALLOWED_IMAGE_TYPES.includes(file.mimetype) ||
    ALLOWED_VIDEO_TYPES.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG 图片和 MP4/MOV/WEBM 视频格式'));
  }
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// 单文件上传接口
export const uploadEvidence = (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    return res.status(400).json({ success: false, error: '未检测到上传文件' });
  }
  const { filename, mimetype, size, path: filePath } = file;
  // 生成可访问 URL（假设静态服务 /uploads）
  const url = `/uploads/evidence/${filename}`;
  let type: 'image' | 'video' = 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) type = 'video';
  return res.status(200).json({
    success: true,
    data: {
      filename,
      url,
      size,
      type,
      mimetype,
    },
    message: '文件上传成功',
  });
}; 
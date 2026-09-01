const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');
const { ApiError } = require('../util');
const config = require('../config');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

fs.mkdirSync(config.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ALLOWED_EXT.has(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${randomBytes(4).toString('hex')}${safe}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new ApiError(400, `Unsupported image type: ${file.mimetype || 'unknown'}. Use JPG, PNG, WEBP or GIF.`));
  }
  if (!ALLOWED_EXT.has(path.extname(file.originalname || '').toLowerCase())) {
    return cb(new ApiError(400, 'Invalid file extension. Use JPG, PNG, WEBP or GIF.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024, files: 8 },
});

module.exports = { upload, ALLOWED_MIME, ALLOWED_EXT };
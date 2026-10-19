const multer = require('multer');

// Memory storage is essential for Vercel serverless environments
// It keeps the file buffer in memory so it can be streamed directly to Supabase Storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30 MB max file size
  }
});

module.exports = upload;

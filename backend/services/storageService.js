const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ootnhbdzmotfplowhbty.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents';

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Generate a secure time-limited signed URL for private bucket objects
 * @param {String} storageKey - Path within the bucket
 * @param {Number} expiresIn - Seconds before expiration (default: 86400 = 24 hours)
 */
async function getSignedUrl(storageKey, expiresIn = 86400) {
  if (!supabase || !storageKey) return null;
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(storageKey, expiresIn);

    if (error) {
      console.warn('Supabase signed URL warning:', error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.warn('Supabase getSignedUrl exception:', err.message);
    return null;
  }
}

/**
 * Upload a file buffer to Supabase Private Storage (with local disk fallback for offline development)
 * @param {Object} file - Multer file object containing .buffer, .originalname, .mimetype, .size
 * @param {String} subfolder - Category folder e.g. 'documents', 'surveys', 'settings'
 * @param {Object} req - Express request object (optional, for host URL construction in local mode)
 * @returns {Promise<{fileUrl: string, storageKey: string, fileType: string, fileSize: number}>}
 */
async function uploadFileBuffer(file, subfolder = 'documents', req = null) {
  if (!file) return null;

  const ext = path.extname(file.originalname || '').toLowerCase();
  const rawName = path.basename(file.originalname || 'file', ext);
  const sanitizedBase = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  const filename = `${sanitizedBase}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext || '.bin'}`;
  const storagePath = `${subfolder}/${filename}`;

  // 1. SUPABASE PRIVATE OBJECT STORAGE (Serverless & Vercel Production)
  if (supabase) {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: true
      });

    if (error) {
      console.error('Supabase Storage upload error:', error.message);
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    // Generate secure 7-day signed URL for private bucket
    const signedUrl = await getSignedUrl(storagePath, 86400 * 7);

    return {
      fileUrl: signedUrl || storagePath,
      storageKey: storagePath,
      fileType: file.mimetype,
      fileSize: file.size
    };
  }

  // 2. LOCAL DISK FALLBACK (For offline local development prior to entering SUPABASE_KEY)
  const localDir = path.join(__dirname, '..', 'uploads', subfolder);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localFilePath = path.join(localDir, filename);
  fs.writeFileSync(localFilePath, file.buffer);

  let fileUrl = `/uploads/${subfolder}/${filename}`;
  if (req && req.protocol && req.get) {
    fileUrl = `${req.protocol}://${req.get('host')}/uploads/${subfolder}/${filename}`;
  }

  return {
    fileUrl,
    storageKey: storagePath,
    fileType: file.mimetype,
    fileSize: file.size
  };
}

module.exports = {
  uploadFileBuffer,
  getSignedUrl,
  supabase,
  SUPABASE_URL,
  SUPABASE_BUCKET
};

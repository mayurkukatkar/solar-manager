const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'solar-erp/uploads';
    if (req.originalUrl.includes('/surveys')) folder = 'solar-erp/surveys';
    if (req.originalUrl.includes('/invoices')) folder = 'solar-erp/invoices';
    if (req.originalUrl.includes('/quotations')) folder = 'solar-erp/quotations';
    if (req.originalUrl.includes('/documents')) folder = 'solar-erp/documents';
    
    return {
      folder: folder,
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf']
    };
  }
});

const upload = multer({ storage: storage });

module.exports = upload;

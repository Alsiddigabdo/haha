const multer = require('multer');
const cloudinary = require('./cloudinaryConfig');

// إعداد Multer مع الذاكرة
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // حد أقصى 10 ميجابايت
  },
  fileFilter: (req, file, cb) => {
    // التحقق من نوع الملف
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يسمح فقط بملفات الصور'), false);
    }
  }
});

// دالة مساعدة لرفع الصورة إلى Cloudinary
const uploadToCloudinary = (buffer, folder = 'ihobe-uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [{ width: 800, height: 800, crop: 'limit' }]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// دالة مساعدة لرفع ملف واحد
const uploadSingleFile = async (file, folder = 'ihobe-uploads') => {
  try {
    const result = await uploadToCloudinary(file.buffer, folder);
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// دالة مساعدة لرفع عدة ملفات
const uploadMultipleFiles = async (files, folder = 'ihobe-uploads') => {
  const results = [];
  
  for (const file of files) {
    const result = await uploadSingleFile(file, folder);
    results.push(result);
  }
  
  return results;
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadSingleFile,
  uploadMultipleFiles
};



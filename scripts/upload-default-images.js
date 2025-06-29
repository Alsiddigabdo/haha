const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: 'dyftlowtv',
  api_key: '611352352948995',
  api_secret: '9rEZK2K5yAafu9hqq4LlmGhMuF8',
});

// قائمة الصور الافتراضية المطلوبة
const defaultImages = [
  { name: 'default-avatar', file: 'find.png' },
  { name: 'default-logo', file: 'find.png' },
  { name: 'default-ad', file: 'find.png' },
  { name: 'default-post', file: 'find.png' },
  { name: 'default-design', file: 'find.png' },
  { name: 'default-product', file: 'find.png' },
  { name: 'default-store', file: 'find.png' },
  { name: 'default-job', file: 'find.png' },
  { name: 'default-notification', file: 'find.png' }
];

async function uploadDefaultImages() {
  console.log('بدء رفع الصور الافتراضية إلى Cloudinary...');
  
  for (const image of defaultImages) {
    try {
      const imagePath = path.join(__dirname, '../public/images', image.file);
      
      if (fs.existsSync(imagePath)) {
        const result = await cloudinary.uploader.upload(imagePath, {
          public_id: `ihobe-uploads/${image.name}`,
          folder: 'ihobe-uploads',
          overwrite: true
        });
        
        console.log(`✅ تم رفع ${image.name}: ${result.secure_url}`);
      } else {
        console.log(`❌ الملف غير موجود: ${imagePath}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في رفع ${image.name}:`, error.message);
    }
  }
  
  console.log('تم الانتهاء من رفع الصور الافتراضية!');
}

// تشغيل السكريبت
uploadDefaultImages(); 
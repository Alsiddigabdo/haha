const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// إعداد Cloudinary
cloudinary.config({
  cloud_name: 'dyftlowtv',
  api_key: '611352352948995',
  api_secret: '9rEZK2K5yAafu9hqq4LlmGhMuF8',
});

async function testUpload() {
  try {
    console.log('بدء اختبار رفع صورة إلى Cloudinary...');
    
    const imagePath = path.join(__dirname, '../public/images/find.png');
    console.log('مسار الصورة:', imagePath);
    console.log('الملف موجود:', fs.existsSync(imagePath));
    
    if (fs.existsSync(imagePath)) {
      const result = await cloudinary.uploader.upload(imagePath, {
        public_id: 'ihobe-uploads/test-image',
        folder: 'ihobe-uploads',
        overwrite: true
      });
      
      console.log('✅ تم رفع الصورة بنجاح!');
      console.log('الرابط:', result.secure_url);
    } else {
      console.log('❌ الملف غير موجود');
    }
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testUpload(); 
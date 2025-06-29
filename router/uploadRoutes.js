const express = require('express');
const router = express.Router();
const { upload, uploadSingleFile, uploadMultipleFiles } = require('../config/multerConfig');
const requireLogin = require('../middleware/requireLogin');

// رفع صورة واحدة
router.post('/upload/single', requireLogin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم رفع أي صورة' 
      });
    }

    // رفع الصورة إلى Cloudinary
    const result = await uploadSingleFile(req.file);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'فشل في رفع الصورة إلى Cloudinary',
        error: result.error
      });
    }

    res.json({
      success: true,
      imageUrl: result.url,
      publicId: result.public_id,
      format: result.format,
      size: result.size,
      message: 'تم رفع الصورة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الصورة'
    });
  }
});

// رفع عدة صور
router.post('/upload/multiple', requireLogin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم رفع أي صور' 
      });
    }

    // رفع الصور إلى Cloudinary
    const results = await uploadMultipleFiles(req.files);
    
    // التحقق من نجاح جميع الرفعات
    const failedUploads = results.filter(result => !result.success);
    if (failedUploads.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'فشل في رفع بعض الصور',
        errors: failedUploads.map(r => r.error)
      });
    }

    const imageUrls = results.map(result => ({
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      size: result.size
    }));

    res.json({
      success: true,
      images: imageUrls,
      message: `تم رفع ${req.files.length} صور بنجاح`
    });
  } catch (error) {
    console.error('خطأ في رفع الصور:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الصور'
    });
  }
});

// رفع صورة بروفايل
router.post('/upload/avatar', requireLogin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم رفع أي صورة' 
      });
    }

    // رفع الصورة إلى Cloudinary في مجلد avatars
    const result = await uploadSingleFile(req.file, 'ihobe-avatars');
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'فشل في رفع صورة البروفايل إلى Cloudinary',
        error: result.error
      });
    }

    res.json({
      success: true,
      avatarUrl: result.url,
      publicId: result.public_id,
      format: result.format,
      size: result.size,
      message: 'تم رفع صورة البروفايل بنجاح'
    });
  } catch (error) {
    console.error('خطأ في رفع صورة البروفايل:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع صورة البروفايل'
    });
  }
});

// رفع صور المشاريع
router.post('/upload/project', requireLogin, upload.array('projectImages', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم رفع أي صور للمشروع' 
      });
    }

    // رفع الصور إلى Cloudinary في مجلد projects
    const results = await uploadMultipleFiles(req.files, 'ihobe-projects');
    
    // التحقق من نجاح جميع الرفعات
    const failedUploads = results.filter(result => !result.success);
    if (failedUploads.length > 0) {
      return res.status(500).json({
        success: false,
        message: 'فشل في رفع بعض صور المشروع',
        errors: failedUploads.map(r => r.error)
      });
    }

    const projectImages = results.map(result => ({
      url: result.url,
      publicId: result.public_id,
      format: result.format,
      size: result.size
    }));

    res.json({
      success: true,
      projectImages: projectImages,
      message: `تم رفع ${req.files.length} صور للمشروع بنجاح`
    });
  } catch (error) {
    console.error('خطأ في رفع صور المشروع:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع صور المشروع'
    });
  }
});

module.exports = router; 
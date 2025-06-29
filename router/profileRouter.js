const express = require("express");
const router = express.Router();
const ProfileControllers = require("../controllers/ProfileControllers");
const { upload, uploadSingleFile } = require("../config/multerConfig");
const path = require("path");
const verifyToken = require("../middleware/verifyToken");

// مسار عرض صفحة الملف الشخصي
router.get("/profile", verifyToken, ProfileControllers.GetProfileControllers);

// مسار عرض صفحة تعديل الملف الشخصي
router.get("/updateProfile", verifyToken, ProfileControllers.GetUpdateProfileControllers);

// مسار تحديث الملف الشخصي
router.post(
  "/updateProfile",
  verifyToken,
  upload.single("avatar"), // التعامل مع رفع الصورة
  ProfileControllers.UpdateProfileControllers
);

// مسار تبديل الإعجاب
router.post("/profile/like", verifyToken, ProfileControllers.toggleLike);

// مسار إدارة طلبات الصداقة
router.post("/profile/friend-action", verifyToken, ProfileControllers.handleFriendAction);

// مسار تحديث الاقتباس
router.post("/profile/update-quote", verifyToken, ProfileControllers.updateQuote);

// مسارات معرض التصميم
router.post("/profile/design/add", verifyToken, upload.single("image"), ProfileControllers.addDesign);
router.post("/profile/design/delete/:designId", verifyToken, ProfileControllers.deleteDesign);

// مسار للحصول على بيانات التقييم المفصلة
router.get("/profile/ranking-details", verifyToken, ProfileControllers.getRankingDetails);

module.exports = router;


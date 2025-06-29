const express = require("express");
const router = express.Router();
const MessagesProjectController = require("../controllers/MessagesProjectController");
const verifyToken = require("../middleware/verifyToken");
const { upload } = require("../config/multerConfig");

// مسار إرسال رسالة
router.post("/send-message", verifyToken, upload.single("image"), MessagesProjectController.sendMessage);

// مسار جلب الرسائل بناءً على conversationId (API)
router.get("/api/messages/:conversationId", verifyToken, MessagesProjectController.getMessages);

// مسار عرض صفحة المحادثة
router.get("/messages/:conversationId", verifyToken, MessagesProjectController.showConversation);

module.exports = router;
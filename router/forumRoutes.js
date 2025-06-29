const express = require("express");
const router = express.Router();
const ForumController = require("../controllers/ForumController");
const fs = require("fs");
const { upload } = require("../config/multerConfig");
const path = require("path");
const verifyToken = require("../middleware/verifyToken");

router.get("/", ForumController.getAllPosts);
router.post("/post", verifyToken, upload.array("postImages", 4), ForumController.addPost);
router.get("/post/:postId/edit", verifyToken, ForumController.editPostForm);
router.post("/post/:postId/edit", verifyToken, upload.array("postImages", 4), ForumController.updatePost);
router.post("/post/:id/delete", verifyToken, ForumController.deletePost);
router.post("/toggle-like/:id", verifyToken, ForumController.toggleLike);
router.post("/post/:id/hide", verifyToken, ForumController.hidePost);
router.post("/comments/:postId/add", verifyToken, ForumController.addComment);
router.get("/comments/:postId", ForumController.getComments);
router.post("/comments/:commentId/like", verifyToken, ForumController.toggleLikeComment);
router.get("/post/:postId", ForumController.getPostDetails);
router.post("/ad", verifyToken, upload.single("image"), ForumController.addAd);
router.get("/my-posts", verifyToken, ForumController.getUserPosts);

module.exports = router;


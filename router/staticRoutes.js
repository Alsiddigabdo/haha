const express = require('express');
const path = require('path');
const router = express.Router();

// راوتر للملفات الثابتة
router.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, '../public/images', filename);
  res.sendFile(imagePath);
});

router.get('/icons/:filename', (req, res) => {
  const filename = req.params.filename;
  const iconPath = path.join(__dirname, '../public/icons', filename);
  res.sendFile(iconPath);
});

router.get('/favicon/:filename', (req, res) => {
  const filename = req.params.filename;
  const faviconPath = path.join(__dirname, '../public/favicon', filename);
  res.sendFile(faviconPath);
});

module.exports = router; 
const express = require('express');
const { protect, organizerOnly } = require('../middlewares/auth');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const { uploadSingle } = require('../middlewares/upload');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

const router = express.Router();

router.post(
  '/image',
  protect,
  organizerOnly,
  uploadLimiter,
  uploadSingle,
  uploadImage
);

router.delete(
  '/:filename',
  protect,
  organizerOnly,
  deleteImage
);

module.exports = router;

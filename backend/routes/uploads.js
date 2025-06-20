const express = require('express');
const multer = require('multer');
const UploadController = require('../controllers/upload-controller');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

/**
 * 이미지 업로드 API
 * POST /images
 */
router.post('/', upload.array('files'), UploadController.uploadImage);

module.exports = router;
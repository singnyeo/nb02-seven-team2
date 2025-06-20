const express = require('express');
const multer = require('multer')
const path = require('path');
const prisma = require('../utils/db');
const bucket = require('../utils/firebaseConfig.js');

/**
 * 이미지 업로드
 * POST /images
 */
class UploadConrtoller {
  // static async imageUpload(req, res, next) {
  //   try {
  static async uploadImage(req, res, next) {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '파일이 업로드되지 않았습니다.',
        });
      }

      const fileUrls = await Promise.all(files.map(async file => {
        // Firebase Storage에 바로 업로드
        const destination = `uploads/${Date.now()}-${file.originalname}`;
        const fileUpload = bucket.file(destination);

        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
          },
        });
      
        const [url] = await fileUpload.getSignedUrl({
          action: 'read',
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        });

        return url;
      }));

      res.status(200).json({
        urls: fileUrls,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UploadConrtoller;
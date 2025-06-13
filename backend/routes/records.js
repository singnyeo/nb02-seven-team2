const express = require('express');
const RecordsController = require('../controllers/records-controller');

const router = express.Router();

/**
 * 운동 기록 목록 조회 API
 * GET /:groupId/records
 */
router.get('/:groupId/records', RecordsController.getGroupRecords);

module.exports = router;
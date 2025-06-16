const express = require('express');
const RecordsController = require('../controllers/records-view-controller');

const router = express.Router();

/**
 * 그룹 랭킹 조회 API
 * GET /:groupId/rank
 */
router.get('/:groupId/rank', RecordViewController.getRank);

/**
 * 운동 기록 상세 조회 API
 * GET /:groupId/records/:recordId
 */
router.get('/:groupId/records/:recordId', RecordViewController.getRecordById);

module.exports = router;
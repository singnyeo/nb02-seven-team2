const express = require('express');
const RecordViewController = require('../controllers/records-view-controller');
const RecordsController = require('../controllers/records-controller');

const router = express.Router({ mergeParams: true });

/**
 * 그룹 랭킹 조회 API
 * GET /groups/:groupId/rank
 */
router.get('/rank', RecordViewController.getRank);

/**
 * 운동 기록 상세 조회 API
 * GET /groups/:groupId/records/:recordId
 */
router.get('/records/:recordId', RecordViewController.getRecordById);

/**
 * 운동 기록 목록 조회 API
 * GET /:groupId/records
 */
router.get('/records', RecordsController.getGroupRecords);

// 그룹 기록 생성
// POST /groups/:groupId/records
router.post('/records', RecordsController.createGroupRecord);

module.exports = router;
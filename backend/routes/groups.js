const express = require('express');
const groupController = require('../controllers/group-controller');

const router = express.Router();

/**
 * 그룹 추천 API (좋아요)
 * POST /groups/:groupId/likes
 */
router.post('/:groupId/likes', groupController.recommendGroup);

/**
 * 그룹 추천 취소 API (좋아요 취소)
 * DELETE /groups/:groupId/likes
 */
router.delete('/:groupId/likes', groupController.unrecommendGroup);

module.exports = router;
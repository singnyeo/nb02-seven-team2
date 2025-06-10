const express = require('express');
const GroupController = require('../controllers/GroupController');

const router = express.Router();

/**
 * 그룹 추천 API
 * POST /api/groups/:id/likes    // ← recommend를 likes로 변경
 */
router.post('/:id/likes', GroupController.recommendGroup);    // ← 여기

/**
 * 그룹 추천 취소 API
 * DELETE /api/groups/:id/likes  // ← recommend를 likes로 변경
 */
router.delete('/:id/likes', GroupController.unrecommendGroup);  // ← 여기

module.exports = router;
const express = require('express');
const GroupController = require('../controllers/GroupController');

const router = express.Router();

/**
 * 그룹 추천 API
 * POST /api/groups/:id/recommend
 */
router.post('/:id/recommend', GroupController.recommendGroup);

/**
 * 그룹 추천 취소 API
 * DELETE /api/groups/:id/recommend
 */
router.delete('/:id/recommend', GroupController.unrecommendGroup);

module.exports = router;
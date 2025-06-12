const express = require('express');
const GroupController = require('../controllers/group-controller');
const GroupParticipantController = require('../controllers/group-participant-controller');
const groupDataValidation = require('../middlewares/validation-check');

const router = express.Router();

/**
 * 그룹 목록 조회 API
 * GET /groups
 */
router.get('/', GroupController.getGroups);

/**
 * 그룹 상세 조회 API
 * GET /groups/:groupId
 */
router.get('/:groupId', GroupController.getGroupById);

/**
 * 그룹 추천 API (좋아요)
 * POST /groups/:groupId/likes
 */
router.post('/:groupId/likes', GroupController.recommendGroup);

/**
 * 그룹 추천 취소 API (좋아요 취소)
 * DELETE /groups/:groupId/likes
 */
router.delete('/:groupId/likes', GroupController.unrecommendGroup);

/**
 * 그룹 참여 관련 API
 */
router
  .route('/:groupId/participants')
  .post(groupDataValidation, GroupParticipantController.postGroupParticipant)  // 그룹 참여 API
  .delete(groupDataValidation, GroupParticipantController.deleteGroupParticipant); // 그룹 참여 취소 API

module.exports = router;
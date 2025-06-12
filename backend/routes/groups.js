const express = require('express');
const groupController = require('../controllers/group-controller');
const GroupParticipantController = require('../controllers/group-participant-controller');

const groupDataValidation = require('../middlewares/validation-check');

const router = express.Router();

/**
 * 그룹 목록 조회 API
 * GET /groups
 */
router.get('/', groupController.getGroups);

/**
 * 그룹 상세 조회 API
 * GET /groups/:groupId
 */
router.get('/:groupId', groupController.getGroupById);



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

router
  .route('/:groupId/participants')
  .post(groupDataValidation, GroupParticipantController.postGroupParticipant)// 그룹 참여 API
  .delete(groupDataValidation, GroupParticipantController.deleteGroupParticipant);// 그룹 참여 취소 API

module.exports = router;


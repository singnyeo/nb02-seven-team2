const express = require('express');
const GroupController = require('../controllers/group-controller');
const GroupParticipantController = require('../controllers/group-participant-controller');
const groupDataValidation = require('../middlewares/validation-check');
const recordRouter = require('./records');

const router = express.Router({ mergeParams: true });

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
router.delete('/:groupId/likes', GroupController.unrecommendGroup); //GroupController로 대문자 변경

/**
 * 그룹 참여 API
 * POST /groups/:groupId/participants
 * 그룹 참여 취소 API
 * DELETE /groups/:groupId/participants
 */
router
  .route('/:groupId/participants')
  .post(groupDataValidation, GroupParticipantController.postGroupParticipant) // 그룹 참여 API
  .delete(groupDataValidation, GroupParticipantController.deleteGroupParticipant); // 그룹 참여 취소 API

/**
 * 그룹 생성 API
 * POST /groups
 */
router.post('/', GroupController.postGroup);

/**
 * 그룹 수정 API
 * PATCH /groups/:groupId
 */
router.patch('/:groupId', GroupController.patchGroup);

/**
 * 그룹 삭제 API
 * DELETE /groups/:groupId
 */
router.delete('/:groupId', GroupController.deleteGroup);

// 그룹 ID를 기준으로 하는 기록 관련 하위 라우터 연결
router.use('/:groupId', recordRouter);

module.exports = router;
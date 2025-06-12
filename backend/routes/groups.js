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


router
  .route('/:groupId/participants')
  .post(groupDataValidation, GroupParticipantController.postGroupParticipant)// 그룹 참여 API
  .delete(groupDataValidation, GroupParticipantController.deleteGroupParticipant);// 그룹 참여 취소 API

module.exports = router;

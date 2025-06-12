const express = require('express');
const groupController = require('../controllers/group-controller');

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
 * 그룹 생성 API
 * POST /groups
 */
router.post('/', GroupController.postGroup);

/**
 * 그룹 수정 API
 * PAtCH /groups/:id
 */
router.patch('/:id', GroupController.patchGroup);

/**
 * 그룹 삭제 API
 * EELETE /groups/:id
 */
router.delete('/:id', GroupController.deleteGroup);

module.exports = router;


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
router.post('/', groupController.postGroup);

/**
 * 그룹 수정 API
 * PATCH /groups/:groupId
 */
router.patch('/:groupId', groupController.patchGroup);

/**
 * 그룹 삭제 API
 * DELETE /groups/:groupId
 */
router.delete('/:groupId', groupController.deleteGroup);

module.exports = router;
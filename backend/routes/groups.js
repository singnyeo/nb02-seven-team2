const express = require('express');
const GroupController = require('../controllers/GroupController');

const router = express.Router();

/**
 * 그룹 목록 조회 API
 * GET /api/groups
 */
// router.get('/', GroupController.getGroups);

/**
 * 그룹 상세 조회 API
 * GET /api/groups/:id
 */
// router.get('/:id', GroupController.getGroupById);

router.post('/', GroupController.postGroup);
router.patch('/:id', GroupController.patchGroup);
router.delete('/:id', GroupController.deleteGroup);

module.exports = router;
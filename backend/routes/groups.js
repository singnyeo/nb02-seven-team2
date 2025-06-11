const express = require('express');
const GroupController = require('../controllers/group-controller'); // PascalCase → kebab-case로 변경

const router = express.Router();

/**
 * 그룹 목록 조회 API
 * GET /groups
 */
router.get('/', GroupController.getGroups);

/**
 * 그룹 상세 조회 API
 * GET /groups/:id
 */
router.get('/:id', GroupController.getGroupById);

module.exports = router;
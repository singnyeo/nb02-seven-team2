const express = require('express');
const RecordsController = require('../controllers/records-controller');

const router = express.Router();

router.get('/:groupId/records', RecordsController.getGroupRecords);

module.exports = router;
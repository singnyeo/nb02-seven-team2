const express = require('express');
const RecordViewController = require('../controllers/records-view-controller');

const router = express.Router({ mergeParams: true });

router.get('/rank', RecordViewController.getRank);
router.get('/records/:recordId', RecordViewController.getRecordById);

module.exports = router;
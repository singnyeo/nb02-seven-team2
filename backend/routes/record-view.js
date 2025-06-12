const express = require('express');
const router = express.Router({ mergeParams: true });
const RecordViewController = require('../controllers/record-view-controller');

router.get('/rank', RecordViewController.getRank);
router.get('/record/:recordId', RecordViewController.getRecordById);

module.exports = router;
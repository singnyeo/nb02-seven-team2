const express = require('express');
const TagController = require('../controllers/tag-controller');

const router = express.Router();

router.get('/', TagController.getTags);

router.get('/:tagId', TagController.getTag);

module.exports = router;
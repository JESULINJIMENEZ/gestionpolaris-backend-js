const express = require('express');
const router = express.Router();
const validateRequired = require('../../middleware/validateRequired');
const pointVoteCtrl = require('../../controllers/pointVoteControllers');

// Get all point votes
router.get('/', pointVoteCtrl.getPointVote);

// Get point vote by id
router.get('/:id', pointVoteCtrl.getPointVoteById);

// Create point vote with validation middleware
router.post('/', validateRequired(['name','address','neiborhood','city']), pointVoteCtrl.createPointVote);

module.exports = router;
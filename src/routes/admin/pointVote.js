const express = require('express');
const router = express.Router();
const validateRequired = require('../../middleware/validateRequired');
const pointVoteCtrl = require('../../controllers/pointVoteControllers');

// Get all point votes
router.get('/', pointVoteCtrl.getPointVote);

// Get point vote by id
router.get('/:id', pointVoteCtrl.getPointVoteById);

// Create point vote with validation middleware
router.post('/', validateRequired(['name', 'address', 'neighborhood', 'city']), pointVoteCtrl.createPointVote);

// Update point vote by id with validation middleware
router.put('/:id', pointVoteCtrl.updatePointVote);

// Delete point vote by id
router.delete('/:id', pointVoteCtrl.deletePointVote);

module.exports = router;
const express = require('express');
const router = express.Router();
const { verifyProof } = require('../controllers/zkpController');

router.post('/verify', verifyProof);

module.exports = router;

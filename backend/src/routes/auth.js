const express = require('express');
const router = express.Router();
const { register, verifyRegisterOTP, login, verifyLoginOTP, resendOTP, deleteAccount, exportUserData, updatePanicPassword, updateSecuritySettings } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Registration flow
router.post('/register', register);
router.post('/register/verify', verifyRegisterOTP);

// Login flow
router.post('/login', login);
router.post('/login/verify', verifyLoginOTP);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Account management (protected routes)
router.delete('/account', authenticateToken, deleteAccount);
router.get('/export', authenticateToken, exportUserData);
router.put('/update-panic', authenticateToken, updatePanicPassword);
router.put('/update-security', authenticateToken, updateSecuritySettings);

module.exports = router;


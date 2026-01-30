const { connectDB } = require('../lib/db');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const AuditLog = require('../lib/models/AuditLog');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: true, message: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { email, otp, pendingData } = req.body;

        if (!email || !otp || !pendingData) {
            return res.status(400).json({ error: true, message: 'Missing required fields' });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({
            email,
            code: otp,
            purpose: 'register',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
        }

        // Create user
        const user = await User.create({
            username: pendingData.username,
            email: pendingData.email,
            password: pendingData.password,
            panicPasswordHash: pendingData.panicPassword,
            publicKey: pendingData.publicKey,
            emailVerified: true
        });

        // Delete OTP
        await OTP.deleteMany({ email });

        // Log registration
        await AuditLog.create({
            userId: user._id,
            action: 'user_register',
            ipAddress: req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'],
            success: true
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(201).json({ message: 'Account created successfully. Please sign in.' });

    } catch (error) {
        console.error('Verify register error:', error);
        return res.status(500).json({ error: true, message: 'Server error during verification' });
    }
};

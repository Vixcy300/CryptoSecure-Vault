const { connectDB } = require('../lib/db');
const { sendLoginAlertEmail } = require('../lib/email');
const { generateToken } = require('../lib/auth');
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

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: true, message: 'Email and OTP required' });
        }

        const otpRecord = await OTP.findOne({
            email,
            code: otp,
            purpose: 'login',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ error: true, message: 'Invalid or expired OTP' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: true, message: 'User not found' });
        }

        const token = generateToken(user);

        user.lastLoginAt = new Date();
        await user.save();

        await OTP.deleteMany({ email, purpose: 'login' });

        const ip = req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'];

        await AuditLog.create({
            userId: user._id,
            action: 'login_2fa',
            ipAddress: ip,
            userAgent,
            success: true
        });

        if (user.loginAlertsEnabled) {
            sendLoginAlertEmail(email, ip, userAgent, new Date());
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Verify login error:', error);
        return res.status(500).json({ error: true, message: 'Server error during verification' });
    }
};

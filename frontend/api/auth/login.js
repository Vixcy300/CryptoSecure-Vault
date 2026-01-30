const { connectDB } = require('../lib/db');
const { generateOTP, sendOTPEmail, sendLoginAlertEmail } = require('../lib/email');
const { generateToken } = require('../lib/auth');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const AuditLog = require('../lib/models/AuditLog');
const argon2 = require('argon2');

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

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: true, message: 'Email and password required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: true, message: 'Invalid credentials' });
        }

        // Check password (normal or panic)
        let isPanicMode = false;
        const validPassword = await argon2.verify(user.password, password);

        if (!validPassword) {
            if (user.panicPasswordHash) {
                const isPanic = await argon2.verify(user.panicPasswordHash, password);
                if (isPanic) {
                    isPanicMode = true;
                } else {
                    return res.status(400).json({ error: true, message: 'Invalid credentials' });
                }
            } else {
                return res.status(400).json({ error: true, message: 'Invalid credentials' });
            }
        }

        const ip = req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'];

        // If 2FA disabled or panic mode, login directly
        if (isPanicMode || !user.twoFactorEnabled) {
            const token = generateToken(user);

            user.lastLoginAt = new Date();
            await user.save();

            await AuditLog.create({
                userId: user._id,
                action: isPanicMode ? 'panic_login' : 'login',
                ipAddress: ip,
                userAgent,
                success: true
            });

            // Send login alert
            if (user.loginAlertsEnabled && !isPanicMode) {
                sendLoginAlertEmail(email, ip, userAgent, new Date());
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    isPanicMode
                },
                message: 'Login successful'
            });
        }

        // 2FA enabled - send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.deleteMany({ email, purpose: 'login' });
        await OTP.create({
            email,
            code: otp,
            purpose: 'login',
            expiresAt
        });

        sendOTPEmail(email, otp, 'login');

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
            message: 'OTP sent to your email',
            email,
            userId: user._id,
            requiresOTP: true
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: true, message: 'Server error during login' });
    }
};

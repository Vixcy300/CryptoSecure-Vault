const { connectDB } = require('../lib/db');
const { sendLoginAlertEmail } = require('../lib/email');
const { jsonResponse, errorResponse, handleOptions, generateToken } = require('../lib/auth');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const AuditLog = require('../lib/models/AuditLog');

export const config = {
    runtime: 'nodejs'
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return handleOptions();
    }

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        await connectDB();

        const body = await req.json();
        const { email, otp } = body;

        if (!email || !otp) {
            return errorResponse('Email and OTP required');
        }

        const otpRecord = await OTP.findOne({
            email,
            code: otp,
            purpose: 'login',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return errorResponse('Invalid or expired OTP');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse('User not found');
        }

        const token = generateToken(user);

        user.lastLoginAt = new Date();
        await user.save();

        await OTP.deleteMany({ email, purpose: 'login' });

        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent');

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

        return jsonResponse({
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
        return errorResponse('Server error during verification', 500);
    }
}

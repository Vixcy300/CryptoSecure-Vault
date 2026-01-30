const { connectDB } = require('../lib/db');
const { generateOTP, sendOTPEmail, sendLoginAlertEmail } = require('../lib/email');
const { jsonResponse, errorResponse, handleOptions, generateToken } = require('../lib/auth');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const AuditLog = require('../lib/models/AuditLog');
const argon2 = require('argon2');

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
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password required');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return errorResponse('Invalid credentials');
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
                    return errorResponse('Invalid credentials');
                }
            } else {
                return errorResponse('Invalid credentials');
            }
        }

        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent');

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

            return jsonResponse({
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

        return jsonResponse({
            message: 'OTP sent to your email',
            email,
            userId: user._id,
            requiresOTP: true
        });

    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Server error during login', 500);
    }
}

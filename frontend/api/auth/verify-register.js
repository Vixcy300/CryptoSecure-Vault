const { connectDB } = require('../lib/db');
const { jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
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
        const { email, otp, pendingData } = body;

        if (!email || !otp || !pendingData) {
            return errorResponse('Missing required fields');
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({
            email,
            code: otp,
            purpose: 'register',
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return errorResponse('Invalid or expired OTP');
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
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            userAgent: req.headers.get('user-agent'),
            success: true
        });

        return jsonResponse({ message: 'Account created successfully. Please sign in.' }, 201);

    } catch (error) {
        console.error('Verify register error:', error);
        return errorResponse('Server error during verification', 500);
    }
}

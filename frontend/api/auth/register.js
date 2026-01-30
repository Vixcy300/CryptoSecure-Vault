const { connectDB } = require('../lib/db');
const { generateOTP, sendOTPEmail } = require('../lib/email');
const { jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const argon2 = require('argon2');

export const config = {
    runtime: 'nodejs'
};

export default async function handler(req) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return handleOptions();
    }

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        await connectDB();

        const body = await req.json();
        const { username, email, password, panicPassword, publicKey } = body;

        if (!username || !email || !password) {
            return errorResponse('Missing required fields');
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return errorResponse('User already exists');
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Delete any existing OTPs for this email
        await OTP.deleteMany({ email });

        // Create new OTP
        await OTP.create({
            email,
            code: otp,
            purpose: 'register',
            expiresAt
        });

        // Hash passwords
        const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
        const hashedPanicPassword = panicPassword
            ? await argon2.hash(panicPassword, { type: argon2.argon2id })
            : null;

        // Send OTP email (non-blocking)
        sendOTPEmail(email, otp, 'register');

        return jsonResponse({
            message: 'OTP sent to your email',
            email,
            pendingData: {
                username,
                email,
                password: hashedPassword,
                panicPassword: hashedPanicPassword,
                publicKey
            },
            requiresOTP: true
        });

    } catch (error) {
        console.error('Register error:', error);
        return errorResponse('Server error during registration', 500);
    }
}

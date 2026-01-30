const { connectDB } = require('../lib/db');
const { generateOTP, sendOTPEmail } = require('../lib/email');
const { jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
const User = require('../lib/models/User');
const OTP = require('../lib/models/OTP');
const argon2 = require('argon2');

module.exports = async function handler(req, res) {
    // Handle CORS preflight
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

        const { username, email, password, panicPassword, publicKey } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: true, message: 'Missing required fields' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: true, message: 'User already exists' });
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

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
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
        return res.status(500).json({ error: true, message: 'Server error during registration' });
    }
};

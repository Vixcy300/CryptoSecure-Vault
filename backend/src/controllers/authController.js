const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, sendLoginAlertEmail } = require('../services/emailService');

// Step 1: Register - Create pending user and send OTP
const register = async (req, res) => {
    try {
        const { username, email, password, panicPassword, publicKey } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

        await sendOTPEmail(email, otp, 'register');

        res.status(200).json({
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
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Step 2: Verify Registration OTP and create user
const verifyRegisterOTP = async (req, res) => {
    try {
        const { email, otp, pendingData } = req.body;

        const otpRecord = await OTP.findOne({
            email,
            purpose: 'register',
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (otpRecord.attempts >= 3) {
            return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        if (otpRecord.code !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid - create user
        const user = await User.create({
            username: pendingData.username,
            email: pendingData.email,
            password: pendingData.password,
            panicPasswordHash: pendingData.panicPassword,
            publicKey: pendingData.publicKey,
            role: 'owner',
            emailVerified: true
        });

        // Mark OTP as verified
        otpRecord.verified = true;
        await otpRecord.save();

        // Log the registration
        await AuditLog.create({
            userId: user._id,
            action: 'user_register',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });

        res.status(201).json({ message: 'Account created successfully. Please sign in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// Step 1: Login - Verify credentials and send OTP
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let isPanicMode = false;
        const validPassword = await argon2.verify(user.password, password);

        if (!validPassword) {
            if (user.panicPasswordHash) {
                const validPanic = await argon2.verify(user.panicPasswordHash, password);
                if (validPanic) {
                    isPanicMode = true;
                } else {
                    return res.status(400).json({ message: 'Invalid credentials' });
                }
            } else {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        }

        if (isPanicMode || !user.twoFactorEnabled) {
            const token = jwt.sign(
                { id: user._id, role: user.role, email: user.email, isPanicMode },
                process.env.JWT_SECRET || 'super_secret_key_change_me',
                { expiresIn: '24h' }
            );

            user.lastLoginAt = new Date();
            await user.save();

            await AuditLog.create({
                userId: user._id,
                action: 'user_login',
                metadata: { skipOTP: true, panic: isPanicMode },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                success: true
            });

            if (user.loginAlertsEnabled && !isPanicMode) {
                sendLoginAlertEmail(email, req.ip, req.headers['user-agent'], new Date()).catch(err => console.error('Alert failed', err));
            }

            return res.json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    twoFactorEnabled: user.twoFactorEnabled,
                    loginAlertsEnabled: user.loginAlertsEnabled
                },
                message: 'Login successful'
            });
        }

        // 2FA is ENABLED - send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.deleteMany({ email });
        await OTP.create({
            email,
            code: otp,
            purpose: 'login',
            expiresAt,
            metadata: { panic: isPanicMode }
        });

        await sendOTPEmail(email, otp, 'login');

        res.status(200).json({
            message: 'OTP sent to your email',
            email,
            userId: user._id,
            requiresOTP: true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Step 2: Verify Login OTP
const verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const otpRecord = await OTP.findOne({
            email,
            purpose: 'login',
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (otpRecord.attempts >= 3) {
            return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        if (otpRecord.code !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const isPanicMode = otpRecord.metadata?.panic || false;

        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email, isPanicMode },
            process.env.JWT_SECRET || 'super_secret_key_change_me',
            { expiresIn: '24h' }
        );

        otpRecord.verified = true;
        await otpRecord.save();

        user.lastLoginAt = new Date();
        await user.save();

        await AuditLog.create({
            userId: user._id,
            action: 'user_login',
            metadata: { withOTP: true },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });

        sendLoginAlertEmail(email, req.ip, req.headers['user-agent'], new Date()).catch(err => console.error('Alert failed'));

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled,
                loginAlertsEnabled: user.loginAlertsEnabled
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
};

// Resend OTP
const resendOTP = async (req, res) => {
    try {
        const { email, purpose } = req.body;

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.deleteMany({ email });
        await OTP.create({
            email,
            code: otp,
            purpose: purpose || 'login',
            expiresAt
        });

        await sendOTPEmail(email, otp, purpose || 'login');

        res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to resend OTP' });
    }
};

// Delete Account
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (password) {
            const valid = await argon2.verify(user.password, password);
            if (!valid) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }

        const File = require('../models/File');
        const FilePermission = require('../models/FilePermission');

        await File.deleteMany({ ownerId: userId });
        await FilePermission.deleteMany({ userId });
        await OTP.deleteMany({ email: user.email });

        await AuditLog.create({
            userId,
            action: 'account_deleted',
            success: true
        });

        await User.deleteOne({ _id: userId });

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Failed to delete account' });
    }
};

// Export User Data
const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('_id username email createdAt lastLoginAt twoFactorEnabled');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const File = require('../models/File');
        const files = await File.find({ ownerId: userId }).select('_id filename size mimeType createdAt updatedAt');

        const logs = await AuditLog.find({ userId }).sort({ createdAt: -1 }).limit(100);

        const FilePermission = require('../models/FilePermission');
        const permissions = await FilePermission.find({ userId });

        const exportData = {
            exportDate: new Date().toISOString(),
            user: user.toObject(),
            files: files.map(f => f.toObject()),
            activityLogs: logs.map(l => l.toObject()),
            sharedWithMe: permissions.map(p => p.toObject()),
            metadata: {
                totalFiles: files.length,
                totalLogs: logs.length,
                exportVersion: '1.0'
            }
        };

        await AuditLog.create({
            userId,
            action: 'data_exported',
            success: true
        });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="cryptosecure_export_${Date.now()}.json"`);
        res.status(200).json(exportData);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({ message: 'Failed to export data' });
    }
};

const updatePanicPassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { panicPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!panicPassword) {
            user.panicPasswordHash = null;
            await user.save();
            return res.status(200).json({ message: 'Panic mode disabled' });
        }

        const hashedPanicPassword = await argon2.hash(panicPassword, { type: argon2.argon2id });
        user.panicPasswordHash = hashedPanicPassword;
        await user.save();

        await AuditLog.create({
            userId,
            action: 'panic_password_updated',
            success: true
        });

        res.status(200).json({ message: 'Panic password updated successfully' });
    } catch (error) {
        console.error('Update panic password error:', error);
        res.status(500).json({ message: 'Failed to update panic password' });
    }
};

const updateSecuritySettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { twoFactorEnabled, loginAlertsEnabled } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
        if (loginAlertsEnabled !== undefined) user.loginAlertsEnabled = loginAlertsEnabled;

        await user.save();

        await AuditLog.create({
            userId,
            action: 'security_settings_updated',
            success: true
        });

        res.status(200).json({
            message: 'Security settings updated',
            twoFactorEnabled: user.twoFactorEnabled,
            loginAlertsEnabled: user.loginAlertsEnabled
        });
    } catch (error) {
        console.error('Update security settings error:', error);
        res.status(500).json({ message: 'Failed to update security settings' });
    }
};

module.exports = { register, verifyRegisterOTP, login, verifyLoginOTP, resendOTP, deleteAccount, exportUserData, updatePanicPassword, updateSecuritySettings };

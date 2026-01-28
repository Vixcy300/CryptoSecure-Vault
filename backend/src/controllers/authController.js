const User = require('../models/User');
const OTP = require('../models/OTP');
const AuditLog = require('../models/AuditLog');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { generateOTP, sendOTPEmail, sendLoginAlertEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Step 1: Register - Create pending user and send OTP
const register = async (req, res) => {
    try {
        const { username, email, password, panicPassword, publicKey } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete any existing OTPs for this email
        await OTP.destroy({ where: { email } });

        // Create new OTP
        await OTP.create({
            email,
            code: otp,
            purpose: 'register',
            expiresAt
        });

        // Store pending registration data temporarily in session/memory
        // For simplicity, we'll include it in the response and client will send it back
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
            where: {
                email,
                purpose: 'register',
                verified: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (otpRecord.attempts >= 3) {
            return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        if (otpRecord.code !== otp) {
            await otpRecord.update({ attempts: otpRecord.attempts + 1 });
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
        await otpRecord.update({ verified: true });

        // Log the registration
        await AuditLog.create({
            userId: user.id,
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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let isPanicMode = false;
        const validPassword = await argon2.verify(user.password, password);

        if (!validPassword) {
            // Check if it's the panic password
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

        // Logic Refined:
        // 1. If Panic Mode -> Direct Login (Privacy reasons, don't trigger 2FA which might alert attacker)
        // 2. If 2FA Enabled -> Send OTP
        // 3. If 2FA Disabled -> Direct Login

        if (isPanicMode || !user.twoFactorEnabled) {
            // Direct Login Step
            const token = jwt.sign(
                { id: user.id, role: user.role, email: user.email, isPanicMode },
                process.env.JWT_SECRET || 'super_secret_key_change_me',
                { expiresIn: '24h' }
            );

            await user.update({ lastLoginAt: new Date() });

            // Log the login
            // For panic mode, we mask it. For normal login, we log it.
            await AuditLog.create({
                userId: user.id,
                action: 'user_login',
                metadata: {
                    skipOTP: true,
                    panic: isPanicMode // You might want to hide this in prod logs if logs are compromised
                },
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                success: true
            });

            // Send Login Alert (Only if NOT panic mode and Alerts are ENABLED)
            // We usually don't want alerts in panic mode to look different, 
            // but for safety, we might silence them or send a generic one.
            // Current requirement: "Make notifications work".
            if (user.loginAlertsEnabled && !isPanicMode) {
                // Send asynchronously
                sendLoginAlertEmail(email, req.ip, req.headers['user-agent'], new Date()).catch(err => console.error('Alert failed', err));
            }

            return res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    twoFactorEnabled: user.twoFactorEnabled,
                    loginAlertsEnabled: user.loginAlertsEnabled
                },
                message: 'Login successful'
            });
        }

        // If we are here: 2FA is ENABLED and it is NOT panic mode.
        // Generate and send OTP for new session
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await OTP.destroy({ where: { email } });
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
            userId: user.id,
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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const otpRecord = await OTP.findOne({
            where: {
                email,
                purpose: 'login',
                verified: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        if (otpRecord.attempts >= 3) {
            return res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
        }

        if (otpRecord.code !== otp) {
            await otpRecord.update({ attempts: otpRecord.attempts + 1 });
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Check for panic mode in metadata
        const isPanicMode = otpRecord.metadata?.panic || false;

        // OTP is valid - create session
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email, isPanicMode },
            process.env.JWT_SECRET || 'super_secret_key_change_me',
            { expiresIn: '24h' }
        );

        // Mark OTP as verified and update last login
        await otpRecord.update({ verified: true });
        await user.update({ lastLoginAt: new Date() });

        // Log the login
        await AuditLog.create({
            userId: user.id,
            action: 'user_login',
            metadata: { withOTP: true },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            success: true
        });

        // Send login alert email
        sendLoginAlertEmail(email, req.ip, req.headers['user-agent'], new Date());

        res.json({
            token,
            user: {
                id: user.id,
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

        await OTP.destroy({ where: { email } });
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

// Delete Account - Permanently delete user and all data
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // Verify password before deletion
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (password) {
            const valid = await argon2.verify(user.passwordHash, password);
            if (!valid) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }

        // Delete user files from database
        const File = require('../models/File');
        await File.destroy({ where: { userId } });

        // Delete file permissions
        const FilePermission = require('../models/FilePermission');
        await FilePermission.destroy({ where: { userId } });

        // Delete OTPs
        await OTP.destroy({ where: { email: user.email } });

        // Log account deletion
        await AuditLog.create({
            userId,
            action: 'account_deleted',
            success: true
        });

        // Delete user
        await user.destroy();

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ message: 'Failed to delete account' });
    }
};

// Export User Data - Download all user data
const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'createdAt', 'lastLoginAt', 'twoFactorEnabled']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user files
        const File = require('../models/File');
        const files = await File.findAll({
            where: { userId },
            attributes: ['id', 'filename', 'size', 'mimeType', 'createdAt', 'updatedAt']
        });

        // Get activity logs
        const logs = await AuditLog.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        // Get file permissions (shared files)
        const FilePermission = require('../models/FilePermission');
        const permissions = await FilePermission.findAll({
            where: { userId },
            include: [{ model: File, attributes: ['filename'] }]
        });

        const exportData = {
            exportDate: new Date().toISOString(),
            user: user.toJSON(),
            files: files.map(f => f.toJSON()),
            activityLogs: logs.map(l => l.toJSON()),
            sharedWithMe: permissions.map(p => p.toJSON()),
            metadata: {
                totalFiles: files.length,
                totalLogs: logs.length,
                exportVersion: '1.0'
            }
        };

        // Log export action
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

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!panicPassword) {
            // Remove panic password
            await user.update({ panicPasswordHash: null });
            return res.status(200).json({ message: 'Panic mode disabled' });
        }

        const hashedPanicPassword = await argon2.hash(panicPassword, { type: argon2.argon2id });
        await user.update({ panicPasswordHash: hashedPanicPassword });

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

        const user = await User.findByPk(userId);
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


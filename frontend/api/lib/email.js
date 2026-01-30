const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp, purpose = 'login') {
    console.log(`\n========== OTP for ${email}: ${otp} (Purpose: ${purpose}) ==========\n`);

    const subjects = {
        login: '🔐 CryptoSecure Vault - Login Code',
        register: '🔐 CryptoSecure Vault - Registration Code',
        '2fa': '🔐 CryptoSecure Vault - 2FA Code'
    };

    try {
        await transporter.sendMail({
            from: { name: 'CryptoSecure Vault', address: process.env.EMAIL_USER },
            to: email,
            subject: subjects[purpose] || 'CryptoSecure Vault - Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 16px;">
                    <h1 style="color: #7c3aed; text-align: center; margin-bottom: 20px;">🔐 CryptoSecure Vault</h1>
                    <p style="color: #e2e8f0; text-align: center;">Your verification code is:</p>
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
                    </div>
                    <p style="color: #94a3b8; text-align: center; font-size: 14px;">Expires in 10 minutes</p>
                </div>
            `
        });
        console.log(`Email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Email failed:', error.message);
        return false;
    }
}

async function sendLoginAlertEmail(email, ip, userAgent, timestamp) {
    console.log(`Login alert for ${email} from ${ip}`);

    try {
        await transporter.sendMail({
            from: { name: 'CryptoSecure Vault', address: process.env.EMAIL_USER },
            to: email,
            subject: '🔔 New Login to Your Vault',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
                    <h1 style="color: #1e293b;">New Login Detected</h1>
                    <p>A login was made to your CryptoSecure Vault:</p>
                    <ul>
                        <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
                        <li><strong>IP:</strong> ${ip}</li>
                        <li><strong>Device:</strong> ${userAgent?.slice(0, 50) || 'Unknown'}</li>
                    </ul>
                    <p>If this wasn't you, please secure your account immediately.</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Login alert failed:', error.message);
        return false;
    }
}

async function sendFileShareEmail(email, sharedBy, fileName) {
    try {
        await transporter.sendMail({
            from: { name: 'CryptoSecure Vault', address: process.env.EMAIL_USER },
            to: email,
            subject: '📁 A File Was Shared With You',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
                    <h1 style="color: #4f46e5;">File Shared With You</h1>
                    <p><strong>${sharedBy}</strong> shared a file with you:</p>
                    <div style="background: #e0e7ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <strong>${fileName}</strong>
                    </div>
                    <p>Log in to your vault to view the file.</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Share email failed:', error.message);
        return false;
    }
}

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendLoginAlertEmail,
    sendFileShareEmail
};

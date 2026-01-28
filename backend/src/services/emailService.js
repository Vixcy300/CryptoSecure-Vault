const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@example.com',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
    },
    connectionTimeout: 10000, // 10 second timeout
    greetingTimeout: 5000
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'login') => {
    // In development or if email fails, log OTP to console for testing
    console.log(`\n========================================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`========================================\n`);

    const subjects = {
        login: 'CryptoSecure Vault - Login Verification Code',
        register: 'CryptoSecure Vault - Registration Verification Code',
        '2fa': 'CryptoSecure Vault - Two-Factor Authentication Code'
    };

    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@example.com'
        },
        to: email,
        subject: subjects[purpose] || 'CryptoSecure Vault - Verification Code',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; }
                    .wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 60px; }
                    .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #171717; border: 1px solid #e5e7eb; border-radius: 8px; }
                    .header { padding: 40px; text-align: center; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 8px 8px 0 0; }
                    .content { padding: 40px; }
                    .otp-container { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; }
                    .otp-code { font-size: 42px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; font-family: monospace; }
                    .footer { padding: 32px; background-color: #ffffff; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <br>
                    <table class="main-table" align="center">
                        <tr>
                            <td class="header">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">CryptoSecure Vault</h1>
                                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Zero-Knowledge Architecture</p>
                            </td>
                        </tr>
                        <tr>
                            <td class="content">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Verify your identity</h2>
                                <p style="margin: 0 0 24px 0; line-height: 1.6; color: #334155;">
                                    Use the following verification code to ${purpose === 'register' ? 'complete your secure account registration' : 'authenticate access to your vault'}.
                                </p>
                                <div class="otp-container">
                                    <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600;">Verification Code</p>
                                    <p class="otp-code">${otp}</p>
                                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Expires in 10 minutes</p>
                                </div>
                                <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                                    Authorized for: <strong style="color: #0f172a;">${email}</strong>
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td class="footer">
                                <p style="margin: 0 0 8px 0;">&copy; 2026 CryptoSecure Vault. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        // DON'T throw - just log the error and return false
        // This allows registration to continue even if email fails
        console.error('Failed to send OTP email:', error.message);
        console.log(`[FALLBACK] OTP for ${email} is: ${otp} (Email failed, check Render logs)`);
        return false; // Return false but don't crash
    }
};

const sendLoginAlertEmail = async (email, ipAddress, userAgent, timestamp) => {
    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@example.com'
        },
        to: email,
        subject: 'CryptoSecure Vault - New Login Detected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px;">
                <h1 style="color: #4f46e5;">New Login Detected</h1>
                <p>A new login to your CryptoSecure Vault account was detected:</p>
                <ul>
                    <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
                    <li><strong>IP:</strong> ${ipAddress}</li>
                    <li><strong>Device:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}...</li>
                </ul>
                <p>If this was you, no action is needed.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Failed to send login alert:', error.message);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendLoginAlertEmail,
    transporter
};

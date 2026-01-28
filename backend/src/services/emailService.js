const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'contactigtyt@gmail.com',
        pass: process.env.SMTP_PASS || 'unltveivyxgbzmsm'
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'login') => {
    const subjects = {
        login: 'CryptoSecure Vault - Login Verification Code',
        register: 'CryptoSecure Vault - Registration Verification Code',
        '2fa': 'CryptoSecure Vault - Two-Factor Authentication Code'
    };

    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: process.env.SMTP_USER || 'contactigtyt@gmail.com'
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
                    .header { padding: 40px; text-align: center; background: #ffffff; border-bottom: 1px solid #e5e7eb; }
                    .content { padding: 40px; }
                    .otp-container { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 32px 0; }
                    .otp-code { font-size: 42px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; font-family: monospace; }
                    .footer { padding: 32px; background-color: #ffffff; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; }
                    .alert { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; font-size: 14px; color: #b45309; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <br>
                    <table class="main-table" align="center">
                        <!-- Header -->
                        <tr>
                            <td class="header">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">CryptoSecure Vault</h1>
                                <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Zero-Knowledge Architecture</p>
                            </td>
                        </tr>

                        <!-- Content -->
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

                                <div class="alert">
                                    <strong>Security Notice:</strong>
                                    CryptoSecure employees will never ask for this code. If you did not request this, please ignore this email.
                                </div>

                                <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
                                    Authorized for: <strong style="color: #0f172a;">${email}</strong>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td class="footer">
                                <p style="margin: 0 0 8px 0;">&copy; 2026 CryptoSecure Vault. All rights reserved.</p>
                                <p style="margin: 0;">123 Encryption St, Cyber City, Secure State 90210</p>
                            </td>
                        </tr>
                    </table>
                    <br>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        throw error;
    }
};

const sendLoginAlertEmail = async (email, ipAddress, userAgent, timestamp) => {
    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: process.env.SMTP_USER || 'contactigtyt@gmail.com'
        },
        to: email,
        subject: 'CryptoSecure Vault - New Login Detected',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f12; color: #ffffff; padding: 40px; }
                    .container { max-width: 500px; margin: 0 auto; background: #16161a; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06); }
                    h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
                    p { color: #a1a1aa; font-size: 14px; line-height: 1.6; }
                    .details { background: #1c1c21; border-radius: 10px; padding: 20px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
                    .detail-label { color: #71717a; }
                    .detail-value { color: #ffffff; }
                    .footer { text-align: center; margin-top: 30px; color: #52525b; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔔 New Login Detected</h1>
                    <p>A new login to your CryptoSecure Vault account was detected:</p>
                    
                    <div class="details">
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">${new Date(timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">IP Address:</span>
                            <span class="detail-value">${ipAddress}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Device:</span>
                            <span class="detail-value">${userAgent?.substring(0, 50) || 'Unknown'}...</span>
                        </div>
                    </div>
                    
                    <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately.</p>
                    
                    <div class="footer">
                        <p>© 2026 CryptoSecure Vault</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Failed to send login alert:', error);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendLoginAlertEmail,
    transporter
};

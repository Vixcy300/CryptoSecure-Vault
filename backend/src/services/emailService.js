const { Resend } = require('resend');

// Use Resend API for reliable email delivery on Render
// If no RESEND_API_KEY, emails will just be logged to console
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'login') => {
    // Always log OTP to console for debugging
    console.log(`\n========================================`);
    console.log(`OTP for ${email}: ${otp}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`========================================\n`);

    if (!resend) {
        console.log(`[INFO] RESEND_API_KEY not set. Email not sent, use OTP from logs.`);
        return false;
    }

    const subjects = {
        login: 'CryptoSecure Vault - Login Verification Code',
        register: 'CryptoSecure Vault - Registration Verification Code',
        '2fa': 'CryptoSecure Vault - Two-Factor Authentication Code'
    };

    try {
        const { data, error } = await resend.emails.send({
            from: 'CryptoSecure Vault <onboarding@resend.dev>',
            to: [email],
            subject: subjects[purpose] || 'CryptoSecure Vault - Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f8fafc; }
                        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { color: #4f46e5; margin: 0; font-size: 24px; }
                        .otp-box { background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 36px; font-weight: 700; color: white; letter-spacing: 8px; margin: 0; font-family: monospace; }
                        .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 CryptoSecure Vault</h1>
                            <p style="color: #64748b; margin-top: 8px;">Zero-Knowledge Security</p>
                        </div>
                        
                        <p style="color: #334155;">Your verification code for ${purpose === 'register' ? 'registration' : 'login'} is:</p>
                        
                        <div class="otp-box">
                            <p class="otp-code">${otp}</p>
                        </div>
                        
                        <p style="color: #64748b; text-align: center; font-size: 14px;">
                            This code expires in <strong>10 minutes</strong>
                        </p>
                        
                        <div class="footer">
                            <p>If you didn't request this, please ignore this email.</p>
                            <p>&copy; 2026 CryptoSecure Vault</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('Resend API error:', error);
            return false;
        }

        console.log(`Email sent successfully via Resend to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error.message);
        return false;
    }
};

const sendLoginAlertEmail = async (email, ipAddress, userAgent, timestamp) => {
    console.log(`[Login Alert] User ${email} logged in from IP: ${ipAddress}`);

    if (!resend) {
        return false;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'CryptoSecure Vault <onboarding@resend.dev>',
            to: [email],
            subject: 'CryptoSecure Vault - New Login Detected',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px;">
                    <h1 style="color: #4f46e5;">🔔 New Login Detected</h1>
                    <p>A new login to your CryptoSecure Vault account was detected:</p>
                    <ul>
                        <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
                        <li><strong>IP:</strong> ${ipAddress}</li>
                        <li><strong>Device:</strong> ${userAgent?.substring(0, 50) || 'Unknown'}...</li>
                    </ul>
                    <p>If this was you, no action is needed.</p>
                    <p style="color: #64748b; font-size: 12px;">&copy; 2026 CryptoSecure Vault</p>
                </div>
            `
        });

        if (error) {
            console.error('Resend login alert error:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send login alert:', error.message);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendLoginAlertEmail
};

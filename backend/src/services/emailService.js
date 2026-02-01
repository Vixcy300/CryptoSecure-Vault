const nodemailer = require('nodemailer');

// Gmail SMTP configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'login') => {
    // Always log OTP to console for debugging
    console.log(`\n========================================`);
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`========================================\n`);

    const subjects = {
        login: '🔐 CryptoSecure Vault - Login Code',
        register: '🔐 CryptoSecure Vault - Registration Code',
        '2fa': '🔐 CryptoSecure Vault - 2FA Code'
    };

    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: 'contactigtyt@gmail.com'
        },
        to: email,
        subject: subjects[purpose] || 'CryptoSecure Vault - Verification Code',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
                <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                            <span style="font-size: 28px;">🔐</span>
                        </div>
                        <h1 style="color: #f1f5f9; margin: 0; font-size: 24px; font-weight: 600;">CryptoSecure Vault</h1>
                        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Zero-Knowledge Security</p>
                    </div>
                    
                    <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                        Your verification code for <strong style="color: #10b981;">${purpose === 'register' ? 'account registration' : 'secure login'}</strong> is:
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
                        <p style="font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
                    </div>
                    
                    <p style="color: #94a3b8; text-align: center; font-size: 13px; margin: 24px 0;">
                        ⏱️ This code expires in <strong style="color: #f1f5f9;">10 minutes</strong>
                    </p>
                    
                    <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 24px;">
                        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                            If you didn't request this code, please ignore this email.<br>
                            Your account remains secure.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email}`);
        console.log(`   Message ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message);
        console.log(`[FALLBACK] OTP for ${email} is: ${otp}`);
        // Don't throw error - let the flow continue with console OTP
        return false;
    }
};

const sendLoginAlertEmail = async (email, ip, userAgent, timestamp) => {
    console.log(`\n📧 Login Alert for ${email} from IP: ${ip}\n`);

    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault Security',
            address: 'contactigtyt@gmail.com'
        },
        to: email,
        subject: '🔐 New Login to Your CryptoSecure Vault',
        html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
                <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #f1f5f9; margin: 0; font-size: 22px;">🔐 New Login Detected</h1>
                    </div>
                    
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                        A new login was detected on your CryptoSecure Vault account.
                    </p>
                    
                    <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #334155;">
                        <table style="width: 100%; color: #cbd5e1; font-size: 13px;">
                            <tr><td style="padding: 8px 0; color: #94a3b8;">Time:</td><td style="padding: 8px 0;">${new Date(timestamp).toLocaleString()}</td></tr>
                            <tr><td style="padding: 8px 0; color: #94a3b8;">IP Address:</td><td style="padding: 8px 0;">${ip}</td></tr>
                            <tr><td style="padding: 8px 0; color: #94a3b8;">Device:</td><td style="padding: 8px 0; word-break: break-word;">${userAgent?.substring(0, 60) || 'Unknown'}...</td></tr>
                        </table>
                    </div>
                    
                    <p style="color: #f59e0b; font-size: 13px; text-align: center;">
                        ⚠️ If this wasn't you, please change your password immediately.
                    </p>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Login alert sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send login alert:', error.message);
        return false;
    }
};

const sendFileShareEmail = async (toEmail, fromEmail, fileName) => {
    console.log(`\n📧 File Share notification to ${toEmail} from ${fromEmail}\n`);

    const mailOptions = {
        from: {
            name: 'CryptoSecure Vault',
            address: 'contactigtyt@gmail.com'
        },
        to: toEmail,
        subject: '📁 Someone shared a file with you on CryptoSecure Vault',
        html: `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
                <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h1 style="color: #f1f5f9; margin: 0; font-size: 22px;">📁 File Shared With You</h1>
                    </div>
                    
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #10b981;">${fromEmail}</strong> has shared an encrypted file with you.
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                        <p style="color: #ffffff; font-size: 14px; margin: 0;">
                            Log in to CryptoSecure Vault to view the shared file
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ File share notification sent to ${toEmail}`);
        return true;
    } catch (error) {
        console.error('Failed to send file share email:', error.message);
        return false;
    }
};

module.exports = {
    generateOTP,
    sendOTPEmail,
    sendLoginAlertEmail,
    sendFileShareEmail
};

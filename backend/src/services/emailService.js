const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'contactigtyt@gmail.com',
        pass: process.env.EMAIL_PASS || 'unltveivyxgbzmsm'
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, purpose = 'login') => {
    // Always log OTP to console for debugging
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
            address: process.env.EMAIL_USER || 'contactigtyt@gmail.com'
        },
        to: email,
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
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error.message);
        console.log(`[FALLBACK] OTP for ${email} is: ${otp} (Email failed, check logs)`);
        return false;
    }
};

const sendLoginAlertEmail = async (email, ipAddress, userAgent, timestamp) => {
    console.log(`[Login Alert] User ${email} logged in from IP: ${ipAddress}`);

    try {
        await transporter.sendMail({
            from: {
                name: 'CryptoSecure Vault',
                address: process.env.EMAIL_USER || 'contactigtyt@gmail.com'
            },
            to: email,
            subject: 'CryptoSecure Vault - New Login Detected',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 8px;">
                    <h1 style="color: #4f46e5;">🔔 New Login Detected</h1>
                    <p>A new login to your account was detected:</p>
                    <ul>
                        <li><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</li>
                        <li><strong>IP:</strong> ${ipAddress}</li>
                    </ul>
                </div>
            `
        });
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

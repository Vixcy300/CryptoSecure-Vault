const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String }, // For TOTP secret
    panicPasswordHash: { type: String }, // For Panic Mode
    loginAlertsEnabled: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);

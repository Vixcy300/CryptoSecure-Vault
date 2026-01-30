const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    success: { type: Boolean, default: true },
    metadata: { type: Object }
}, { timestamps: true });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

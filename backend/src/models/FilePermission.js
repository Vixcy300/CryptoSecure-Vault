const mongoose = require('mongoose');

const filePermissionSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permission: { type: String, enum: ['owner', 'write', 'read'], default: 'read' },
    encryptedKey: { type: String },
    email: { type: String }
}, { timestamps: true });

filePermissionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('FilePermission', filePermissionSchema);

const mongoose = require('mongoose');

const filePermissionSchema = new mongoose.Schema({
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The user who has access
    permission: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
    email: { type: String } // Redundant but useful for display/querying
});

// Ensure unique permission per user per file
filePermissionSchema.index({ fileId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('FilePermission', filePermissionSchema);

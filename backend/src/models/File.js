const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    encryptedName: { type: String },
    encryptedMetadata: { type: String },
    blobPath: { type: String, required: true },
    checksum: { type: String },
    iv: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPanicHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);

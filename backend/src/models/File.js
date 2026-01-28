const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    blobPath: { type: String, required: true }, // Path to encrypted blob on disk
    encryptionKey: { type: String, required: true }, // Encrypted 256-bit key
    iv: { type: String, required: true }, // Initialization Vector
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPanicHidden: { type: Boolean, default: false }, // If true, hidden during panic mode
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);

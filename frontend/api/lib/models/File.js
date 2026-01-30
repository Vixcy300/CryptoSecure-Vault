const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    encryptedName: { type: String },
    encryptedMetadata: { type: String },
    cloudinaryId: { type: String, required: true }, // Cloudinary public_id
    cloudinaryUrl: { type: String, required: true }, // Cloudinary URL
    checksum: { type: String },
    iv: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPanicHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.models.File || mongoose.model('File', fileSchema);

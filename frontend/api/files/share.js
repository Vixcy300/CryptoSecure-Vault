const { connectDB } = require('../lib/db');
const { sendFileShareEmail } = require('../lib/email');
const { verifyToken } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');
const User = require('../lib/models/User');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: true, message: 'Method not allowed' });
    }

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: true, message: 'Unauthorized' });
    }

    try {
        await connectDB();

        const { fileId, targetEmail, encryptedKeyForTarget, permission } = req.body;

        // Verify owner permission
        const ownerPerm = await FilePermission.findOne({
            fileId,
            userId: user.id,
            permission: 'owner'
        });

        if (!ownerPerm) {
            return res.status(403).json({ error: true, message: 'Only owner can share files' });
        }

        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        // Check if already shared
        const existingPerm = await FilePermission.findOne({
            fileId,
            userId: targetUser._id
        });

        if (existingPerm) {
            return res.status(400).json({ error: true, message: 'File already shared with user' });
        }

        await FilePermission.create({
            fileId,
            userId: targetUser._id,
            encryptedKey: encryptedKeyForTarget,
            permission: permission || 'read',
            email: targetEmail
        });

        // Send notification email
        const file = await File.findById(fileId);
        const ownerUser = await User.findById(user.id);
        sendFileShareEmail(targetEmail, ownerUser.email, file.encryptedName || 'Encrypted File');

        return res.status(200).json({ message: 'File shared successfully' });

    } catch (error) {
        console.error('Share error:', error);
        return res.status(500).json({ error: true, message: 'Server error during share' });
    }
};

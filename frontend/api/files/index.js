const { connectDB } = require('../lib/db');
const { verifyToken } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: true, message: 'Method not allowed' });
    }

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: true, message: 'Unauthorized' });
    }

    try {
        await connectDB();

        // Find all files user has permission to access
        const permissions = await FilePermission.find({ userId: user.id }).populate('fileId');

        const files = await Promise.all(permissions.map(async p => {
            if (!p.fileId) return null;

            let isShared = false;
            let sharedWithCount = 0;

            if (p.permission === 'owner') {
                const otherPerms = await FilePermission.countDocuments({
                    fileId: p.fileId._id,
                    userId: { $ne: user.id }
                });
                if (otherPerms > 0) {
                    isShared = true;
                    sharedWithCount = otherPerms;
                }
            }

            return {
                id: p.fileId._id,
                encryptedName: p.fileId.encryptedName,
                encryptedMetadata: p.fileId.encryptedMetadata,
                permission: p.permission,
                updatedAt: p.fileId.updatedAt,
                iv: p.fileId.iv,
                encryptedKey: p.encryptedKey,
                cloudinaryUrl: p.fileId.cloudinaryUrl,
                isShared,
                sharedWithCount
            };
        }));

        return res.status(200).json(files.filter(f => f !== null));

    } catch (error) {
        console.error('Get files error:', error);
        return res.status(500).json({ error: true, message: 'Server error retrieving files' });
    }
};

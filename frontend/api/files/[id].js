const { connectDB } = require('../lib/db');
const { getSecureUrl, deleteFromCloudinary } = require('../lib/cloudinary');
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

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: true, message: 'Unauthorized' });
    }

    const { id: fileId } = req.query;

    if (!fileId) {
        return res.status(400).json({ error: true, message: 'File ID required' });
    }

    try {
        await connectDB();

        // Check permission
        const permission = await FilePermission.findOne({ fileId, userId: user.id });
        if (!permission) {
            return res.status(403).json({ error: true, message: 'Access denied' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            return res.status(404).json({ error: true, message: 'File not found' });
        }

        // GET - Download file
        if (req.method === 'GET') {
            const downloadUrl = getSecureUrl(file.cloudinaryId);
            return res.status(200).json({
                downloadUrl,
                cloudinaryUrl: file.cloudinaryUrl,
                encryptedName: file.encryptedName,
                iv: file.iv,
                encryptedKey: permission.encryptedKey
            });
        }

        // DELETE - Delete file (owner only)
        if (req.method === 'DELETE') {
            if (permission.permission !== 'owner') {
                return res.status(403).json({ error: true, message: 'Only owner can delete' });
            }

            // Delete from Cloudinary
            await deleteFromCloudinary(file.cloudinaryId);

            // Delete from DB
            await FilePermission.deleteMany({ fileId });
            await File.deleteOne({ _id: fileId });

            return res.status(200).json({ message: 'File deleted successfully' });
        }

        return res.status(405).json({ error: true, message: 'Method not allowed' });

    } catch (error) {
        console.error('File operation error:', error);
        return res.status(500).json({ error: true, message: 'Server error' });
    }
};

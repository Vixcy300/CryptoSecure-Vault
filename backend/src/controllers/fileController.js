const File = require('../models/File');
const FilePermission = require('../models/FilePermission');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Directory to store encrypted blobs
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadFile = async (req, res) => {
    try {
        const { encryptedName, encryptedMetadata, iv, checksum, encryptedKey } = req.body;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const blobPath = req.file.path;

        // Create File Entry
        const newFile = await File.create({
            ownerId: userId,
            encryptedName,
            encryptedMetadata,
            blobPath,
            checksum,
            iv
        });

        // Create Permission for Owner
        await FilePermission.create({
            fileId: newFile._id,
            userId: userId,
            encryptedKey: encryptedKey,
            permission: 'owner'
        });

        console.log(`File uploaded: ${newFile._id} by user ${userId}`);
        res.status(201).json({ message: 'File uploaded successfully', fileId: newFile._id });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};

const getFiles = async (req, res) => {
    try {
        const userId = req.user.id;

        // PANIC MODE CHECK
        if (req.user.isPanicMode) {
            return res.json([]);
        }

        // Find all permissions for this user and populate file data
        const permissions = await FilePermission.find({ userId }).populate('fileId');

        const files = await Promise.all(permissions.map(async p => {
            if (!p.fileId) return null; // Skip if file was deleted

            let isShared = false;
            let sharedWithCount = 0;

            if (p.permission === 'owner') {
                const otherPerms = await FilePermission.countDocuments({
                    fileId: p.fileId._id,
                    userId: { $ne: userId }
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
                isShared,
                sharedWithCount
            };
        }));

        res.json(files.filter(f => f !== null));
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Server error retrieving files' });
    }
};

const shareFile = async (req, res) => {
    try {
        const { fileId, targetEmail, encryptedKeyForTarget, permission } = req.body;
        const ownerId = req.user.id;

        // Verify owner permission
        const ownerPerm = await FilePermission.findOne({
            fileId,
            userId: ownerId,
            permission: 'owner'
        });

        if (!ownerPerm) {
            return res.status(403).json({ message: 'Only owner can share files' });
        }

        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already shared
        const existingPerm = await FilePermission.findOne({
            fileId,
            userId: targetUser._id
        });

        if (existingPerm) {
            return res.status(400).json({ message: 'File already shared with user' });
        }

        await FilePermission.create({
            fileId,
            userId: targetUser._id,
            encryptedKey: encryptedKeyForTarget,
            permission: permission || 'read'
        });

        console.log(`File ${fileId} shared with ${targetEmail}`);
        res.json({ message: 'File shared successfully' });

    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ message: 'Server error during share' });
    }
};

const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (!fs.existsSync(file.blobPath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        console.log(`File downloaded: ${fileId}`);
        res.download(file.blobPath, `encrypted_${fileId.toString().slice(0, 8)}.enc`);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Server error during download' });
    }
};

const viewFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findById(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (!fs.existsSync(file.blobPath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        res.sendFile(file.blobPath);
    } catch (error) {
        console.error('View error:', error);
        res.status(500).json({ message: 'Server error during view' });
    }
};

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        // Check Permissions
        const permission = await FilePermission.findOne({ fileId, userId });

        if (!permission) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        if (permission.permission !== 'owner') {
            return res.status(403).json({ message: 'Only the owner can delete this file' });
        }

        const file = await File.findById(fileId);
        if (!file) {
            await FilePermission.deleteMany({ fileId });
            return res.status(404).json({ message: 'File record not found' });
        }

        // Delete from disk
        if (fs.existsSync(file.blobPath)) {
            fs.unlinkSync(file.blobPath);
        }

        // Delete permissions and file
        await FilePermission.deleteMany({ fileId });
        await File.deleteOne({ _id: fileId });

        console.log(`File deleted: ${fileId}`);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Server error during delete' });
    }
};

module.exports = { uploadFile, getFiles, shareFile, downloadFile, viewFile, deleteFile };

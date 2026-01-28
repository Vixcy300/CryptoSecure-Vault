const File = require('../models/File');
const FilePermission = require('../models/FilePermission');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { logAction } = require('../utils/blockchain');
const { Op } = require('sequelize');

// Directory to store encrypted blobs
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const uploadFile = async (req, res) => {
    try {
        // req.file is the encrypted blob from client
        // req.body contains encryptedMetadata, iv, checksum, encryptedKey (for the owner)
        const { encryptedName, encryptedMetadata, iv, checksum, encryptedKey } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileId = uuidv4();
        const blobPath = req.file.path; // Multer stores it

        // Create File Entry
        const newFile = await File.create({
            id: fileId,
            ownerId: userId,
            encryptedName,
            encryptedMetadata,
            blobPath,
            checksum,
            iv
        });

        // Create Permission for Owner
        await FilePermission.create({
            fileId: newFile.id,
            userId: userId,
            encryptedKey: encryptedKey, // Client encrypts key with Owner's PubKey
            permission: 'owner'
        });

        // Log to Blockchain
        await logAction(userId, 'UPLOAD_FILE', newFile.id);

        res.status(201).json({ message: 'File uploaded successfully', fileId: newFile.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during upload' });
    }
};

const getFiles = async (req, res) => {
    try {
        const userId = req.user.id;

        // PANIC MODE CHECK (Server-Side Enforcement)
        if (req.user.isPanicMode) {
            return res.json([]); // Return empty list to simulate empty vault
        }

        // Find files where user has permission
        const permissions = await FilePermission.findAll({
            where: { userId },
            include: [{ model: File }]
        });

        // Advanced query: Get files and check if they are shared with others
        const files = await Promise.all(permissions.map(async p => {
            let isShared = false;
            let sharedWithCount = 0;

            if (p.permission === 'owner') {
                const otherPerms = await FilePermission.count({
                    where: {
                        fileId: p.File.id,
                        userId: { [Op.ne]: userId }
                    }
                });
                if (otherPerms > 0) {
                    isShared = true;
                    sharedWithCount = otherPerms;
                }
            }

            return {
                id: p.File.id,
                encryptedName: p.File.encryptedName,
                encryptedMetadata: p.File.encryptedMetadata,
                permission: p.permission,
                updatedAt: p.File.updatedAt,
                iv: p.File.iv,
                encryptedKey: p.encryptedKey,
                isShared,
                sharedWithCount
            };
        }));

        res.json(files);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error retrieving files' });
    }
};

const shareFile = async (req, res) => {
    try {
        const { fileId, targetEmail, encryptedKeyForTarget, permission } = req.body;
        const ownerId = req.user.id;

        // Verify owner permission
        const ownerPerm = await FilePermission.findOne({
            where: { fileId, userId: ownerId, permission: 'owner' }
        });

        if (!ownerPerm) {
            return res.status(403).json({ message: 'Only owner can share files' });
        }

        const targetUser = await User.findOne({ where: { email: targetEmail } });
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already shared
        const existingPerm = await FilePermission.findOne({
            where: { fileId, userId: targetUser.id }
        });

        if (existingPerm) {
            // Update permission?
            return res.status(400).json({ message: 'File already shared with user' });
        }

        await FilePermission.create({
            fileId,
            userId: targetUser.id,
            encryptedKey: encryptedKeyForTarget,
            permission: permission || 'read'
        });

        // Log to Blockchain
        await logAction(ownerId, 'SHARE_FILE', fileId + ':' + targetUser.id);

        res.json({ message: 'File shared successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during share' });
    }
};

const storageService = require('../services/storageService');

const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findByPk(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found on database' });
        }

        const absolutePath = storageService.resolvePath(file.blobPath);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        await logAction(req.user.id, 'DOWNLOAD_FILE', fileId);
        res.download(absolutePath, `encrypted_${fileId.slice(0, 8)}.enc`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during download' });
    }
};

const viewFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findByPk(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found on database' });
        }

        const absolutePath = storageService.resolvePath(file.blobPath);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        await logAction(req.user.id, 'VIEW_FILE', fileId);
        res.sendFile(absolutePath);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during view' });
    }
};

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.id;

        // Check Permissions First
        const permission = await FilePermission.findOne({
            where: { fileId, userId }
        });

        if (!permission) {
            return res.status(404).json({ message: 'File not found or access denied' });
        }

        if (permission.permission !== 'owner') {
            return res.status(403).json({ message: 'Access denied: Only the owner can delete this file' });
        }

        const file = await File.findByPk(fileId);
        if (!file) {
            // Edge case: Permission exists but file doesn't? Cleanup permission.
            await FilePermission.destroy({ where: { fileId } });
            return res.status(404).json({ message: 'File record not found' });
        }

        // Module handles disk removal
        await storageService.deleteFile(file.blobPath);

        // Delete ALL permissions (cascade) and entry
        await FilePermission.destroy({ where: { fileId } });
        await file.destroy();

        await logAction(userId, 'DELETE_FILE', fileId);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during delete' });
    }
};

module.exports = { uploadFile, getFiles, shareFile, downloadFile, viewFile, deleteFile };

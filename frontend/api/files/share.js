const { connectDB } = require('../lib/db');
const { sendFileShareEmail } = require('../lib/email');
const { verifyToken, jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');
const User = require('../lib/models/User');

export const config = {
    runtime: 'nodejs'
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return handleOptions();
    }

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    const user = verifyToken(req);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    try {
        await connectDB();

        const body = await req.json();
        const { fileId, targetEmail, encryptedKeyForTarget, permission } = body;

        // Verify owner permission
        const ownerPerm = await FilePermission.findOne({
            fileId,
            userId: user.id,
            permission: 'owner'
        });

        if (!ownerPerm) {
            return errorResponse('Only owner can share files', 403);
        }

        const targetUser = await User.findOne({ email: targetEmail });
        if (!targetUser) {
            return errorResponse('User not found', 404);
        }

        // Check if already shared
        const existingPerm = await FilePermission.findOne({
            fileId,
            userId: targetUser._id
        });

        if (existingPerm) {
            return errorResponse('File already shared with user');
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

        return jsonResponse({ message: 'File shared successfully' });

    } catch (error) {
        console.error('Share error:', error);
        return errorResponse('Server error during share', 500);
    }
}

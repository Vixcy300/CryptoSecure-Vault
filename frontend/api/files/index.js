const { connectDB } = require('../lib/db');
const { verifyToken, jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');

export const config = {
    runtime: 'nodejs'
};

export default async function handler(req) {
    if (req.method === 'OPTIONS') {
        return handleOptions();
    }

    if (req.method !== 'GET') {
        return errorResponse('Method not allowed', 405);
    }

    const user = verifyToken(req);
    if (!user) {
        return errorResponse('Unauthorized', 401);
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

        return jsonResponse(files.filter(f => f !== null));

    } catch (error) {
        console.error('Get files error:', error);
        return errorResponse('Server error retrieving files', 500);
    }
}

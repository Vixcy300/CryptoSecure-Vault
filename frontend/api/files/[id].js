const { connectDB } = require('../lib/db');
const { getSecureUrl, deleteFromCloudinary } = require('../lib/cloudinary');
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

    const user = verifyToken(req);
    if (!user) {
        return errorResponse('Unauthorized', 401);
    }

    const url = new URL(req.url);
    const fileId = url.pathname.split('/').pop();

    if (!fileId || fileId === 'files') {
        return errorResponse('File ID required');
    }

    try {
        await connectDB();

        // Check permission
        const permission = await FilePermission.findOne({ fileId, userId: user.id });
        if (!permission) {
            return errorResponse('Access denied', 403);
        }

        const file = await File.findById(fileId);
        if (!file) {
            return errorResponse('File not found', 404);
        }

        // GET - Download file
        if (req.method === 'GET') {
            // Return secure URL for download
            const downloadUrl = getSecureUrl(file.cloudinaryId);
            return jsonResponse({
                downloadUrl,
                encryptedName: file.encryptedName,
                iv: file.iv,
                encryptedKey: permission.encryptedKey
            });
        }

        // DELETE - Delete file (owner only)
        if (req.method === 'DELETE') {
            if (permission.permission !== 'owner') {
                return errorResponse('Only owner can delete', 403);
            }

            // Delete from Cloudinary
            await deleteFromCloudinary(file.cloudinaryId);

            // Delete from DB
            await FilePermission.deleteMany({ fileId });
            await File.deleteOne({ _id: fileId });

            return jsonResponse({ message: 'File deleted successfully' });
        }

        return errorResponse('Method not allowed', 405);

    } catch (error) {
        console.error('File operation error:', error);
        return errorResponse('Server error', 500);
    }
}

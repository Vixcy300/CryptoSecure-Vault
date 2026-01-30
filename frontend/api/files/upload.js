const { connectDB } = require('../lib/db');
const { uploadToCloudinary } = require('../lib/cloudinary');
const { verifyToken, jsonResponse, errorResponse, handleOptions } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');

export const config = {
    runtime: 'nodejs',
    api: {
        bodyParser: false // Handle raw body for file upload
    }
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

        // Parse multipart form data
        const formData = await req.formData();
        const file = formData.get('file');
        const encryptedName = formData.get('encryptedName');
        const encryptedMetadata = formData.get('encryptedMetadata');
        const iv = formData.get('iv');
        const checksum = formData.get('checksum');
        const encryptedKey = formData.get('encryptedKey');

        if (!file) {
            return errorResponse('No file uploaded');
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${user.id}_${Date.now()}`;

        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(buffer, fileName);

        // Create File entry
        const newFile = await File.create({
            ownerId: user.id,
            encryptedName,
            encryptedMetadata,
            cloudinaryId: cloudinaryResult.public_id,
            cloudinaryUrl: cloudinaryResult.secure_url,
            checksum,
            iv
        });

        // Create owner permission
        await FilePermission.create({
            fileId: newFile._id,
            userId: user.id,
            encryptedKey,
            permission: 'owner'
        });

        return jsonResponse({
            message: 'File uploaded successfully',
            fileId: newFile._id
        }, 201);

    } catch (error) {
        console.error('Upload error:', error);
        return errorResponse('Server error during upload', 500);
    }
}

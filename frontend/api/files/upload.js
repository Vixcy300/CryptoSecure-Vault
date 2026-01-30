const { connectDB } = require('../lib/db');
const { uploadToCloudinary } = require('../lib/cloudinary');
const { verifyToken } = require('../lib/auth');
const File = require('../lib/models/File');
const FilePermission = require('../lib/models/FilePermission');
const formidable = require('formidable');
const fs = require('fs');

// Disable body parsing, we need the raw body for file uploads
module.exports.config = {
    api: {
        bodyParser: false
    }
};

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

        // Parse form data
        const form = formidable({ multiples: false });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        const file = files.file?.[0] || files.file;
        if (!file) {
            return res.status(400).json({ error: true, message: 'No file uploaded' });
        }

        // Get field values (formidable returns arrays)
        const getValue = (field) => Array.isArray(field) ? field[0] : field;
        const encryptedName = getValue(fields.encryptedName);
        const encryptedMetadata = getValue(fields.encryptedMetadata);
        const iv = getValue(fields.iv);
        const checksum = getValue(fields.checksum);
        const encryptedKey = getValue(fields.encryptedKey);

        // Read file and upload to Cloudinary
        const buffer = fs.readFileSync(file.filepath);
        const fileName = `${user.id}_${Date.now()}`;

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

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        return res.status(201).json({
            message: 'File uploaded successfully',
            fileId: newFile._id
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: true, message: 'Server error during upload' });
    }
};

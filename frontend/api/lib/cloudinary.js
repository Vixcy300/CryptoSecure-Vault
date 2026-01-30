const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Upload encrypted file buffer to Cloudinary
async function uploadToCloudinary(buffer, fileName) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw', // For encrypted binary files
                folder: 'cryptosecure-vault',
                public_id: fileName,
                overwrite: true
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
}

// Get secure download URL
function getSecureUrl(publicId) {
    return cloudinary.url(publicId, {
        resource_type: 'raw',
        secure: true,
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    });
}

// Delete file from Cloudinary
async function deleteFromCloudinary(publicId) {
    return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
}

module.exports = {
    cloudinary,
    uploadToCloudinary,
    getSecureUrl,
    deleteFromCloudinary
};

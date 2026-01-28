const fs = require('fs');
const path = require('path');

/**
 * Storage Module - Handles backend file system operations
 */
const storageService = {
    /**
     * Get absolute path for a file
     * @param {string} blobPath - path stored in DB
     */
    resolvePath: (blobPath) => {
        if (path.isAbsolute(blobPath)) return blobPath;
        // Assume relative to uploads folder
        return path.join(__dirname, '../../uploads', path.basename(blobPath));
    },

    /**
     * Delete a file from disk
     * @param {string} blobPath 
     */
    deleteFile: (blobPath) => {
        return new Promise((resolve, reject) => {
            const absolutePath = storageService.resolvePath(blobPath);
            if (fs.existsSync(absolutePath)) {
                fs.unlink(absolutePath, (err) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            } else {
                resolve(false); // File didn't exist
            }
        });
    }
};

module.exports = storageService;

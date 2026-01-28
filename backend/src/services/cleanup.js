const File = require('../models/File');
const fs = require('fs');

// Note: node-cron is not in dependencies, so this service is disabled for now.
// To re-enable, add "node-cron" to package.json and uncomment the cron logic.

const runCleanup = async () => {
    console.log('Running Self-Destruct Cleanup Service...');
    try {
        // Determine cutoff time (e.g., 24 hours retention for demo)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const expiredFiles = await File.find({
            createdAt: { $lt: cutoff }
        });

        for (const file of expiredFiles) {
            if (fs.existsSync(file.blobPath)) {
                fs.unlinkSync(file.blobPath);
            }
            await File.deleteOne({ _id: file._id });
            console.log(`[SECURE WIPE] Deleted file ${file._id}`);
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
};

module.exports = {
    start: () => console.log('Cleanup Service Started (Manual mode - no cron)'),
    runCleanup
};

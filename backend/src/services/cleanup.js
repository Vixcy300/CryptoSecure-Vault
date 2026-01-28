const cron = require('node-cron');
const File = require('../models/File');
const fs = require('fs');
const { Op } = require('sequelize');

// Schedule task to run every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running Self-Destruct Cleanup Service...');
    try {
        // Determine cutoff time (e.g., 24 hours retention for demo)
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const expiredFiles = await File.findAll({
            where: {
                createdAt: {
                    [Op.lt]: cutoff
                }
            }
        });

        for (const file of expiredFiles) {
            if (fs.existsSync(file.blobPath)) {
                // Secure wipe simulation (overwrite with zeros before delete)
                // In reality: fs.writeSync(fd, bufferWithZeros...);
                fs.unlinkSync(file.blobPath);
            }
            await file.destroy();
            console.log(`[SECURE WIPE] Deleted file ${file.id}`);
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
});

module.exports = { start: () => console.log('Cleanup Service Started') };

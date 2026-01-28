const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

const calculateHash = (prevHash, userId, action, resourceId, timestamp) => {
    return crypto.createHash('sha256')
        .update(prevHash + userId + action + (resourceId || '') + timestamp)
        .digest('hex');
};

const getLatestHash = async () => {
    const lastLog = await AuditLog.findOne({
        order: [['timestamp', 'DESC']]
    });
    return lastLog ? lastLog.hash : 'GENESIS_HASH';
};

const logAction = async (userId, action, resourceId) => {
    try {
        const prevHash = await getLatestHash();
        const timestamp = new Date();

        const hash = calculateHash(prevHash, userId, action, resourceId, timestamp);

        await AuditLog.create({
            userId,
            action,
            resourceId,
            prevHash,
            hash,
            timestamp
        });

        console.log(`[BLOCKCHAIN] Logged action: ${action} - Hash: ${hash}`);
        return true;
    } catch (error) {
        console.error('Blockchain logging failed:', error);
        return false; // Fail safe? Or block action? For prototype, fail safe.
    }
};

module.exports = { logAction, getLatestHash };

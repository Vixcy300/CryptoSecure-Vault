const FilePermission = require('../models/FilePermission');

/**
 * RBAC Module - Middleware to check file permissions
 * @param {Array} requiredPermissions - List of allowed permissions (e.g., ['owner', 'write'])
 */
const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const fileId = req.params.id || req.body.fileId;

            if (!fileId) {
                return res.status(400).json({ message: 'File ID is required' });
            }

            const permission = await FilePermission.findOne({
                where: { fileId, userId }
            });

            if (!permission) {
                return res.status(403).json({ message: 'Access denied: No permissions found for this file' });
            }

            // 'owner' always has all permissions
            if (permission.permission === 'owner') {
                return next();
            }

            const hasPermission = requiredPermissions.includes(permission.permission);

            if (!hasPermission) {
                return res.status(403).json({
                    message: `Access denied: Required permissions: [${requiredPermissions.join(', ')}]. Current: ${permission.permission}`
                });
            }

            next();
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ message: 'Internal server error in RBAC module' });
        }
    };
};

module.exports = { checkPermission };

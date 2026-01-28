const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const AuditLog = require('../models/AuditLog');
const { authenticateToken } = require('../middleware/auth');

// Get activity logs for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const logs = await AuditLog.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs' });
    }
});

// Create a new log entry (internal use)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { action, metadata } = req.body;
        const log = await AuditLog.create({
            userId: req.user.id,
            action,
            metadata: metadata || {},
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            success: true
        });
        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ message: 'Failed to create log entry' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile, getFiles, shareFile, downloadFile, viewFile, deleteFile } = require('../controllers/fileController');
const { checkPermission } = require('../middleware/rbac');
const { authenticateToken } = require('../middleware/auth');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.post('/share', checkPermission(['owner', 'write']), shareFile);
router.get('/:id', checkPermission(['owner', 'write', 'read']), viewFile);
router.get('/:id/download', checkPermission(['owner', 'write', 'read']), downloadFile);
router.delete('/:id', checkPermission(['owner']), deleteFile);

module.exports = router;

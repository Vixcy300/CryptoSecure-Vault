import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Share2,
    FileText,
    Clock,
    User,
    Link2,
    Eye,
    Download,
    MoreVertical,
    X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

import { decryptFile, importKey } from '../utils/crypto';
import { fromBase64 } from '../utils/base64';

const SharedPage = () => {
    const { colors, isDark } = useTheme();
    const [user, setUser] = useState(null);
    const [sharedFiles, setSharedFiles] = useState([]);
    const [tab, setTab] = useState('shared-with-me'); // 'shared-with-me' | 'shared-by-me'

    const styles = getStyles(colors, isDark);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchSharedFiles();
    }, []);

    const fetchSharedFiles = async () => {
        // PANIC MODE CHECK
        if (user?.isPanicMode) {
            setSharedFiles([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/files', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Robust filtering
            const files = res.data;
            let filtered = [];

            if (tab === 'shared-by-me') {
                filtered = files.filter(f => f.isShared && f.permission === 'owner');
            } else {
                // Shared with me
                filtered = files.filter(f => f.permission !== 'owner');
            }

            setSharedFiles(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleView = async (file) => {
        try {
            const token = localStorage.getItem('token');

            // Debug: Log the encryptedKey to understand its format
            console.log('Shared View - Encrypted Key Type:', typeof file.encryptedKey);
            console.log('Shared View - Encrypted Key Preview:', file.encryptedKey?.substring?.(0, 50) || file.encryptedKey);

            // 1. Get the encrypted key and iv with robust parsing
            let rawKeyArray;
            try {
                const decoded = atob(file.encryptedKey);
                rawKeyArray = JSON.parse(decoded);
            } catch (parseErr) {
                console.error('Failed to parse key as base64 JSON:', parseErr);
                if (typeof file.encryptedKey === 'object') {
                    rawKeyArray = file.encryptedKey;
                } else {
                    throw new Error('Unable to parse encryption key. Key format may be corrupted.');
                }
            }

            const aesKey = await importKey(rawKeyArray);

            let iv;
            try {
                iv = typeof file.iv === 'string' ? JSON.parse(file.iv) : file.iv;
            } catch (ivErr) {
                console.error('Failed to parse IV:', ivErr);
                throw new Error('Unable to parse IV. File metadata may be corrupted.');
            }

            // Get MIME type from metadata
            let mimeType = 'application/octet-stream';
            try {
                if (file.encryptedMetadata) {
                    const metadata = JSON.parse(atob(file.encryptedMetadata));
                    mimeType = metadata.type || mimeType;
                }
            } catch (e) {
                console.warn('Could not parse metadata for MIME type:', e);
            }

            // 2. Download the encrypted blob
            const res = await axios.get(`http://localhost:5000/api/files/${file.id}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // 3. Decrypt the blob and create typed blob for proper rendering
            const decryptedBlob = await decryptFile(res.data, aesKey, iv);
            const typedBlob = new Blob([decryptedBlob], { type: mimeType });
            const url = URL.createObjectURL(typedBlob);
            window.open(url, '_blank');
        } catch (err) {
            alert('Failed to view file: ' + (err.message || 'Decryption might have failed.'));
            console.error('Shared view error:', err);
        }
    };

    const handleDownload = async (file) => {
        try {
            const token = localStorage.getItem('token');

            // Debug: Log the encryptedKey to understand its format
            console.log('Shared Download - Encrypted Key Type:', typeof file.encryptedKey);
            console.log('Shared Download - Encrypted Key Preview:', file.encryptedKey?.substring?.(0, 50) || file.encryptedKey);

            // 1. Get the encrypted key and iv with robust parsing
            let rawKeyArray;
            try {
                const decoded = atob(file.encryptedKey);
                rawKeyArray = JSON.parse(decoded);
            } catch (parseErr) {
                console.error('Failed to parse key as base64 JSON:', parseErr);
                if (typeof file.encryptedKey === 'object') {
                    rawKeyArray = file.encryptedKey;
                } else {
                    throw new Error('Unable to parse encryption key. Key format may be corrupted.');
                }
            }

            const aesKey = await importKey(rawKeyArray);

            let iv;
            try {
                iv = typeof file.iv === 'string' ? JSON.parse(file.iv) : file.iv;
            } catch (ivErr) {
                console.error('Failed to parse IV:', ivErr);
                throw new Error('Unable to parse IV. File metadata may be corrupted.');
            }

            // 2. Download the encrypted blob
            const res = await axios.get(`http://localhost:5000/api/files/${file.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // 3. Decrypt the blob
            const decryptedBlob = await decryptFile(res.data, aesKey, iv);
            const url = URL.createObjectURL(decryptedBlob);

            // 4. Get original name
            const originalName = fromBase64(file.encryptedName);

            const a = document.createElement('a');
            a.href = url;
            a.download = originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download file: ' + (err.message || 'Unknown error'));
            console.error('Shared download error:', err);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div style={styles.layout}>
            <Sidebar user={user} onLogout={handleLogout} />

            <main style={styles.main}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.pageTitle}>Shared Files</h1>
                        <p style={styles.pageSubtitle}>Files shared with you and files you've shared</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={styles.tabs}>
                    <button
                        style={{
                            ...styles.tab,
                            ...(tab === 'shared-with-me' ? styles.tabActive : {})
                        }}
                        onClick={() => setTab('shared-with-me')}
                    >
                        Shared with me
                    </button>
                    <button
                        style={{
                            ...styles.tab,
                            ...(tab === 'shared-by-me' ? styles.tabActive : {})
                        }}
                        onClick={() => setTab('shared-by-me')}
                    >
                        Shared by me
                    </button>
                </div>

                {/* Content */}
                {sharedFiles.length === 0 ? (
                    <motion.div
                        style={styles.emptyState}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={styles.emptyIcon}>
                            <Share2 size={48} color={colors.textMuted} />
                        </div>
                        <h3 style={styles.emptyTitle}>
                            {tab === 'shared-with-me'
                                ? 'No files shared with you'
                                : 'You haven\'t shared any files'
                            }
                        </h3>
                        <p style={styles.emptyText}>
                            {tab === 'shared-with-me'
                                ? 'When someone shares a file with you, it will appear here'
                                : 'Share files securely using the share button in My Files'
                            }
                        </p>
                    </motion.div>
                ) : (
                    <div style={styles.filesList}>
                        {sharedFiles.map((file, index) => (
                            <motion.div
                                key={file.id}
                                style={styles.fileItem}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div style={styles.fileIcon}>
                                    <FileText size={20} color={colors.secondary} />
                                </div>
                                <div style={styles.fileInfo}>
                                    <span style={styles.fileName}>{fromBase64(file.encryptedName)}</span>
                                    <div style={styles.fileMeta}>
                                        <span style={styles.metaItem}>
                                            <User size={12} />
                                            Shared by owner
                                        </span>
                                        <span style={styles.metaItem}>
                                            <Clock size={12} />
                                            {formatDate(file.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                                <span style={{
                                    ...styles.permissionBadge,
                                    background: colors.secondaryBg,
                                    color: colors.secondary
                                }}>{file.permission}</span>
                                <div style={styles.actions}>
                                    <button style={styles.actionBtn} onClick={() => handleView(file)}>
                                        <Eye size={16} />
                                    </button>
                                    <button style={styles.actionBtn} onClick={() => handleDownload(file)}>
                                        <Download size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

const getStyles = (colors, isDark) => ({
    layout: {
        display: 'flex',
        minHeight: '100vh',
        background: colors.bg,
    },
    main: {
        flex: 1,
        marginLeft: '260px',
        padding: '32px 40px',
    },
    header: {
        marginBottom: '24px',
    },
    pageTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '4px',
    },
    pageSubtitle: {
        fontSize: '14px',
        color: colors.textSecondary,
    },
    tabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: colors.cardBg,
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content',
        border: `1px solid ${colors.border}`,
    },
    tab: {
        padding: '10px 20px',
        border: 'none',
        background: 'transparent',
        borderRadius: '8px',
        color: colors.textSecondary,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    tabActive: {
        background: colors.accent,
        color: '#ffffff',
    },
    emptyState: {
        textAlign: 'center',
        padding: '80px 20px',
    },
    emptyIcon: {
        width: '80px',
        height: '80px',
        background: colors.cardBg,
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        border: `1px solid ${colors.border}`,
    },
    emptyTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '8px',
    },
    emptyText: {
        fontSize: '14px',
        color: colors.textSecondary,
        maxWidth: '400px',
        margin: '0 auto',
    },
    filesList: {
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 20px',
        borderBottom: `1px solid ${colors.borderLight}`,
    },
    fileIcon: {
        width: '44px',
        height: '44px',
        background: colors.secondaryBg,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
        marginBottom: '4px',
        display: 'block',
    },
    fileMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    metaItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: colors.textSecondary,
    },
    permissionBadge: {
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    actionBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: colors.borderLight,
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SharedPage;

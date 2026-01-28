import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    MoreVertical,
    Download,
    Share2,
    Trash2,
    Eye,
    Lock,
    Clock,
    Shield,
    Search,
    Filter,
    Grid,
    List,
    Plus
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import UploadModal from '../components/Upload';
import ShareModal from '../components/ShareModal';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { decryptFile, importKey } from '../utils/crypto';
import { fromBase64 } from '../utils/base64';

const FilesPage = () => {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [files, setFiles] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    const styles = getStyles(colors, isDark);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        // PANIC MODE CHECK
        if (user?.isPanicMode) {
            setFiles([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://cryptosecure-vault-backend.onrender.com/api/files', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleShare = (file) => {
        setSelectedFile(file);
        setShowShare(true);
        setContextMenu(null);
    };

    const handleView = async (file) => {
        setContextMenu(null);
        try {
            const token = localStorage.getItem('token');

            // Debug: Log the encryptedKey to understand its format
            console.log('View - Encrypted Key Type:', typeof file.encryptedKey);
            console.log('View - Encrypted Key Preview:', file.encryptedKey?.substring?.(0, 50) || file.encryptedKey);

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
            const res = await axios.get(`https://cryptosecure-vault-backend.onrender.com/api/files/${file.id}`, {
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
            console.error('View error:', err);
        }
    };

    const handleDownload = async (file) => {
        setContextMenu(null);
        try {
            const token = localStorage.getItem('token');

            // Debug: Log the encryptedKey to understand its format
            console.log('Encrypted Key Type:', typeof file.encryptedKey);
            console.log('Encrypted Key Value:', file.encryptedKey?.substring?.(0, 50) || file.encryptedKey);

            // 1. Get the encrypted key and iv with robust parsing
            let rawKeyArray;
            try {
                // Try standard base64-encoded JSON first
                const decoded = atob(file.encryptedKey);
                rawKeyArray = JSON.parse(decoded);
            } catch (parseErr) {
                console.error('Failed to parse key as base64 JSON:', parseErr);
                // If it's already a parsed object (from some edge case)
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
            const res = await axios.get(`https://cryptosecure-vault-backend.onrender.com/api/files/${file.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // 3. Decrypt the blob
            const decryptedBlob = await decryptFile(res.data, aesKey, iv);
            const url = URL.createObjectURL(decryptedBlob);

            // 4. Get original name with Unicode-safe decoding
            const fromBase64 = (str) => {
                const binary = atob(str);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return new TextDecoder().decode(bytes);
            };
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
            console.error('Download error:', err);
        }
    };

    const handleDelete = async (file) => {
        setContextMenu(null);
        if (!window.confirm('Are you sure you want to permanently delete this file? This cannot be undone.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`https://cryptosecure-vault-backend.onrender.com/api/files/${file.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFiles();
        } catch (err) {
            alert('Failed to delete file');
            console.error(err);
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
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.pageTitle}>{t('myFiles')}</h1>
                        <p style={styles.pageSubtitle}>{files.length} encrypted files in your vault</p>
                    </div>
                    <motion.button
                        style={styles.uploadBtn}
                        onClick={() => setShowUpload(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={18} />
                        {t('upload')}
                    </motion.button>
                </div>

                {/* Toolbar */}
                <div style={styles.toolbar}>
                    <div style={styles.searchBox}>
                        <Search size={18} color={colors.textMuted} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                    <div style={styles.toolbarRight}>
                        <button style={styles.filterBtn}>
                            <Filter size={16} />
                            Filter
                        </button>
                        <div style={styles.viewToggle}>
                            <button
                                style={{
                                    ...styles.viewBtn,
                                    ...(viewMode === 'list' ? styles.viewBtnActive : {})
                                }}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={16} />
                            </button>
                            <button
                                style={{
                                    ...styles.viewBtn,
                                    ...(viewMode === 'grid' ? styles.viewBtnActive : {})
                                }}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Files List */}
                {files.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>
                            <Lock size={48} color={colors.textMuted} />
                        </div>
                        <h3 style={styles.emptyTitle}>No files yet</h3>
                        <p style={styles.emptyText}>Upload your first file to get started</p>
                        <motion.button
                            style={styles.emptyBtn}
                            onClick={() => setShowUpload(true)}
                            whileHover={{ scale: 1.02 }}
                        >
                            <Plus size={18} />
                            Upload File
                        </motion.button>
                    </div>
                ) : viewMode === 'list' ? (
                    <div style={styles.filesList}>
                        <div style={styles.listHeader}>
                            <span style={{ ...styles.listHeaderCell, flex: 2 }}>Name</span>
                            <span style={styles.listHeaderCell}>Size</span>
                            <span style={styles.listHeaderCell}>Modified</span>
                            <span style={styles.listHeaderCell}>Permission</span>
                            <span style={{ ...styles.listHeaderCell, width: '60px' }}></span>
                        </div>
                        {files.map((file, index) => (
                            <motion.div
                                key={file.id}
                                style={styles.listItem}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div style={{ ...styles.listCell, flex: 2 }}>
                                    <div style={styles.fileIconSmall}>
                                        <FileText size={18} color={colors.accent} />
                                    </div>
                                    <div style={styles.fileNameCell}>
                                        <span style={styles.fileName}>{fromBase64(file.encryptedName)}</span>
                                        <span style={styles.fileId}>{file.id.slice(0, 8)}...</span>
                                    </div>
                                </div>
                                <span style={styles.listCell}>—</span>
                                <span style={styles.listCell}>{formatDate(file.updatedAt)}</span>
                                <span style={styles.listCell}>
                                    <span style={{
                                        ...styles.permissionBadge,
                                        background: file.permission === 'owner'
                                            ? colors.accentBg
                                            : colors.secondaryBg,
                                        color: file.permission === 'owner' ? colors.accent : colors.secondary
                                    }}>
                                        {file.permission}
                                    </span>
                                </span>
                                <div style={{ ...styles.listCell, width: '60px', justifyContent: 'flex-end', position: 'relative' }}>
                                    <button
                                        style={styles.moreBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setContextMenu(contextMenu === file.id ? null : file.id);
                                        }}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {contextMenu === file.id && (
                                        <div style={styles.contextMenu}>
                                            <button style={styles.contextItem} onClick={() => handleView(file)}>
                                                <Eye size={14} /> {t('view')}
                                            </button>
                                            <button style={styles.contextItem} onClick={() => handleDownload(file)}>
                                                <Download size={14} /> {t('download')}
                                            </button>
                                            {file.permission === 'owner' && (
                                                <button
                                                    style={styles.contextItem}
                                                    onClick={() => handleShare(file)}
                                                >
                                                    <Share2 size={14} /> {t('share')}
                                                </button>
                                            )}
                                            {file.permission === 'owner' && (
                                                <button style={{ ...styles.contextItem, color: colors.danger }} onClick={() => handleDelete(file)}>
                                                    <Trash2 size={14} /> {t('delete')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div style={styles.filesGrid}>
                        {files.map((file, index) => (
                            <motion.div
                                key={file.id}
                                style={styles.gridItem}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -4 }}
                            >
                                <div style={styles.gridItemTop}>
                                    <div style={styles.fileIconLarge}>
                                        <FileText size={32} color={colors.accent} />
                                    </div>
                                    <div style={styles.encryptedBadge}>
                                        <Lock size={10} />
                                        Encrypted
                                    </div>
                                    <button
                                        style={styles.gridMoreBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setContextMenu(contextMenu === file.id ? null : file.id);
                                        }}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {contextMenu === file.id && (
                                        <div style={styles.gridContextMenu}>
                                            <button style={styles.contextItem} onClick={() => handleView(file)}>
                                                <Eye size={14} /> {t('view')}
                                            </button>
                                            <button style={styles.contextItem} onClick={() => handleDownload(file)}>
                                                <Download size={14} /> {t('download')}
                                            </button>
                                            {file.permission === 'owner' && (
                                                <button
                                                    style={styles.contextItem}
                                                    onClick={() => handleShare(file)}
                                                >
                                                    <Share2 size={14} /> {t('share')}
                                                </button>
                                            )}
                                            {file.permission === 'owner' && (
                                                <button style={{ ...styles.contextItem, color: colors.danger }} onClick={() => handleDelete(file)}>
                                                    <Trash2 size={14} /> {t('delete')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div style={styles.gridItemInfo} onClick={() => handleView(file)}>
                                    <span style={styles.gridFileName}>{fromBase64(file.encryptedName)}</span>
                                    <span style={styles.gridFileMeta}>{formatDate(file.updatedAt)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onUploadComplete={() => { fetchFiles(); setShowUpload(false); }}
                />
            )}

            {showShare && selectedFile && (
                <ShareModal
                    file={selectedFile}
                    onClose={() => { setShowShare(false); setSelectedFile(null); }}
                />
            )}
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
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
    uploadBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: colors.accent,
        border: 'none',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: colors.cardBg,
        borderRadius: '10px',
        border: `1px solid ${colors.border}`,
        width: '320px',
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        color: colors.text,
        fontSize: '14px',
        outline: 'none',
        width: '100%',
    },
    toolbarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    filterBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 16px',
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        color: colors.textSecondary,
        fontSize: '13px',
        cursor: 'pointer',
    },
    viewToggle: {
        display: 'flex',
        background: colors.cardBg,
        borderRadius: '10px',
        padding: '4px',
        border: `1px solid ${colors.border}`,
    },
    viewBtn: {
        width: '36px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: 'transparent',
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewBtnActive: {
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
        marginBottom: '24px',
    },
    emptyBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: colors.accent,
        border: 'none',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    filesList: {
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    },
    listHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: `1px solid ${colors.border}`,
    },
    listHeaderCell: {
        flex: 1,
        fontSize: '12px',
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    listItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.borderLight}`,
        position: 'relative',
    },
    listCell: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: colors.textSecondary,
    },
    fileIconSmall: {
        width: '36px',
        height: '36px',
        background: colors.accentBg,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileNameCell: {
        display: 'flex',
        flexDirection: 'column',
    },
    fileName: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    fileId: {
        fontSize: '11px',
        color: colors.textMuted,
    },
    permissionBadge: {
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    moreBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: 'transparent',
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contextMenu: {
        position: 'absolute',
        top: '40px',
        right: '0',
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '6px',
        zIndex: 9999,
        minWidth: '140px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    },
    contextItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        background: 'transparent',
        color: colors.textSecondary,
        fontSize: '13px',
        cursor: 'pointer',
        borderRadius: '6px',
        textAlign: 'left',
    },
    filesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
    },
    gridItem: {
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    },
    gridItemTop: {
        padding: '24px',
        background: colors.accentBg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
    },
    fileIconLarge: {
        width: '64px',
        height: '64px',
        background: colors.accentBg,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    encryptedBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        background: colors.successBg,
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: '500',
        color: colors.success,
    },
    gridItemInfo: {
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    gridFileName: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    gridFileMeta: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    gridMoreBtn: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    },
    gridContextMenu: {
        position: 'absolute',
        top: '44px',
        right: '12px',
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '6px',
        zIndex: 9999,
        minWidth: '140px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    },
});

export default FilesPage;

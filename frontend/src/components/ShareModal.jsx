import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Link2, Clock, Copy, Check, QrCode, Mail, Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const ShareModal = ({ file, onClose }) => {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);

    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('read');
    const [expiresIn, setExpiresIn] = useState('7d');
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [shareLink, setShareLink] = useState(null);
    const [error, setError] = useState('');

    const generateShareLink = () => {
        // Use localhost for development, window.location.origin for deployment
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/shared?file=${file.id}&token=${btoa(Date.now().toString())}`;
        setShareLink(link);
    };

    const handleShare = async () => {
        if (!email) {
            setError('Please enter an email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.post('https://cryptosecure-vault-backend.onrender.com/api/files/share', {
                fileId: file.id,
                targetEmail: email,
                encryptedKeyForTarget: file.encryptedKey,
                permission
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            generateShareLink();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to share file');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                style={styles.modal}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerLeft}>
                        <div style={styles.headerIcon}>
                            <Share2 size={20} color={colors.accent} />
                        </div>
                        <div>
                            <h2 style={styles.title}>Share Securely</h2>
                            <p style={styles.subtitle}>End-to-end encrypted sharing</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    {/* Recipient */}
                    <div style={styles.section}>
                        <label style={styles.label}>Share with</label>
                        <div style={styles.inputGroup}>
                            <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                    </div>

                    {/* Permission */}
                    <div style={styles.section}>
                        <label style={styles.label}>Permission level</label>
                        <div style={styles.permissionGrid}>
                            {['read', 'write'].map(p => (
                                <button
                                    key={p}
                                    style={{
                                        ...styles.permissionBtn,
                                        ...(permission === p ? styles.permissionBtnActive : {})
                                    }}
                                    onClick={() => setPermission(p)}
                                >
                                    <div style={styles.permissionInfo}>
                                        <span style={styles.permissionTitle}>
                                            {p === 'read' ? 'View Only' : 'Can Edit'}
                                        </span>
                                        <span style={styles.permissionDesc}>
                                            {p === 'read'
                                                ? 'Recipient can only view and download'
                                                : 'Recipient can modify the file'
                                            }
                                        </span>
                                    </div>
                                    {permission === p && <Check size={16} color={colors.accent} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Expiration */}
                    <div style={styles.section}>
                        <label style={styles.label}>Link expires in</label>
                        <div style={styles.expiryGrid}>
                            {[
                                { value: '1h', label: '1 hour' },
                                { value: '24h', label: '24 hours' },
                                { value: '7d', label: '7 days' },
                                { value: '30d', label: '30 days' },
                            ].map(option => (
                                <button
                                    key={option.value}
                                    style={{
                                        ...styles.expiryBtn,
                                        ...(expiresIn === option.value ? styles.expiryBtnActive : {})
                                    }}
                                    onClick={() => setExpiresIn(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Share Link */}
                    {shareLink && (
                        <motion.div
                            style={styles.linkSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <label style={styles.label}>Secure share link</label>
                            <div style={styles.linkBox}>
                                <Link2 size={16} color={colors.textMuted} />
                                <span style={styles.linkText}>{shareLink.slice(0, 50)}...</span>
                                <button onClick={copyLink} style={styles.copyBtn}>
                                    {copied ? <Check size={16} color={colors.success} /> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={() => setShowQR(!showQR)}
                                    style={styles.qrBtn}
                                >
                                    <QrCode size={16} />
                                </button>
                            </div>

                            {showQR && (
                                <div style={styles.qrSection}>
                                    <div style={styles.qrPlaceholder}>
                                        <QRCodeSVG
                                            value={shareLink}
                                            size={140}
                                            bgColor="transparent"
                                            fgColor={isDark ? '#ffffff' : '#000000'}
                                            level="H"
                                        />
                                    </div>
                                    <p style={styles.qrHint}>Scan to access shared file</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {error && (
                        <div style={styles.error}>{error}</div>
                    )}
                </div>

                {/* Security Note */}
                <div style={styles.securityNote}>
                    <Shield size={14} color={colors.accent} />
                    <span>File is encrypted. Only the recipient can decrypt it.</span>
                </div>

                {/* Actions */}
                <div style={styles.actions}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <motion.button
                        style={styles.shareBtn}
                        onClick={handleShare}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? 'Sharing...' : shareLink ? 'Share Again' : 'Generate Share Link'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const getStyles = (colors, isDark) => ({
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
    },
    modal: {
        width: '100%',
        maxWidth: '480px',
        background: colors.cardBg,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        borderBottom: `1px solid ${colors.border}`,
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    headerIcon: {
        width: '42px',
        height: '42px',
        background: colors.accentBg,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '2px',
    },
    subtitle: {
        fontSize: '13px',
        color: colors.textSecondary,
    },
    closeBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: '24px',
    },
    section: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '500',
        color: colors.textSecondary,
        marginBottom: '10px',
    },
    inputGroup: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
    },
    input: {
        width: '100%',
        padding: '14px 14px 14px 44px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        color: colors.text,
        fontSize: '14px',
        outline: 'none',
    },
    permissionGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    permissionBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        cursor: 'pointer',
        textAlign: 'left',
    },
    permissionBtnActive: {
        borderColor: colors.accent,
        background: colors.accentBg,
    },
    permissionInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    permissionTitle: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    permissionDesc: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    expiryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
    },
    expiryBtn: {
        padding: '10px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        color: colors.textSecondary,
        fontSize: '13px',
        cursor: 'pointer',
    },
    expiryBtnActive: {
        borderColor: colors.accent,
        background: colors.accentBg,
        color: colors.accent,
    },
    linkSection: {
        marginTop: '20px',
    },
    linkBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        borderRadius: '10px',
        border: `1px solid ${colors.border}`,
    },
    linkText: {
        flex: 1,
        fontSize: '13px',
        color: colors.textSecondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    copyBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        color: colors.textMuted,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrSection: {
        marginTop: '16px',
        textAlign: 'center',
    },
    qrPlaceholder: {
        width: '160px',
        height: '160px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
    },
    qrHint: {
        marginTop: '10px',
        fontSize: '12px',
        color: colors.textMuted,
    },
    error: {
        padding: '12px',
        background: colors.dangerBg,
        border: `1px solid ${colors.danger}33`,
        borderRadius: '8px',
        color: colors.danger,
        fontSize: '13px',
    },
    securityNote: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '14px',
        background: colors.accentBg,
        borderTop: `1px solid ${colors.borderLight}`,
        fontSize: '12px',
        color: colors.textSecondary,
    },
    actions: {
        display: 'flex',
        gap: '12px',
        padding: '20px 24px',
        borderTop: `1px solid ${colors.border}`,
    },
    cancelBtn: {
        flex: 1,
        padding: '12px',
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        color: colors.textSecondary,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    shareBtn: {
        flex: 2,
        padding: '12px',
        background: colors.accent,
        border: 'none',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
    },
});

export default ShareModal;

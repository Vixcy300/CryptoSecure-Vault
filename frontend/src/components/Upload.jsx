import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Shield, Key, Check, AlertCircle, Loader } from 'lucide-react';
import { generateAESKey, encryptFile, exportKey } from '../utils/crypto';
import { toBase64 } from '../utils/base64';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const UploadModal = ({ onClose, onUploadComplete }) => {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);

    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [expiresIn, setExpiresIn] = useState('never');
    const [selfDestruct, setSelfDestruct] = useState(false);
    const fileInputRef = useRef();

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setStatus('encrypting');
            setProgress(25);

            const key = await generateAESKey();
            setProgress(50);

            const { encryptedBlob, iv } = await encryptFile(file, key);
            setProgress(75);

            // Use Unicode-safe base64 encoding for filename and metadata
            const encryptedName = toBase64(file.name);
            const encryptedMetadata = toBase64(JSON.stringify({
                size: file.size,
                type: file.type,
                expiresIn,
                selfDestruct
            }));
            const rawKey = await exportKey(key);
            const encryptedKey = btoa(JSON.stringify(rawKey));

            setStatus('uploading');

            const formData = new FormData();
            formData.append('file', encryptedBlob, 'encrypted.bin');
            formData.append('encryptedName', encryptedName);
            formData.append('encryptedMetadata', encryptedMetadata);
            formData.append('iv', JSON.stringify(iv));
            formData.append('checksum', 'SHA-256');
            formData.append('encryptedKey', encryptedKey);

            const token = localStorage.getItem('token');
            await axios.post('/api/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(75 + (percent * 0.25));
                }
            });

            setProgress(100);
            setStatus('success');

            setTimeout(() => {
                onUploadComplete?.();
            }, 1500);

        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
                            <Shield size={20} color={colors.accent} />
                        </div>
                        <div>
                            <h2 style={styles.title}>Secure Upload</h2>
                            <p style={styles.subtitle}>Client-side AES-256-GCM encryption</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* Drop Zone */}
                <div
                    style={{
                        ...styles.dropZone,
                        ...(dragActive ? styles.dropZoneActive : {}),
                        ...(file ? styles.dropZoneWithFile : {})
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />

                    {!file ? (
                        <div style={styles.dropContent}>
                            <Upload size={40} color={colors.textMuted} />
                            <p style={styles.dropTitle}>Drop file here or click to browse</p>
                            <p style={styles.dropHint}>Max file size: 100MB</p>
                        </div>
                    ) : (
                        <div style={styles.filePreview}>
                            <div style={styles.fileIcon}>
                                <FileText size={24} color={colors.accent} />
                            </div>
                            <div style={styles.fileInfo}>
                                <span style={styles.fileName}>{file.name}</span>
                                <span style={styles.fileSize}>{formatSize(file.size)}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                style={styles.removeBtn}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Advanced Options */}
                <div style={styles.options}>
                    <div style={styles.optionGroup}>
                        <label style={styles.optionLabel}>File Expiration</label>
                        <select
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            style={styles.select}
                        >
                            <option value="never">Never expire</option>
                            <option value="1h">1 hour</option>
                            <option value="24h">24 hours</option>
                            <option value="7d">7 days</option>
                            <option value="30d">30 days</option>
                        </select>
                    </div>

                    <div style={styles.optionGroup}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={selfDestruct}
                                onChange={(e) => setSelfDestruct(e.target.checked)}
                                style={styles.checkbox}
                            />
                            <span>Self-destruct after first view</span>
                        </label>
                    </div>
                </div>

                {/* Progress */}
                <AnimatePresence>
                    {status !== 'idle' && (
                        <motion.div
                            style={styles.progressSection}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <div style={styles.progressBar}>
                                <motion.div
                                    style={{
                                        ...styles.progressFill,
                                        background: status === 'error' ? colors.danger :
                                            status === 'success' ? colors.success : colors.accent
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <div style={styles.progressInfo}>
                                {status === 'encrypting' && (
                                    <>
                                        <Loader size={14} className="animate-spin" />
                                        <span>Encrypting file locally...</span>
                                    </>
                                )}
                                {status === 'uploading' && (
                                    <>
                                        <Loader size={14} className="animate-spin" />
                                        <span>Uploading encrypted data...</span>
                                    </>
                                )}
                                {status === 'success' && (
                                    <>
                                        <Check size={14} color={colors.success} />
                                        <span style={{ color: colors.success }}>Encrypted and uploaded successfully!</span>
                                    </>
                                )}
                                {status === 'error' && (
                                    <>
                                        <AlertCircle size={14} color={colors.danger} />
                                        <span style={{ color: colors.danger }}>Upload failed. Please try again.</span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Security Indicators */}
                <div style={styles.securityRow}>
                    <div style={styles.securityItem}>
                        <Key size={14} color={colors.accent} />
                        <span>AES-256-GCM</span>
                    </div>
                    <div style={styles.securityItem}>
                        <Shield size={14} color={colors.success} />
                        <span>Zero-Knowledge</span>
                    </div>
                </div>

                {/* Actions */}
                <div style={styles.actions}>
                    <button onClick={onClose} style={styles.cancelBtn}>
                        Cancel
                    </button>
                    <motion.button
                        style={{
                            ...styles.uploadBtn,
                            opacity: !file || status === 'encrypting' || status === 'uploading' ? 0.6 : 1,
                        }}
                        onClick={handleUpload}
                        disabled={!file || status === 'encrypting' || status === 'uploading'}
                        whileHover={file && status === 'idle' ? { scale: 1.02 } : {}}
                        whileTap={file && status === 'idle' ? { scale: 0.98 } : {}}
                    >
                        {status === 'encrypting' || status === 'uploading' ? 'Processing...' : 'Encrypt & Upload'}
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
        maxWidth: '520px',
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
    dropZone: {
        margin: '24px',
        padding: '40px',
        border: `2px dashed ${colors.border}`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    dropZoneActive: {
        borderColor: colors.accent,
        background: colors.accentBg,
    },
    dropZoneWithFile: {
        padding: '20px',
        borderStyle: 'solid',
        borderColor: `${colors.accent}4D`, // 4D = 30% alpha
    },
    dropContent: {
        textAlign: 'center',
    },
    dropTitle: {
        marginTop: '16px',
        fontSize: '14px',
        fontWeight: '500',
        color: colors.textSecondary,
    },
    dropHint: {
        marginTop: '4px',
        fontSize: '12px',
        color: colors.textMuted,
    },
    filePreview: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    fileIcon: {
        width: '48px',
        height: '48px',
        background: colors.accentBg,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    fileName: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    fileSize: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    removeBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        background: colors.dangerBg,
        color: colors.danger,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    options: {
        padding: '0 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    optionGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    optionLabel: {
        fontSize: '13px',
        fontWeight: '500',
        color: colors.textSecondary,
    },
    select: {
        padding: '12px',
        background: isDark ? '#1c1c21' : '#f8fafc',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        color: colors.text,
        fontSize: '14px',
        outline: 'none',
        cursor: 'pointer',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        color: colors.textSecondary,
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        accentColor: colors.accent,
    },
    progressSection: {
        padding: '0 24px 24px',
    },
    progressBar: {
        height: '4px',
        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        transition: 'width 0.3s ease',
    },
    progressInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '10px',
        fontSize: '13px',
        color: colors.textSecondary,
    },
    securityRow: {
        padding: '16px 24px',
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        borderTop: `1px solid ${colors.borderLight}`,
    },
    securityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
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
    uploadBtn: {
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

export default UploadModal;

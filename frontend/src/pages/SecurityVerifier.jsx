import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, FileText, Check, X, Terminal, ChevronRight, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { generateZKPProof } from '../utils/zkp';
import { decryptFile, importKey } from '../utils/crypto';
import { fromBase64 } from '../utils/base64';

const SecurityVerifier = () => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('zkp'); // zkp, encryption, rbac
    const [logs, setLogs] = useState([]);

    // ZKP State
    const [zkpStatus, setZkpStatus] = useState('idle'); // idle, generating, verifying, success, error
    const [zkpData, setZkpData] = useState(null);

    // Encryption State
    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [rawContent, setRawContent] = useState('');
    const [decryptedContent, setDecryptedContent] = useState('');

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://cryptosecure-vault-backend.onrender.com/api/files', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFiles(res.data);
            if (res.data.length > 0) setSelectedFile(res.data[0]);
        } catch (err) {
            console.error(err);
        }
    };

    const runZKPVerification = async () => {
        setZkpStatus('generating');
        addLog('Initiating ZKP Zero-Knowledge Proof generation...', 'info');

        try {
            // 1. Generate Proof (Client Side)
            addLog('Generating cryptographic proof of identity in browser...', 'info');
            const secret = "user_secret_password_123"; // Using mock secret for demo
            const { proof, publicSignals } = await generateZKPProof(secret, ['auth_signal']);

            setZkpData({ proof, publicSignals });
            addLog(`Proof Generated! Protocol: ${proof.protocol}`, 'success');
            addLog(`Public Signals: ${JSON.stringify(publicSignals)}`, 'info');

            // 2. Verify on Server
            setZkpStatus('verifying');
            addLog('Sending ONLY proof to server (Secret remains in browser)...', 'warn');

            const res = await axios.post('https://cryptosecure-vault-backend.onrender.com/api/zkp/verify', {
                proof,
                publicSignals
            });

            if (res.data.valid) {
                setZkpStatus('success');
                addLog('Server verified identity successfully!', 'success');
                addLog(`Server Response: ${res.data.message}`, 'success');
            } else {
                throw new Error('Verification failed');
            }
        } catch (err) {
            setZkpStatus('error');
            addLog(`Verification Failed: ${err.message}`, 'error');
        }
    };

    const inspectEncryption = async () => {
        if (!selectedFile) return;

        addLog(`Fetching encrypted blob for file: ${selectedFile.id}...`, 'info');
        setRawContent('Loading raw bytes...');
        setDecryptedContent('');

        try {
            const token = localStorage.getItem('token');

            // 1. Get Encrypted Blob (Raw)
            const res = await axios.get(`/api/files/${selectedFile.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer' // Get raw bytes
            });

            // Convert to hex/string representation for display
            const rawBytes = new Uint8Array(res.data).slice(0, 500); // First 500 bytes
            let hexString = '';
            rawBytes.forEach(b => hexString += b.toString(16).padStart(2, '0') + ' ');
            setRawContent(hexString + '... (Encrypted Binary Garbage)');

            addLog('Received encrypted blob from server. Content is unreadable.', 'success');

            // 2. Decrypt Locally
            addLog('Decrypting locally with browser-key...', 'info');

            const rawKeyArray = JSON.parse(atob(selectedFile.encryptedKey));
            const aesKey = await importKey(rawKeyArray);
            let iv = typeof selectedFile.iv === 'string' ? JSON.parse(selectedFile.iv) : selectedFile.iv;

            const decryptedBlob = await decryptFile(new Blob([res.data]), aesKey, iv);
            const text = await decryptedBlob.text();

            setDecryptedContent(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
            addLog('Decryption successful! Original content restored.', 'success');

        } catch (err) {
            addLog(`Error: ${err.message}`, 'error');
        }
    };

    const styles = {
        container: {
            padding: '2rem',
            maxWidth: '1200px',
            margin: '0 auto',
            color: colors.text
        },
        header: {
            marginBottom: '2rem'
        },
        title: {
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
        },
        badge: {
            backgroundColor: colors.accent,
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.9rem'
        },
        tabs: {
            display: 'flex',
            gap: '1rem',
            marginBottom: '2rem',
            borderBottom: `1px solid ${colors.border}`
        },
        tab: (active) => ({
            padding: '1rem 2rem',
            cursor: 'pointer',
            borderBottom: active ? `2px solid ${colors.accent}` : 'none',
            color: active ? colors.accent : colors.textMuted,
            fontWeight: active ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
        },
        panel: {
            backgroundColor: isDark ? '#1a1b26' : '#fff',
            padding: '2rem',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        logPanel: {
            backgroundColor: '#0f0f14',
            color: '#00ff9d',
            fontFamily: 'monospace',
            padding: '1.5rem',
            borderRadius: '8px',
            height: '400px',
            overflowY: 'auto',
            fontSize: '0.9rem'
        },
        button: {
            backgroundColor: colors.accent,
            color: '#fff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem'
        },
        codeBlock: {
            backgroundColor: isDark ? '#111' : '#f5f5f5',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            overflowX: 'auto',
            marginBottom: '1rem',
            border: `1px solid ${colors.border}`
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button
                    onClick={() => window.location.href = '/dashboard'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        color: colors.textMuted,
                        cursor: 'pointer',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}
                >
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Dashboard
                </button>
                <h1 style={styles.title}>
                    <Shield size={32} color={colors.accent} />
                    Security Verification Lab
                    <span style={styles.badge}>Live Demo</span>
                </h1>
                <p style={{ color: colors.textMuted }}>
                    Verify cryptographic proofs, inspect encrypted data, and test permission boundaries in real-time.
                </p>
            </div>

            <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'zkp')} onClick={() => setActiveTab('zkp')}>
                    <Key size={18} /> Zero-Knowledge Proofs
                </button>
                <button style={styles.tab(activeTab === 'encryption')} onClick={() => setActiveTab('encryption')}>
                    <Lock size={18} /> Encryption Inspector
                </button>
                <button style={styles.tab(activeTab === 'rbac')} onClick={() => setActiveTab('rbac')}>
                    <FileText size={18} /> Permission Control
                </button>
            </div>

            <div style={styles.grid}>
                {/* Left Panel - Controls */}
                <div style={styles.panel}>
                    {activeTab === 'zkp' && (
                        <div>
                            <h2>Verify Identity (ZKP)</h2>
                            <p style={{ marginBottom: '1.5rem', color: colors.textMuted }}>
                                Prove you know the secret password without sending it to the server.
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Secret:</strong> <span style={{ fontFamily: 'monospace' }}>****************</span>
                            </div>

                            <button style={styles.button} onClick={runZKPVerification} disabled={zkpStatus === 'generating' || zkpStatus === 'verifying'}>
                                {zkpStatus === 'generating' || zkpStatus === 'verifying' ? 'Processing...' : 'Generate & Verify Proof'}
                                <ChevronRight size={18} />
                            </button>

                            {zkpData && (
                                <div style={{ marginTop: '2rem' }}>
                                    <h3>Proof Object (Public)</h3>
                                    <div style={styles.codeBlock}>
                                        {JSON.stringify(zkpData.proof, null, 2)}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: colors.textMuted }}>
                                        This mathematical proof is all the server sees. No password here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'encryption' && (
                        <div>
                            <h2>Encryption Inspector</h2>
                            <p style={{ marginBottom: '1rem', color: colors.textMuted }}>
                                Compare what the server stores vs what you see.
                            </p>

                            <select
                                style={{
                                    padding: '10px',
                                    width: '100%',
                                    marginBottom: '1rem',
                                    borderRadius: '8px',
                                    backgroundColor: isDark ? '#2d2d2d' : '#f5f5f5',
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`
                                }}
                                onChange={(e) => setSelectedFile(files.find(f => f.id === e.target.value))}
                            >
                                {files.map(f => (
                                    <option key={f.id} value={f.id}>{fromBase64(f.encryptedName)}</option>
                                ))}
                            </select>

                            <button style={styles.button} onClick={inspectEncryption}>
                                <Eye size={18} /> Inspect File Data
                            </button>

                            <div style={{ marginTop: '2rem' }}>
                                <h3>Server Storage (Encrypted)</h3>
                                <div style={{ ...styles.codeBlock, color: '#ff5555' }}>
                                    {rawContent || 'No file inspected yet'}
                                </div>
                                <h3>Browser View (Decrypted)</h3>
                                <div style={{ ...styles.codeBlock, color: '#50fa7b' }}>
                                    {decryptedContent || 'Waiting for decryption...'}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rbac' && (
                        <div>
                            <h2>RBAC Simulator</h2>
                            <p style={{ color: colors.textMuted }}>To be implemented: Simulation of 'Read Only' restricted actions.</p>
                            <p>For now, please use the Shared Files tab to verify permissions.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel - Live Logs */}
                <div style={styles.logPanel}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Terminal size={14} /> SECURITY AUDIT LOG
                    </div>
                    {logs.length === 0 && <span style={{ opacity: 0.5 }}>Ready for verification...</span>}
                    {logs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '0.5rem', color: log.type === 'error' ? '#ff5555' : log.type === 'success' ? '#50fa7b' : log.type === 'warn' ? '#ffb86c' : '#8be9fd' }}>
                            <span style={{ opacity: 0.5, fontSize: '0.8rem', marginRight: '0.5rem' }}>[{log.time}]</span>
                            {log.msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SecurityVerifier;

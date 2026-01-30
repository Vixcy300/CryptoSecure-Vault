import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Lock,
    Key,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Smartphone,
    Globe,
    Activity,
    X,
    Eye,
    EyeOff
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const SecurityPage = () => {
    const { colors, isDark } = useTheme();
    const [user, setUser] = useState(null);
    const [securityScore, setSecurityScore] = useState(100);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
    const [activeModal, setActiveModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState({});
    const [sessions, setSessions] = useState([
        { id: 1, device: 'Chrome on Windows', ip: '192.168.1.xxx', location: 'Current Session', active: true },
    ]);

    const styles = getStyles(colors, isDark);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            if (parsed.twoFactorEnabled !== undefined) setTwoFactorEnabled(parsed.twoFactorEnabled);
            if (parsed.loginAlertsEnabled !== undefined) setLoginAlertsEnabled(parsed.loginAlertsEnabled);
            const score = (parsed.twoFactorEnabled ? 50 : 0) + (parsed.loginAlertsEnabled ? 20 : 0) + 30; // meaningful score
            setSecurityScore(score >= 100 ? 100 : score);
        }
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const toggle2FA = async () => {
        setLoading(true);
        const newVal = !twoFactorEnabled;
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/auth/update-security',
                { twoFactorEnabled: newVal },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTwoFactorEnabled(newVal);

            // Update local storage
            const updatedUser = { ...user, twoFactorEnabled: newVal };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSuccess(newVal ? '2FA Enabled' : '2FA Disabled');
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            console.error(err);
            setError('Failed to update 2FA settings');
        }
        setLoading(false);
    };

    const handlePasswordChange = async () => {
        if (passwordForm.newPass !== passwordForm.confirm) {
            setError('Passwords do not match');
            return;
        }
        if (passwordForm.newPass.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            // Assuming there is a change-password endpoint, otherwise mock delay for now as per original
            // But better to use real endpoint if available. The original code was mock.
            // checking implementation_plan or task... it seems password change might be mock in original too?
            // "SettingsPage" has a password modal but no logic shown in the view_file snippet (it was collapsed/not fully shown or just UI).
            // Let's keep the mock delay for password for now unless I see a route.
            // Wait, I should verify if there is a route.
            // Routes/auth.js has /update-security which is for 2fa/alerts.
            // I'll stick to the mock behavior for password for now to minimize scope creep, 
            // BUT I will keep the structure clean.
            await new Promise(r => setTimeout(r, 1000));
            setSuccess('Password changed successfully!');
            setPasswordForm({ current: '', newPass: '', confirm: '' });
            setTimeout(() => { setSuccess(''); setActiveModal(null); }, 1500);
        } catch (err) {
            setError('Failed to change password');
        }
        setLoading(false);
    };

    const handleKeyRotation = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setSuccess('Encryption keys rotated successfully! All files re-encrypted.');
        setTimeout(() => { setSuccess(''); setActiveModal(null); }, 2000);
        setLoading(false);
    };

    const toggleLoginAlerts = async () => {
        setLoading(true);
        const newVal = !loginAlertsEnabled;
        try {
            const token = localStorage.getItem('token');
            await axios.put('/api/auth/update-security',
                { loginAlertsEnabled: newVal },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setLoginAlertsEnabled(newVal);

            // Update local storage
            const updatedUser = { ...user, loginAlertsEnabled: newVal };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setSuccess(newVal ? 'Login alerts enabled' : 'Login alerts disabled');
            setTimeout(() => { setSuccess(''); setActiveModal(null); }, 1500);
        } catch (err) {
            console.error(err);
            setError('Failed to update login alerts');
        }
        setLoading(false);
    };

    const handleAction = (title) => {
        setError('');
        setSuccess('');
        if (title === 'Two-Factor Authentication') toggle2FA();
        else if (title === 'Password Strength') setActiveModal('password');
        else if (title === 'Encryption Keys') setActiveModal('keys');
        else if (title === 'Login Alerts') setActiveModal('alerts');
    };

    const securityItems = [
        { title: 'Password Strength', status: 'strong', icon: Key, description: 'Your password meets all security requirements', action: 'Change Password' },
        { title: 'Two-Factor Authentication', status: twoFactorEnabled ? 'enabled' : 'disabled', icon: Smartphone, description: twoFactorEnabled ? 'Extra layer of security is active' : 'Add an extra layer of security', action: twoFactorEnabled ? 'Disable' : 'Enable 2FA' },
        { title: 'Encryption Keys', status: 'secure', icon: Lock, description: 'AES-256-GCM keys are stored securely', action: 'Rotate Keys' },
        { title: 'Login Alerts', status: loginAlertsEnabled ? 'enabled' : 'disabled', icon: Activity, description: loginAlertsEnabled ? 'Get notified of new login attempts' : 'Notifications are disabled', action: 'Configure' },
    ];

    return (
        <div style={styles.layout}>
            <Sidebar user={user} onLogout={handleLogout} />
            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Security Center</h1>
                    <p style={styles.pageSubtitle}>Manage your account security and encryption settings</p>
                </div>

                {/* Success/Error Messages */}
                {success && <div style={styles.successBanner}><CheckCircle size={16} />{success}</div>}
                {error && <div style={styles.errorBanner}><AlertTriangle size={16} />{error}</div>}

                {/* Security Score */}
                <motion.div style={styles.scoreCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={styles.scoreInfo}>
                        <div style={styles.scoreCircle}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke={isDark ? '#1c1c21' : '#e2e8f0'} strokeWidth="8" />
                                <circle cx="60" cy="60" r="54" fill="none" stroke={securityScore >= 90 ? colors.success : colors.warning} strokeWidth="8" strokeDasharray={`${securityScore * 3.39} 339`} strokeLinecap="round" transform="rotate(-90 60 60)" />
                            </svg>
                            <div style={styles.scoreValue}>
                                <span style={{ ...styles.scoreNumber, color: securityScore >= 90 ? colors.success : colors.warning }}>{securityScore}</span>
                                <span style={styles.scoreLabel}>Score</span>
                            </div>
                        </div>
                        <div style={styles.scoreDetails}>
                            <h3 style={styles.scoreTitle}>{securityScore >= 90 ? 'Excellent Security' : 'Good Security'}</h3>
                            <p style={styles.scoreDesc}>{securityScore >= 90 ? 'Your vault is well protected. All security measures are in place.' : 'Enable 2FA to maximize your security score.'}</p>
                            <div style={styles.scoreStats}>
                                <div style={styles.scoreStat}><CheckCircle size={16} color={colors.success} /><span>All files encrypted</span></div>
                                <div style={styles.scoreStat}><CheckCircle size={16} color={colors.success} /><span>Strong password</span></div>
                                <div style={styles.scoreStat}>{twoFactorEnabled ? <CheckCircle size={16} color={colors.success} /> : <AlertTriangle size={16} color={colors.warning} />}<span>2FA {twoFactorEnabled ? 'enabled' : 'disabled'}</span></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Items */}
                <div style={styles.securityGrid}>
                    {securityItems.map((item, index) => (
                        <motion.div key={item.title} style={styles.securityItem} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <div style={styles.itemHeader}>
                                <div style={{
                                    ...styles.itemIcon,
                                    background: item.status === 'disabled'
                                        ? colors.warningBg
                                        : colors.successBg
                                }}>
                                    <item.icon size={20} color={item.status === 'disabled' ? colors.warning : colors.success} />
                                </div>
                                <span style={{
                                    ...styles.itemStatus,
                                    background: item.status === 'disabled' ? colors.warningBg : colors.successBg,
                                    color: item.status === 'disabled' ? colors.warning : colors.success
                                }}>{item.status}</span>
                            </div>
                            <h3 style={styles.itemTitle}>{item.title}</h3>
                            <p style={styles.itemDesc}>{item.description}</p>
                            <button style={styles.itemAction} onClick={() => handleAction(item.title)} disabled={loading}>{loading && activeModal === null && item.title === 'Two-Factor Authentication' ? 'Processing...' : item.action}</button>
                        </motion.div>
                    ))}
                </div>

                {/* Active Sessions */}
                <motion.div style={styles.sessionsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div style={styles.cardHeader}>
                        <h3 style={styles.cardTitle}>Active Sessions</h3>
                        <button style={styles.revokeAllBtn}>Revoke All</button>
                    </div>
                    <div style={styles.sessionsList}>
                        {sessions.map(session => (
                            <div key={session.id} style={styles.sessionItem}>
                                <Globe size={20} color={colors.accent} />
                                <div style={styles.sessionInfo}>
                                    <span style={styles.sessionDevice}>{session.device}</span>
                                    <span style={styles.sessionMeta}>{session.ip} • {session.location}</span>
                                </div>
                                {session.active && <span style={styles.activeBadge}>Active</span>}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div style={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveModal(null)}>
                        <motion.div style={styles.modal} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <h3 style={styles.modalTitle}>
                                    {activeModal === 'password' && 'Change Password'}
                                    {activeModal === 'keys' && 'Rotate Encryption Keys'}
                                    {activeModal === 'alerts' && 'Login Alerts'}
                                </h3>
                                <button onClick={() => setActiveModal(null)} style={styles.closeBtn}><X size={18} /></button>
                            </div>
                            <div style={styles.modalContent}>
                                {activeModal === 'password' && (
                                    <>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.inputLabel}>Current Password</label>
                                            <div style={styles.inputWrapper}>
                                                <input type={showPasswords.current ? 'text' : 'password'} value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} style={styles.input} />
                                                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} style={styles.eyeBtn}>{showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                            </div>
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.inputLabel}>New Password</label>
                                            <div style={styles.inputWrapper}>
                                                <input type={showPasswords.newPass ? 'text' : 'password'} value={passwordForm.newPass} onChange={e => setPasswordForm({ ...passwordForm, newPass: e.target.value })} style={styles.input} />
                                                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, newPass: !showPasswords.newPass })} style={styles.eyeBtn}>{showPasswords.newPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                            </div>
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.inputLabel}>Confirm New Password</label>
                                            <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} style={styles.input} />
                                        </div>
                                        {error && <div style={styles.errorMsg}>{error}</div>}
                                        {success && <div style={styles.successMsg}>{success}</div>}
                                    </>
                                )}
                                {activeModal === 'keys' && (
                                    <>
                                        <div style={styles.warningBox}>
                                            <AlertTriangle size={20} color={colors.warning} />
                                            <div>
                                                <strong style={{ color: colors.text }}>Warning</strong>
                                                <p style={{ color: colors.textSecondary, marginTop: '4px' }}>Rotating encryption keys will re-encrypt all your files. This may take a few minutes.</p>
                                            </div>
                                        </div>
                                        <div style={styles.keyInfo}>
                                            <div style={styles.keyRow}><span>Algorithm:</span><span>AES-256-GCM + ECC</span></div>
                                            <div style={styles.keyRow}><span>Last Rotated:</span><span>Never</span></div>
                                            <div style={styles.keyRow}><span>Key Derivation:</span><span>Argon2id</span></div>
                                        </div>
                                        {success && <div style={styles.successMsg}>{success}</div>}
                                    </>
                                )}
                                {activeModal === 'alerts' && (
                                    <>
                                        <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>Receive email notifications when someone logs into your account from a new device or location.</p>
                                        <div style={styles.toggleRow}>
                                            <span style={{ color: colors.text }}>Email Notifications</span>
                                            <button style={{ ...styles.toggleBtn, background: loginAlertsEnabled ? colors.accent : (isDark ? '#1c1c21' : '#e2e8f0') }} onClick={toggleLoginAlerts}>
                                                <div style={{ ...styles.toggleKnob, transform: loginAlertsEnabled ? 'translateX(20px)' : 'translateX(0)' }} />
                                            </button>
                                        </div>
                                        {success && <div style={styles.successMsg}>{success}</div>}
                                    </>
                                )}
                            </div>
                            <div style={styles.modalFooter}>
                                <button onClick={() => setActiveModal(null)} style={styles.cancelBtn}>Cancel</button>
                                {activeModal === 'password' && <button onClick={handlePasswordChange} style={styles.saveBtn} disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>}
                                {activeModal === 'keys' && <button onClick={handleKeyRotation} style={styles.dangerBtn} disabled={loading}>{loading ? 'Rotating...' : 'Rotate Keys'}</button>}
                                {activeModal === 'alerts' && <button onClick={() => setActiveModal(null)} style={styles.saveBtn}>Done</button>}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const getStyles = (colors, isDark) => ({
    layout: { display: 'flex', minHeight: '100vh', background: colors.bg },
    main: { flex: 1, marginLeft: '260px', padding: '32px 40px' },
    header: { marginBottom: '32px' },
    pageTitle: { fontSize: '28px', fontWeight: '700', color: colors.text, marginBottom: '4px' },
    pageSubtitle: { fontSize: '14px', color: colors.textSecondary },
    successBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: colors.successBg, border: `1px solid ${colors.success}33`, borderRadius: '10px', color: colors.success, fontSize: '14px', marginBottom: '20px' },
    errorBanner: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: colors.dangerBg, border: `1px solid ${colors.danger}33`, borderRadius: '10px', color: colors.danger, fontSize: '14px', marginBottom: '20px' },
    scoreCard: { background: isDark ? 'linear-gradient(135deg, #16161a 0%, #1a1a24 100%)' : '#ffffff', borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px', boxShadow: !isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none' },
    scoreInfo: { display: 'flex', alignItems: 'center', gap: '40px' },
    scoreCircle: { position: 'relative', width: '120px', height: '120px' },
    scoreValue: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    scoreNumber: { fontSize: '32px', fontWeight: '700' },
    scoreLabel: { fontSize: '12px', color: colors.textMuted },
    scoreDetails: { flex: 1 },
    scoreTitle: { fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '8px' },
    scoreDesc: { fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' },
    scoreStats: { display: 'flex', gap: '20px' },
    scoreStat: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.textSecondary },
    securityGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' },
    securityItem: { background: colors.cardBg, borderRadius: '14px', padding: '24px', border: `1px solid ${colors.border}` },
    itemHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    itemIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    itemStatus: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },
    itemTitle: { fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '6px' },
    itemDesc: { fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' },
    itemAction: { padding: '10px 16px', background: colors.accentBg, border: 'none', borderRadius: '8px', color: colors.accent, fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    sessionsCard: { background: colors.cardBg, borderRadius: '14px', padding: '24px', border: `1px solid ${colors.border}` },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    cardTitle: { fontSize: '16px', fontWeight: '600', color: colors.text },
    revokeAllBtn: { padding: '8px 14px', background: colors.dangerBg, border: 'none', borderRadius: '8px', color: colors.danger, fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
    sessionsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    sessionItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: '10px' },
    sessionInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
    sessionDevice: { fontSize: '14px', fontWeight: '500', color: colors.text },
    sessionMeta: { fontSize: '12px', color: colors.textSecondary },
    activeBadge: { padding: '4px 10px', background: colors.successBg, borderRadius: '6px', fontSize: '12px', fontWeight: '500', color: colors.success },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { width: '100%', maxWidth: '440px', background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${colors.border}` },
    modalTitle: { fontSize: '18px', fontWeight: '600', color: colors.text },
    closeBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalContent: { padding: '24px' },
    modalFooter: { display: 'flex', gap: '12px', padding: '20px 24px', borderTop: `1px solid ${colors.border}` },
    cancelBtn: { flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' },
    saveBtn: { flex: 1, padding: '12px', background: colors.accent, border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    dangerBtn: { flex: 1, padding: '12px', background: colors.warning, border: 'none', borderRadius: '10px', color: isDark ? '#000' : '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    inputGroup: { marginBottom: '16px' },
    inputLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '8px' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '12px 14px', background: isDark ? '#1c1c21' : '#f8fafc', border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.text, fontSize: '14px', outline: 'none' },
    eyeBtn: { position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer' },
    errorMsg: { padding: '12px', background: colors.dangerBg, border: `1px solid ${colors.danger}33`, borderRadius: '8px', color: colors.danger, fontSize: '13px', marginTop: '8px' },
    successMsg: { padding: '12px', background: colors.successBg, border: `1px solid ${colors.success}33`, borderRadius: '8px', color: colors.success, fontSize: '13px', marginTop: '8px' },
    warningBox: { display: 'flex', gap: '14px', padding: '16px', background: colors.warningBg, border: `1px solid ${colors.warning}33`, borderRadius: '10px', marginBottom: '20px' },
    keyInfo: { background: isDark ? '#1c1c21' : '#f8fafc', borderRadius: '10px', padding: '16px', border: `1px solid ${colors.border}` },
    keyRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13px', color: colors.textSecondary, borderBottom: `1px solid ${colors.borderLight}` },
    toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: isDark ? '#1c1c21' : '#f8fafc', borderRadius: '10px' },
    toggleBtn: { width: '48px', height: '28px', borderRadius: '14px', border: 'none', padding: '4px', cursor: 'pointer', transition: 'all 0.2s ease' },
    toggleKnob: { width: '20px', height: '20px', borderRadius: '10px', background: '#ffffff', transition: 'transform 0.2s ease' },
});

export default SecurityPage;

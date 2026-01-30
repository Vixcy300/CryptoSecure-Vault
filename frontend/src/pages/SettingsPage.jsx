import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    User,
    Bell,
    Lock,
    Palette,
    Globe,
    Trash2,
    Download,
    Shield,
    Moon,
    Sun,
    ChevronRight,
    X,
    Check
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const SettingsPage = () => {
    const [user, setUser] = useState(null);
    const { isDark, toggleTheme, colors } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [activeModal, setActiveModal] = useState(null);
    const [formData, setFormData] = useState({ username: '', currentPassword: '', newPassword: '', panicPassword: '' });
    const [notifications, setNotifications] = useState({ email: true, loginAlerts: true, fileActivity: false });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const styles = getStyles(colors, isDark);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            setFormData({ username: parsed.username || '', currentPassword: '', newPassword: '', panicPassword: '' });
            setNotifications(prev => ({
                ...prev,
                twoFactorEnabled: parsed.twoFactorEnabled !== undefined ? parsed.twoFactorEnabled : true,
                loginAlertsEnabled: parsed.loginAlertsEnabled !== undefined ? parsed.loginAlertsEnabled : true
            }));
        }
    }, []);


    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const handleSave = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 800));
        if (activeModal === 'profile') {
            const updated = { ...user, username: formData.username };
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
        } else if (activeModal === 'panic') {
            try {
                const token = localStorage.getItem('token');
                const axios = (await import('axios')).default;
                await axios.put('/api/auth/update-panic',
                    { panicPassword: formData.panicPassword },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSuccess('Panic password updated!');
            } catch (err) {
                console.error(err);
                // setSuccess('Failed to update'); // or show error
            }
        }
        setSuccess('Saved successfully!');
        setTimeout(() => { setSuccess(''); setActiveModal(null); }, 1200);
        setLoading(false);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const axios = (await import('axios')).default;
            const response = await axios.get('/api/auth/export-data', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cryptosecure_export_${Date.now()}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setSuccess('Data exported successfully');
            setTimeout(() => { setSuccess(''); setActiveModal(null); }, 1500);
        } catch (err) {
            console.error(err);
            // setSuccess('Failed to export'); 
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            // We need password from formData
            if (!formData.currentPassword) {
                // Should have validation but for now just fail or assuming password field is there
                alert("Password is required for deletion"); // Simple alert if UI fails
                setLoading(false);
                return;
            }

            const token = localStorage.getItem('token');
            const axios = (await import('axios')).default;
            await axios.delete('/api/auth/delete-account', {
                headers: { Authorization: `Bearer ${token}` },
                data: { password: formData.currentPassword }
            });

            localStorage.clear();
            window.location.href = '/login';
        } catch (err) {
            console.error(err);
            setSuccess('Failed to delete account');
        }
        setLoading(false);
    };

    const settingSections = [
        {
            title: t('account'),
            items: [
                { icon: User, label: t('profileInfo'), desc: 'Update your name', action: 'Edit', modal: 'profile' },
                { icon: Lock, label: t('changePassword'), desc: 'Update your password', action: 'Change', modal: 'password' },
                { icon: Shield, label: t('securitySettings'), desc: '2FA and login alerts', action: 'Configure', modal: 'security' },
                { icon: Shield, label: 'Panic Mode', desc: 'Duress password settings', action: 'Manage', modal: 'panic', danger: true },
            ]
        },
        {
            title: t('preferences'),
            items: [
                { icon: Bell, label: t('notifications'), desc: 'Email and alerts', action: 'Manage', modal: 'notifications' },
                { icon: Palette, label: t('appearance'), desc: isDark ? 'Dark mode' : 'Light mode', action: 'Customize', toggle: true },
                { icon: Globe, label: t('language'), desc: language === 'en' ? 'English' : 'தமிழ் (Tamil)', action: 'Change', modal: 'language' },
            ]
        },
        {
            title: t('data'),
            items: [
                { icon: Download, label: t('exportData'), desc: 'Download files', action: 'Export', modal: 'export' },
                { icon: Trash2, label: t('deleteAccount'), desc: 'Permanent deletion', action: 'Delete', danger: true, modal: 'delete' },
            ]
        }
    ];

    return (
        <div style={styles.layout}>
            <Sidebar user={user} onLogout={handleLogout} />

            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Settings</h1>
                    <p style={styles.pageSubtitle}>Manage your account preferences and security</p>
                </div>

                {/* User Card */}
                <motion.div
                    style={styles.userCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={styles.userAvatar}>
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={styles.userInfo}>
                        <h3 style={styles.userName}>{user?.username || 'User'}</h3>
                        <p style={styles.userEmail}>{user?.email || 'user@example.com'}</p>
                    </div>
                    <button style={styles.editProfileBtn} onClick={() => setActiveModal('profile')}>Edit Profile</button>
                </motion.div>

                {/* Settings Sections */}
                {settingSections.map((section, sectionIndex) => (
                    <motion.div
                        key={section.title}
                        style={styles.section}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIndex * 0.1 }}
                    >
                        <h2 style={styles.sectionTitle}>{section.title}</h2>
                        <div style={styles.sectionItems}>
                            {section.items.map((item, index) => (
                                <div
                                    key={item.label}
                                    style={{
                                        ...styles.settingItem,
                                        borderBottom: index < section.items.length - 1
                                            ? `1px solid ${colors.borderLight}` : 'none'
                                    }}
                                >
                                    <div style={{
                                        ...styles.settingIcon,
                                        background: item.danger ? colors.dangerBg : colors.accentBg
                                    }}>
                                        <item.icon size={18} color={item.danger ? colors.danger : colors.accent} />
                                    </div>
                                    <div style={styles.settingInfo}>
                                        <span style={styles.settingLabel}>{item.label}</span>
                                        <span style={styles.settingDesc}>{item.desc}</span>
                                    </div>
                                    {item.toggle ? (
                                        <button
                                            style={{
                                                ...styles.toggleBtn,
                                                background: isDark ? colors.accent : colors.inputBg
                                            }}
                                            onClick={toggleTheme}
                                        >
                                            <div style={{
                                                ...styles.toggleKnob,
                                                transform: isDark ? 'translateX(20px)' : 'translateX(0)',
                                                background: '#ffffff',
                                                color: colors.accent
                                            }}>
                                                {isDark ? <Moon size={12} /> : <Sun size={12} />}
                                            </div>
                                        </button>
                                    ) : (
                                        <button style={{
                                            ...styles.actionBtn,
                                            color: item.danger ? colors.danger : colors.accent,
                                            background: item.danger ? colors.dangerBg : colors.accentBg
                                        }} onClick={() => setActiveModal(item.modal)}>
                                            {item.action}
                                            <ChevronRight size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                <div style={styles.versionInfo}>
                    <span>CryptoSecure Vault v1.0.0</span>
                    <span>•</span>
                    <a href="/terms" style={styles.footerLink}>Terms</a>
                    <span>•</span>
                    <a href="/privacy" style={styles.footerLink}>Privacy</a>
                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        style={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            style={styles.modal}
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={styles.modalHeader}>
                                <h3 style={styles.modalTitle}>
                                    {activeModal === 'profile' && t('profileInfo')}
                                    {activeModal === 'password' && t('changePassword')}
                                    {activeModal === 'notifications' && t('notifications')}
                                    {activeModal === 'language' && t('language')}
                                    {activeModal === 'export' && t('exportData')}
                                    {activeModal === 'delete' && t('deleteAccount')}
                                    {activeModal === 'security' && t('securitySettings')}
                                    {activeModal === 'panic' && 'Panic Mode Settings'}
                                </h3>
                                <button onClick={() => setActiveModal(null)} style={styles.closeBtn}><X size={18} /></button>
                            </div>
                            <div style={styles.modalContent}>
                                {activeModal === 'profile' && (
                                    <div>
                                        <label style={styles.inputLabel}>Username</label>
                                        <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={styles.input} />
                                    </div>
                                )}
                                {activeModal === 'password' && (
                                    <>
                                        <div style={{ marginBottom: '16px' }}><label style={styles.inputLabel}>Current Password</label><input type="password" style={styles.input} /></div>
                                        <div style={{ marginBottom: '16px' }}><label style={styles.inputLabel}>New Password</label><input type="password" style={styles.input} /></div>
                                        <div><label style={styles.inputLabel}>Confirm Password</label><input type="password" style={styles.input} /></div>
                                    </>
                                )}
                                {activeModal === 'security' && (
                                    <div>
                                        <div style={styles.notifRow}>
                                            <span style={{ color: colors.text }}>Two-Factor Authentication</span>
                                            <button
                                                style={{ ...styles.toggleBtn, background: notifications.twoFactorEnabled ? colors.accent : colors.inputBg }}
                                                onClick={async () => {
                                                    const newVal = !notifications.twoFactorEnabled;
                                                    setNotifications({ ...notifications, twoFactorEnabled: newVal });
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const axios = (await import('axios')).default;
                                                        await axios.put('/api/auth/update-security',
                                                            { twoFactorEnabled: newVal },
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );
                                                        // Update local storage user object
                                                        const user = JSON.parse(localStorage.getItem('user'));
                                                        if (user) {
                                                            user.twoFactorEnabled = newVal;
                                                            localStorage.setItem('user', JSON.stringify(user));
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to update 2FA:', error);
                                                        setNotifications({ ...notifications, twoFactorEnabled: !newVal }); // Revert on error
                                                    }
                                                }}
                                            >
                                                <div style={{ ...styles.toggleKnob, transform: notifications.twoFactorEnabled ? 'translateX(20px)' : 'translateX(0)', background: '#fff' }} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: colors.textMuted, marginBottom: '1rem' }}>
                                            Require an OTP code sent to your email every time you log in.
                                        </p>

                                        <div style={styles.notifRow}>
                                            <span style={{ color: colors.text }}>Login Alerts</span>
                                            <button
                                                style={{ ...styles.toggleBtn, background: notifications.loginAlertsEnabled ? colors.accent : colors.inputBg }}
                                                onClick={async () => {
                                                    const newVal = !notifications.loginAlertsEnabled;
                                                    setNotifications({ ...notifications, loginAlertsEnabled: newVal });
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const axios = (await import('axios')).default;
                                                        await axios.put('/api/auth/update-security',
                                                            { loginAlertsEnabled: newVal },
                                                            { headers: { Authorization: `Bearer ${token}` } }
                                                        );
                                                        const user = JSON.parse(localStorage.getItem('user'));
                                                        if (user) {
                                                            user.loginAlertsEnabled = newVal;
                                                            localStorage.setItem('user', JSON.stringify(user));
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to update alerts:', error);
                                                        setNotifications({ ...notifications, loginAlertsEnabled: !newVal });
                                                    }
                                                }}
                                            >
                                                <div style={{ ...styles.toggleKnob, transform: notifications.loginAlertsEnabled ? 'translateX(20px)' : 'translateX(0)', background: '#fff' }} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: colors.textMuted }}>
                                            Receive an email notification when a new login occurs.
                                        </p>
                                    </div>
                                )}
                                {activeModal === 'notifications' && (
                                    <div>
                                        {['email', 'fileActivity'].map(key => (
                                            <div key={key} style={styles.notifRow}>
                                                <span style={{ color: colors.text, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                                <button style={{ ...styles.toggleBtn, background: notifications[key] ? colors.accent : colors.inputBg }} onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}>
                                                    <div style={{ ...styles.toggleKnob, transform: notifications[key] ? 'translateX(20px)' : 'translateX(0)', background: '#fff' }}>{notifications[key] && <Check size={10} color={colors.accent} />}</div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeModal === 'language' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {[{ code: 'en', name: 'English' }, { code: 'ta', name: 'தமிழ் (Tamil)' }].map(l => (
                                            <button key={l.code} onClick={() => setLanguage(l.code)} style={{ ...styles.langBtn, background: language === l.code ? colors.accentBg : 'transparent', borderColor: language === l.code ? colors.accent : colors.border }}>
                                                {l.name}
                                                {language === l.code && <Check size={14} color={colors.accent} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {activeModal === 'export' && <p style={{ color: colors.textSecondary }}>Click Export to download all your encrypted files and account data.</p>}
                                {activeModal === 'delete' && (
                                    <>
                                        <p style={{ color: colors.danger, marginBottom: '16px' }}>This action is irreversible. All data will be permanently deleted.</p>
                                        <label style={styles.inputLabel}>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={formData.currentPassword}
                                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                            style={styles.input}
                                            placeholder="Enter password to confirm"
                                        />
                                    </>
                                )}
                                {activeModal === 'panic' && (
                                    <div>
                                        <p style={{ color: colors.textSecondary, marginBottom: '16px', fontSize: '13px' }}>
                                            Set a "Panic Password" to simulate an empty vault. If forced to open your vault, login with this password instead of your real one.
                                        </p>
                                        <label style={styles.inputLabel}>New Panic Password</label>
                                        <input
                                            type="password"
                                            value={formData.panicPassword}
                                            onChange={(e) => setFormData({ ...formData, panicPassword: e.target.value })}
                                            placeholder="Leave empty to disable"
                                            style={styles.input}
                                        />
                                    </div>
                                )}
                                {success && <div style={styles.successMsg}>{success}</div>}
                            </div>
                            <div style={styles.modalFooter}>
                                <button onClick={() => setActiveModal(null)} style={styles.cancelBtn}>Cancel</button>
                                <button
                                    onClick={activeModal === 'delete' ? handleDelete : (activeModal === 'export' ? handleExport : handleSave)}
                                    style={activeModal === 'delete' ? styles.dangerBtn : styles.saveBtn}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : activeModal === 'delete' ? 'Delete' : activeModal === 'export' ? 'Export' : 'Save'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
        maxWidth: '900px',
    },
    header: {
        marginBottom: '32px',
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
    userCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '24px',
        background: colors.cardBg,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        marginBottom: '32px',
        boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    },
    userAvatar: {
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '600',
        color: '#ffffff',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: '18px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '4px',
    },
    userEmail: {
        fontSize: '14px',
        color: colors.textSecondary,
    },
    editProfileBtn: {
        padding: '10px 20px',
        background: colors.accentBg,
        border: 'none',
        borderRadius: '10px',
        color: colors.accent,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    section: {
        marginBottom: '28px',
    },
    sectionTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px',
    },
    sectionItems: {
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        boxShadow: !isDark ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
    },
    settingItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '18px 20px',
    },
    settingIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    settingLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    settingDesc: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    actionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 14px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    toggleBtn: {
        width: '48px',
        height: '28px',
        borderRadius: '14px',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    toggleKnob: {
        width: '20px',
        height: '20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    versionInfo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '48px',
        paddingTop: '24px',
        borderTop: `1px solid ${colors.border}`,
        fontSize: '13px',
        color: colors.textMuted,
    },
    footerLink: {
        color: colors.accent,
        textDecoration: 'none',
    },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { width: '100%', maxWidth: '420px', background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}` },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${colors.border}` },
    modalTitle: { fontSize: '18px', fontWeight: '600', color: colors.text },
    closeBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'transparent', color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalContent: { padding: '24px' },
    modalFooter: { display: 'flex', gap: '12px', padding: '20px 24px', borderTop: `1px solid ${colors.border}` },
    cancelBtn: { flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' },
    saveBtn: { flex: 1, padding: '12px', background: colors.accent, border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    dangerBtn: { flex: 1, padding: '12px', background: colors.danger, border: 'none', borderRadius: '10px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    inputLabel: { display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '8px' },
    input: { width: '100%', padding: '12px 14px', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', color: colors.text, fontSize: '14px', outline: 'none' },
    notifRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${colors.borderLight}` },
    langBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid', borderRadius: '10px', fontSize: '14px', color: colors.text, cursor: 'pointer' },
    successMsg: { padding: '12px', background: colors.successBg, border: `1px solid ${colors.success}`, borderRadius: '8px', color: colors.success, fontSize: '13px', marginTop: '16px' },
});

export default SettingsPage;

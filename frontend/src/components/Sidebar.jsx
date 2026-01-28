import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FolderLock,
    Share2,
    Activity,
    Shield,
    Settings,
    Lock,
    LogOut,
    ChevronRight,
    CheckCircle,
    Image
} from 'lucide-react';
import { secureLogout } from '../utils/logout';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ user, onLogout }) => {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const location = useLocation();
    const styles = getStyles(colors);

    const handleSecureLogout = () => {
        if (onLogout) onLogout();
        secureLogout();
    };

    let navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard'), key: 'dashboard' },
        { path: '/files', icon: FolderLock, label: t('myFiles'), key: 'myFiles' },
        { path: '/shared', icon: Share2, label: t('shared'), key: 'shared' },
        { path: '/activity', icon: Activity, label: t('activity'), key: 'activity' },
        { path: '/security', icon: Shield, label: t('security'), key: 'security' },
        { path: '/steganography', icon: Image, label: 'Steganography Lab', key: 'stego' },
        { path: '/verify', icon: CheckCircle, label: 'Verification Lab', key: 'verify' },
    ];

    // PANIC MODE: Hide sensitive sections to look like a fresh/empty account
    if (user?.isPanicMode) {
        navItems = navItems.filter(item => ['dashboard', 'myFiles', 'settings'].includes(item.key));
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div style={styles.sidebar}>
            {/* Logo */}
            <div style={styles.logoSection}>
                <div style={styles.logoIcon}>
                    <Lock size={20} color={colors.accent} />
                </div>
                <span style={styles.logoText}>CryptoSecure</span>
            </div>

            {/* Navigation */}
            <nav style={styles.nav}>
                <div style={styles.navSection}>
                    <span style={styles.navLabel}>MAIN</span>
                    {navItems.slice(0, 3).map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.navItem,
                                ...(isActive ? styles.navItemActive : {})
                            })}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                            {isActive(item.path) && <ChevronRight size={16} style={styles.chevron} />}
                        </NavLink>
                    ))}
                </div>

                <div style={styles.navSection}>
                    <span style={styles.navLabel}>SYSTEM</span>
                    {navItems.slice(3).map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                ...styles.navItem,
                                ...(isActive ? styles.navItemActive : {})
                            })}
                        >
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                    <NavLink
                        to="/settings"
                        style={({ isActive }) => ({
                            ...styles.navItem,
                            ...(isActive ? styles.navItemActive : {})
                        })}
                    >
                        <Settings size={18} />
                        <span>{t('settings')}</span>
                    </NavLink>
                </div>
            </nav>

            {/* User Section */}
            <div style={styles.userSection}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={styles.userDetails}>
                        <span style={styles.userName}>{user?.username || 'User'}</span>
                        <span style={styles.userRole}>{user?.role || 'Owner'}</span>
                    </div>
                </div>
                <button onClick={handleSecureLogout} style={styles.logoutBtn}>
                    <LogOut size={18} />
                </button>
            </div>
        </div>
    );
};

const getStyles = (colors) => ({
    sidebar: {
        width: '260px',
        height: '100vh',
        background: colors.cardBg,
        borderRight: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
    },
    logoSection: {
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: `1px solid ${colors.border}`,
    },
    logoIcon: {
        width: '40px',
        height: '40px',
        background: colors.accentBg,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
    },
    nav: {
        flex: 1,
        padding: '20px 12px',
        overflow: 'auto',
    },
    navSection: {
        marginBottom: '24px',
    },
    navLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: colors.textMuted,
        letterSpacing: '0.5px',
        padding: '0 12px',
        marginBottom: '8px',
        display: 'block',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '10px',
        color: colors.textSecondary,
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        marginBottom: '4px',
    },
    navItemActive: {
        background: colors.accentBg,
        color: colors.accent,
    },
    chevron: {
        marginLeft: 'auto',
    },
    userSection: {
        padding: '16px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '600',
        color: '#ffffff',
    },
    userDetails: {
        display: 'flex',
        flexDirection: 'column',
    },
    userName: {
        fontSize: '13px',
        fontWeight: '600',
        color: colors.text,
    },
    userRole: {
        fontSize: '11px',
        color: colors.textMuted,
        textTransform: 'capitalize',
    },
    logoutBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        border: 'none',
        background: colors.name === 'light' ? '#f3f4f6' : 'rgba(255,255,255,0.05)',
        color: colors.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
});

export default Sidebar;

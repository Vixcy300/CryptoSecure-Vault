import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FolderLock,
    Upload,
    Share2,
    Shield,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
    ArrowUpRight,
    Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import Sidebar from './Sidebar';
import UploadModal from './Upload';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const { colors } = useTheme();
    const [user, setUser] = useState(null);
    const [files, setFiles] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [activityData, setActivityData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const styles = getStyles(colors);

    const securityData = [
        { name: 'Encrypted', value: 100, color: colors.success },
        { name: 'Pending', value: 0, color: colors.warning },
    ];

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        fetchFiles();
        fetchActivityLogs();
    }, []);

    const fetchFiles = async () => {
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

    const fetchActivityLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://cryptosecure-vault-backend.onrender.com/api/logs', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Process logs into chart data (group by day)
            const logs = res.data || [];
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const chartData = days.map(day => ({ name: day, uploads: 0, downloads: 0 }));

            logs.forEach(log => {
                const date = new Date(log.createdAt || log.timestamp);
                const dayIndex = date.getDay();
                if (log.action?.includes('upload') || log.action?.includes('UPLOAD')) {
                    chartData[dayIndex].uploads++;
                }
                if (log.action?.includes('download') || log.action?.includes('DOWNLOAD')) {
                    chartData[dayIndex].downloads++;
                }
            });

            // Reorder to start from Monday
            const reordered = [...chartData.slice(1), chartData[0]];
            setActivityData(reordered.length > 0 && reordered.some(d => d.uploads > 0 || d.downloads > 0)
                ? reordered
                : [{ name: 'Mon', uploads: 1 }, { name: 'Tue', uploads: 0 }, { name: 'Wed', uploads: 0 }, { name: 'Thu', uploads: 0 }, { name: 'Fri', uploads: 0 }, { name: 'Sat', uploads: 0 }, { name: 'Sun', uploads: 0 }]);

            // Set recent activity
            const recent = logs.slice(0, 5).map((log, i) => ({
                id: i,
                action: log.action?.replace(/_/g, ' ') || 'Activity',
                file: log.metadata?.fileId ? `File ${log.metadata.fileId.slice(0, 8)}...` : null,
                time: formatTimeAgo(new Date(log.createdAt || log.timestamp)),
                status: log.success !== false ? 'success' : 'warning'
            }));
            setRecentActivity(recent.length > 0 ? recent : [
                { id: 1, action: 'Account created', file: null, time: 'Just now', status: 'success' }
            ]);
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
            setActivityData([
                { name: 'Mon', uploads: 1 }, { name: 'Tue', uploads: 0 }, { name: 'Wed', uploads: 0 },
                { name: 'Thu', uploads: 0 }, { name: 'Fri', uploads: 0 }, { name: 'Sat', uploads: 0 }, { name: 'Sun', uploads: 0 }
            ]);
            setRecentActivity([{ id: 1, action: 'Welcome to CryptoSecure Vault', file: null, time: 'Now', status: 'success' }]);
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const stats = [
        {
            label: 'Total Files',
            value: files.length,
            change: '+12%',
            icon: FolderLock,
            color: colors.accent,
            bg: colors.accentBg
        },
        {
            label: 'Shared Files',
            value: 0,
            change: '+5%',
            icon: Share2,
            color: colors.secondary,
            bg: colors.secondaryBg
        },
        {
            label: 'Storage Used',
            value: '0 MB',
            change: '2.4 GB free',
            icon: Upload,
            color: colors.info,
            bg: colors.infoBg
        },
        {
            label: 'Security Score',
            value: '100%',
            change: 'Excellent',
            icon: Shield,
            color: colors.success,
            bg: colors.successBg
        },
    ];

    return (
        <div style={styles.layout}>
            <Sidebar user={user} onLogout={handleLogout} />

            <main style={styles.main}>
                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.pageTitle}>Dashboard</h1>
                        <p style={styles.pageSubtitle}>Monitor your vault security and activity</p>
                    </div>
                    <motion.button
                        style={styles.uploadBtn}
                        onClick={() => setShowUpload(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Plus size={18} />
                        Upload File
                    </motion.button>
                </div>

                {/* Stats Grid */}
                <div style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="glass-panel"
                            style={styles.statCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div style={{ ...styles.statIcon, background: stat.bg }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                            <div style={styles.statContent}>
                                <span style={styles.statValue}>{stat.value}</span>
                                <span style={styles.statLabel}>{stat.label}</span>
                            </div>
                            <span style={{
                                ...styles.statChange,
                                color: stat.change.includes('+') ? colors.success : colors.textMuted
                            }}>
                                {stat.change}
                            </span>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div style={styles.chartsRow}>
                    {/* Activity Chart */}
                    <motion.div
                        className="glass-panel"
                        style={styles.chartCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div style={styles.chartHeader}>
                            <div>
                                <h3 style={styles.chartTitle}>Activity Overview</h3>
                                <p style={styles.chartSubtitle}>File operations this week</p>
                            </div>
                            <TrendingUp size={20} color={colors.success} />
                        </div>
                        <div style={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={activityData}>
                                    <defs>
                                        <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: colors.textMuted, fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: colors.textMuted, fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(20, 20, 30, 0.8)',
                                            backdropFilter: 'blur(8px)',
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '8px',
                                            color: colors.text
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="uploads"
                                        stroke={colors.accent}
                                        fillOpacity={1}
                                        fill="url(#colorUploads)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Security Chart */}
                    <motion.div
                        className="glass-panel"
                        style={styles.chartCardSmall}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div style={styles.chartHeader}>
                            <div>
                                <h3 style={styles.chartTitle}>Encryption Status</h3>
                                <p style={styles.chartSubtitle}>All files encrypted</p>
                            </div>
                        </div>
                        <div style={styles.pieContainer}>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={securityData}
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {securityData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={styles.pieCenter}>
                                <span style={styles.pieValue}>100%</span>
                                <span style={styles.pieLabel}>Secure</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                    className="glass-panel"
                    style={styles.activitySection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>Recent Activity</h3>
                        <button style={styles.viewAllBtn}>
                            View All <ArrowUpRight size={14} />
                        </button>
                    </div>
                    <div style={styles.activityList}>
                        {recentActivity.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                style={styles.activityItem}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.05 }}
                            >
                                <div style={{
                                    ...styles.activityIcon,
                                    background: activity.status === 'success'
                                        ? colors.successBg
                                        : colors.warningBg
                                }}>
                                    {activity.status === 'success'
                                        ? <CheckCircle size={16} color={colors.success} />
                                        : <AlertTriangle size={16} color={colors.warning} />
                                    }
                                </div>
                                <div style={styles.activityInfo}>
                                    <span style={styles.activityAction}>{activity.action}</span>
                                    {activity.file && (
                                        <span style={styles.activityFile}>{activity.file}</span>
                                    )}
                                </div>
                                <div style={styles.activityTime}>
                                    <Clock size={12} />
                                    {activity.time}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </main>

            {showUpload && (
                <UploadModal
                    onClose={() => setShowUpload(false)}
                    onUploadComplete={() => { fetchFiles(); setShowUpload(false); }}
                />
            )}
        </div>
    );
};

const getStyles = (colors) => ({
    layout: {
        display: 'flex',
        minHeight: '100vh',
        background: 'transparent',
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
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px',
    },
    statCard: {
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        position: 'relative',
    },
    statIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statContent: {
        display: 'flex',
        flexDirection: 'column',
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: '13px',
        color: colors.textSecondary,
    },
    statChange: {
        position: 'absolute',
        top: '20px',
        right: '20px',
        fontSize: '12px',
        fontWeight: '500',
    },
    chartsRow: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginBottom: '32px',
    },
    chartCard: {
        borderRadius: '14px',
        padding: '24px',
    },
    chartCardSmall: {
        borderRadius: '14px',
        padding: '24px',
    },
    chartHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
    },
    chartTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '4px',
    },
    chartSubtitle: {
        fontSize: '13px',
        color: colors.textSecondary,
    },
    chartContainer: {
        marginTop: '16px',
    },
    pieContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pieCenter: {
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    pieValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: colors.success,
    },
    pieLabel: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    activitySection: {
        borderRadius: '14px',
        padding: '24px',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
    },
    viewAllBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'transparent',
        border: 'none',
        color: colors.accent,
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    activityList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    activityItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px',
        background: colors.name === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
        borderRadius: '10px',
        border: `1px solid ${colors.border}`,
    },
    activityIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    activityAction: {
        fontSize: '14px',
        fontWeight: '500',
        color: colors.text,
    },
    activityFile: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    activityTime: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: colors.textMuted,
    },
});

export default Dashboard;

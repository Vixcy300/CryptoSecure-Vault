import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Mail, Lock, Eye, Database, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const PrivacyPage = () => {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);

    const sections = [
        {
            icon: Lock,
            title: 'Zero-Knowledge Architecture',
            content: `CryptoSecure Vault is built on a zero-knowledge architecture. This means we literally cannot access your data. All encryption and decryption happens locally on your device before any data touches our servers. Your encryption keys never leave your device.`
        },
        {
            icon: Database,
            title: 'Data We Collect',
            content: `We collect minimal data necessary to operate the service: (a) Account information: email address and username; (b) Encrypted file metadata: file sizes, upload times, and encrypted filenames; (c) Audit logs: action types, timestamps, and IP addresses for security; (d) Usage analytics: anonymized, aggregated usage patterns.`
        },
        {
            icon: Eye,
            title: 'Data We Cannot Access',
            content: `Due to our zero-knowledge design, we cannot access: (a) Your file contents - they are encrypted before upload; (b) Original file names - they are encrypted with your keys; (c) Your encryption keys - they exist only on your devices; (d) Shared file contents - re-encrypted for each recipient.`
        },
        {
            icon: Shield,
            title: 'How We Protect Your Data',
            content: `Security measures include: AES-256-GCM encryption for all files; Argon2id password hashing; TLS 1.3 for data in transit; SOC 2 Type II certified infrastructure; Regular third-party security audits; Immutable blockchain audit logs; Geographic data redundancy.`
        },
        {
            icon: Globe,
            title: 'Data Sharing & Third Parties',
            content: `We do not sell your data. We may share data with: (a) Infrastructure providers (encrypted data only); (b) Law enforcement when legally required (we can only provide encrypted data and metadata); (c) Service providers bound by confidentiality agreements. You control file sharing - we facilitate but cannot access shared content.`
        },
        {
            icon: Lock,
            title: 'Your Rights',
            content: `You have the right to: (a) Access your data at any time; (b) Export your data in standard formats; (c) Delete your data permanently; (d) Close your account; (e) Opt out of analytics; (f) Request information about data we hold. For GDPR/CCPA subjects, additional rights apply as specified by applicable law.`
        }
    ];

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <Link to="/login" style={styles.backLink}>
                    <ArrowLeft size={18} />
                    Back to Login
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={styles.header}>
                        <div style={styles.iconBox}>
                            <Shield size={28} color={colors.success} />
                        </div>
                        <h1 style={styles.title}>Privacy Policy</h1>
                        <p style={styles.subtitle}>Your privacy is protected by design, not just by policy</p>
                    </div>

                    <div style={styles.highlight}>
                        <Lock size={20} color={colors.success} />
                        <div>
                            <strong style={styles.highlightTitle}>Zero-Knowledge Guarantee</strong>
                            <p style={styles.highlightText}>We cannot read your files. Ever. Your data is encrypted before it leaves your device.</p>
                        </div>
                    </div>

                    <div style={styles.sections}>
                        {sections.map((section, index) => (
                            <motion.div
                                key={section.title}
                                style={styles.section}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div style={styles.sectionIcon}>
                                    <section.icon size={20} color={colors.accent} />
                                </div>
                                <div>
                                    <h2 style={styles.sectionTitle}>{section.title}</h2>
                                    <p style={styles.sectionContent}>{section.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={styles.contact}>
                        <Mail size={16} color={colors.accent} />
                        <span>Privacy inquiries: privacy@cryptosecure.io</span>
                    </div>

                    <p style={styles.updated}>Last updated: January 2026</p>
                </motion.div>
            </div>
        </div>
    );
};

const getStyles = (colors, isDark) => ({
    container: {
        minHeight: '100vh',
        background: colors.bg,
        padding: '40px 20px',
    },
    content: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    backLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: colors.textSecondary,
        textDecoration: 'none',
        fontSize: '14px',
        marginBottom: '32px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    iconBox: {
        width: '64px',
        height: '64px',
        background: colors.successBg,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: colors.textSecondary,
    },
    highlight: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '24px',
        background: colors.successBg,
        border: `1px solid ${colors.success}33`,
        borderRadius: '14px',
        marginBottom: '32px',
    },
    highlightTitle: {
        color: colors.success,
        fontSize: '15px',
    },
    highlightText: {
        color: colors.textSecondary,
        fontSize: '14px',
        marginTop: '4px',
    },
    sections: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    section: {
        display: 'flex',
        gap: '16px',
        padding: '24px',
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
    },
    sectionIcon: {
        width: '44px',
        height: '44px',
        background: colors.accentBg,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '8px',
    },
    sectionContent: {
        fontSize: '14px',
        lineHeight: '1.7',
        color: colors.textSecondary,
    },
    contact: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '48px',
        padding: '20px',
        background: colors.accentBg,
        borderRadius: '12px',
        fontSize: '14px',
        color: colors.textSecondary,
    },
    updated: {
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '13px',
        color: colors.textMuted,
    },
});

export default PrivacyPage;

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TermsPage = () => {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);

    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: `By accessing or using CryptoSecure Vault ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any modifications.`
        },
        {
            title: '2. Service Description',
            content: `CryptoSecure Vault provides end-to-end encrypted file storage with zero-knowledge architecture. All encryption and decryption occurs on your device. We cannot access, read, or decrypt your files. You are solely responsible for maintaining your encryption keys and passwords.`
        },
        {
            title: '3. User Responsibilities',
            content: `You agree to: (a) maintain the security of your account credentials and encryption keys; (b) not use the Service for any illegal purposes; (c) not upload malicious content; (d) not attempt to breach or compromise the security of the Service; (e) maintain backups of your encryption keys as we cannot recover lost keys.`
        },
        {
            title: '4. Zero-Knowledge Architecture',
            content: `Our zero-knowledge architecture means we have no ability to access your encrypted data. This provides maximum privacy but also means: (a) we cannot recover your data if you lose your keys; (b) we cannot comply with requests to decrypt your data; (c) you bear full responsibility for key management.`
        },
        {
            title: '5. Data Retention & Deletion',
            content: `Your encrypted data is stored until you delete it. When you delete files, they are permanently removed from our servers. Deleted data cannot be recovered. Audit logs are retained for security purposes and may be subject to legal requirements.`
        },
        {
            title: '6. Limitation of Liability',
            content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR: data loss due to user error or key loss; unauthorized access due to compromised credentials; any damages arising from use of the Service. Our total liability is limited to the fees paid in the 12 months preceding any claim.`
        },
        {
            title: '7. Termination',
            content: `We may terminate your access for violation of these terms. Upon termination, your encrypted data will be deleted after 30 days. You may export your data before termination. We are not obligated to maintain your data after account closure.`
        },
        {
            title: '8. Governing Law',
            content: `These terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration. Class action claims are waived. You agree to jurisdiction in our principal place of business.`
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
                            <FileText size={28} color={colors.accent} />
                        </div>
                        <h1 style={styles.title}>Terms of Service</h1>
                        <p style={styles.subtitle}>Last updated: January 2026</p>
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
                                <h2 style={styles.sectionTitle}>{section.title}</h2>
                                <p style={styles.sectionContent}>{section.content}</p>
                            </motion.div>
                        ))}
                    </div>

                    <div style={styles.contact}>
                        <Mail size={16} color={colors.accent} />
                        <span>Questions? Contact legal@cryptosecure.io</span>
                    </div>
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
        marginBottom: '48px',
    },
    iconBox: {
        width: '64px',
        height: '64px',
        background: colors.accentBg,
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
    sections: {
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
    },
    section: {
        padding: '24px',
        background: colors.cardBg,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '12px',
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
});

export default TermsPage;

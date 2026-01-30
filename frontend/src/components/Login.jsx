import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Eye, EyeOff, Shield, Key, Database, ArrowLeft, RefreshCw, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
    const { colors, isDark, toggleTheme } = useTheme();
    const styles = getStyles(colors, isDark);

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [panicPassword, setPanicPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [pendingData, setPendingData] = useState(null);
    const [resendTimer, setResendTimer] = useState(0);
    const otpRefs = useRef([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const response = await axios.post('/api/auth/login', { email, password });

                if (response.data.requiresOTP) {
                    setStep('otp');
                    setResendTimer(60);
                    setSuccess('OTP sent to your email');
                } else {
                    // Direct login (within 24 hours)
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    navigate('/dashboard');
                }
            } else {
                const response = await axios.post('/api/auth/register', {
                    username, email, password, panicPassword
                });

                if (response.data.requiresOTP) {
                    setPendingData(response.data.pendingData);
                    setStep('otp');
                    setResendTimer(60);
                    setSuccess('OTP sent to your email');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[0];
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
            setOtp(newOtp);
            otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
        }
    };

    const verifyOTP = async () => {
        setLoading(true);
        setError('');

        try {
            const otpCode = otp.join('');
            if (otpCode.length !== 6) {
                setError('Please enter full OTP');
                setLoading(false);
                return;
            }

            if (isLogin) {
                const response = await axios.post('/api/auth/login/verify', {
                    email,
                    otp: otpCode
                });
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            } else {
                await axios.post('/api/auth/register/verify', {
                    email,
                    otp: otpCode,
                    pendingData
                });
                setSuccess('Account created successfully! Please sign in.');
                setStep('credentials');
                setIsLogin(true);
                setOtp(['', '', '', '', '', '']);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed');
            setOtp(['', '', '', '', '', '']);
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        try {
            await axios.post('/api/auth/resend-otp', {
                email,
                purpose: isLogin ? 'login' : 'register'
            });
            setResendTimer(60);
            setSuccess('OTP resent successfully');
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            setError('Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Shield, title: 'Zero-Knowledge', desc: 'Server never sees your data' },
        { icon: Key, title: 'AES-256 + ECC', desc: 'Military-grade encryption' },
        { icon: Database, title: 'Blockchain Audit', desc: 'Immutable activity logs' },
    ];

    return (
        <div style={styles.container}>
            {/* Theme Toggle Floating */}
            <button onClick={toggleTheme} style={styles.themeToggle}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Left Side - Branding */}
            <div style={styles.leftPanel}>
                <div style={styles.brandSection}>
                    <div style={styles.logoContainer}>
                        <Lock size={32} color={colors.accent} />
                    </div>
                    <h1 style={styles.brandTitle}>CryptoSecure Vault</h1>
                    <p style={styles.brandSubtitle}>Enterprise-grade encrypted file storage with zero-knowledge architecture</p>
                </div>

                <div style={styles.featuresSection}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            style={styles.featureItem}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <div style={styles.featureIcon}>
                                <feature.icon size={20} color={colors.accent} />
                            </div>
                            <div>
                                <div style={styles.featureTitle}>{feature.title}</div>
                                <div style={styles.featureDesc}>{feature.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div style={styles.compliance}>
                    <span style={styles.complianceBadge}>SOC 2</span>
                    <span style={styles.complianceBadge}>GDPR</span>
                    <span style={styles.complianceBadge}>HIPAA</span>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={styles.rightPanel}>
                <AnimatePresence mode="wait">
                    {step === 'credentials' ? (
                        <motion.div
                            key="credentials"
                            className="glass-panel"
                            style={styles.formCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={styles.formHeader}>
                                <h2 style={styles.formTitle}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
                                <p style={styles.formSubtitle}>
                                    {isLogin ? 'Enter your credentials to access your vault' : 'Start securing your files today'}
                                </p>
                            </div>

                            {/* Toggle */}
                            <div style={styles.toggleContainer}>
                                <button
                                    style={{ ...styles.toggleBtn, ...(isLogin ? styles.toggleActive : {}) }}
                                    onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                                >
                                    Sign In
                                </button>
                                <button
                                    style={{ ...styles.toggleBtn, ...(!isLogin ? styles.toggleActive : {}) }}
                                    onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                                >
                                    Register
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={styles.form}>
                                {!isLogin && (
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Username</label>
                                        <div style={styles.inputWrapper}>
                                            <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                                            <input
                                                type="text"
                                                placeholder="Enter username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                style={styles.input}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Email</label>
                                    <div style={styles.inputWrapper}>
                                        <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                                        <input
                                            type="email"
                                            placeholder="Enter email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={styles.input}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Password</label>
                                    <div style={styles.inputWrapper}>
                                        <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={styles.input}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={styles.eyeBtn}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                {!isLogin && (
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Panic Password (Optional)</label>
                                        <div style={styles.inputWrapper}>
                                            <Shield size={18} color={colors.textMuted} style={styles.inputIcon} />
                                            <input
                                                type="password"
                                                placeholder="Duress password (hides all files)"
                                                value={panicPassword}
                                                onChange={(e) => setPanicPassword(e.target.value)}
                                                style={styles.input}
                                            />
                                        </div>
                                        <p style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                                            Login with this password to simulate an empty vault.
                                        </p>
                                    </div>
                                )}

                                {error && <div style={styles.errorMsg}>{error}</div>}
                                {success && <div style={styles.successMsg}>{success}</div>}

                                <button type="submit" style={styles.submitBtn} disabled={loading}>
                                    {loading ? (
                                        <div style={styles.spinner} />
                                    ) : (
                                        isLogin ? 'Sign In to Vault' : 'Create Secure Account'
                                    )}
                                </button>
                            </form>

                            <p style={styles.footer}>
                                By continuing, you agree to our{' '}
                                <Link to="/terms" style={styles.footerLink}>Terms of Service</Link>
                                {' '}and{' '}
                                <Link to="/privacy" style={styles.footerLink}>Privacy Policy</Link>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp"
                            className="glass-panel"
                            style={styles.formCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <button
                                style={styles.backBtn}
                                onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); setError(''); }}
                            >
                                <ArrowLeft size={18} />
                                Back
                            </button>

                            <div style={styles.otpHeader}>
                                <div style={styles.otpIcon}>
                                    <Mail size={32} color={colors.accent} />
                                </div>
                                <h2 style={styles.formTitle}>Check your email</h2>
                                <p style={styles.formSubtitle}>
                                    We've sent a 6-digit code to<br />
                                    <strong style={{ color: colors.text }}>{email}</strong>
                                </p>
                            </div>

                            <div style={styles.otpContainer}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => otpRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        style={styles.otpInput}
                                    />
                                ))}
                            </div>

                            {error && <div style={styles.errorMsg}>{error}</div>}
                            {success && <div style={styles.successMsg}>{success}</div>}

                            <button
                                style={styles.submitBtn}
                                onClick={verifyOTP}
                                disabled={loading || otp.join('').length !== 6}
                            >
                                {loading ? <div style={styles.spinner} /> : 'Verify OTP'}
                            </button>

                            <div style={styles.resendSection}>
                                <span style={styles.resendText}>Didn't receive the code?</span>
                                <button
                                    style={{
                                        ...styles.resendBtn,
                                        opacity: resendTimer > 0 ? 0.5 : 1,
                                        cursor: resendTimer > 0 ? 'default' : 'pointer'
                                    }}
                                    onClick={resendOTP}
                                    disabled={resendTimer > 0}
                                >
                                    <RefreshCw size={14} />
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const getStyles = (colors, isDark) => ({
    container: {
        display: 'flex',
        minHeight: '100vh',
        background: 'transparent', // Allow LiveBackground to show
        position: 'relative',
    },
    themeToggle: {
        position: 'absolute',
        top: '24px',
        right: '24px',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        color: colors.text,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    leftPanel: {
        flex: 1,
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${colors.border}`,
        position: 'relative',
        zIndex: 2,
    },
    // ...
    rightPanel: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'transparent',
        position: 'relative',
        zIndex: 2,
    },
    brandSection: {
        marginBottom: '48px',
    },
    logoContainer: {
        width: '56px',
        height: '56px',
        background: colors.accentBg,
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px',
        border: `1px solid ${colors.accent}33`,
    },
    brandTitle: {
        fontSize: '32px',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '12px',
        letterSpacing: '-0.5px',
    },
    brandSubtitle: {
        fontSize: '16px',
        color: colors.textSecondary,
        lineHeight: '1.6',
        maxWidth: '360px',
    },
    featuresSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '48px',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    featureIcon: {
        width: '44px',
        height: '44px',
        background: colors.accentBg,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '2px',
    },
    featureDesc: {
        fontSize: '13px',
        color: colors.textMuted,
    },
    compliance: {
        display: 'flex',
        gap: '10px',
    },
    complianceBadge: {
        padding: '6px 12px',
        background: colors.cardBg,
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'transparent',
    },
    formCard: {
        width: '100%',
        maxWidth: '420px',
    },
    backBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'transparent',
        border: 'none',
        color: colors.textSecondary,
        fontSize: '14px',
        cursor: 'pointer',
        marginBottom: '24px',
        padding: 0,
    },
    formHeader: {
        marginBottom: '32px',
    },
    formTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '8px',
    },
    formSubtitle: {
        fontSize: '14px',
        color: colors.textSecondary,
        lineHeight: '1.6',
    },
    toggleContainer: {
        display: 'flex',
        marginBottom: '28px',
        borderBottom: `1px solid ${colors.border}`,
    },
    toggleBtn: {
        flex: 1,
        padding: '12px',
        border: 'none',
        background: 'transparent',
        color: colors.textMuted,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        borderBottom: '2px solid transparent',
        marginBottom: '-1px',
        transition: 'all 0.2s ease',
    },
    toggleActive: {
        color: colors.accent,
        borderBottomColor: colors.accent,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '13px',
        fontWeight: '500',
        color: colors.textSecondary,
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
        pointerEvents: 'none',
    },
    input: {
        width: '100%',
        padding: '14px 14px 14px 44px',
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: colors.text,
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    },
    eyeBtn: {
        position: 'absolute',
        right: '14px',
        background: 'transparent',
        border: 'none',
        color: colors.textMuted,
        cursor: 'pointer',
        padding: '4px',
    },
    errorMsg: {
        padding: '12px',
        background: colors.dangerBg,
        border: `1px solid ${colors.danger}33`,
        borderRadius: '8px',
        color: colors.danger,
        fontSize: '13px',
    },
    successMsg: {
        padding: '12px',
        background: colors.successBg,
        border: `1px solid ${colors.success}33`,
        borderRadius: '8px',
        color: colors.success,
        fontSize: '13px',
    },
    submitBtn: {
        padding: '14px',
        background: colors.accent,
        border: 'none',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '48px',
    },
    spinner: {
        width: '20px',
        height: '20px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    footer: {
        marginTop: '24px',
        fontSize: '12px',
        color: colors.textMuted,
        textAlign: 'center',
    },
    footerLink: {
        color: colors.accent,
        textDecoration: 'none',
    },
    otpHeader: {
        textAlign: 'center',
        marginBottom: '32px',
    },
    otpIcon: {
        width: '64px',
        height: '64px',
        background: colors.accentBg,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
    },
    otpContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '24px',
    },
    otpInput: {
        width: '48px',
        height: '56px',
        background: isDark ? '#1c1c21' : '#ffffff',
        border: `2px solid ${colors.border}`,
        borderRadius: '10px',
        color: colors.text,
        fontSize: '24px',
        fontWeight: '600',
        textAlign: 'center',
        outline: 'none',
        transition: 'border-color 0.2s ease',
    },
    resendSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        marginTop: '24px',
    },
    resendText: {
        fontSize: '13px',
        color: colors.textSecondary,
    },
    resendBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: 'none',
        color: colors.accent,
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
});

export default Login;

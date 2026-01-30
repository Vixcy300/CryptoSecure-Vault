import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image as ImageIcon,
    Lock,
    Unlock,
    Upload,
    Download,
    Eye,
    FileText,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Maximize2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { encodeLSB, decodeLSB, calculateCapacity } from '../utils/stegoUtils';
import BinaryVisualizer from '../components/BinaryVisualizer';

const SteganographyPage = () => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('hide');
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [visualIntensity, setVisualIntensity] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const styles = getStyles(colors, isDark, isMobile);

    return (
        <div style={styles.layout}>
            <Sidebar user={user} />
            <main style={styles.main}>
                <div style={styles.header}>
                    <h1 style={styles.pageTitle}>Steganography Lab <span style={styles.versionBadge}>v3.2</span></h1>
                    <p style={styles.pageSubtitle}>LSB-3 High-Capacity Steganography with Reactive Visualizer.</p>
                </div>

                <div style={styles.gridContainer}>
                    {/* Left Pane: Controls */}
                    <div style={styles.controlPane}>
                        <div style={styles.tabContainer}>
                            <button
                                style={{ ...styles.tab, background: activeTab === 'hide' ? colors.accentBg : 'transparent', color: activeTab === 'hide' ? colors.accent : colors.textSecondary }}
                                onClick={() => setActiveTab('hide')}
                            >
                                <Lock size={16} /> Encrypt & Hide
                            </button>
                            <button
                                style={{ ...styles.tab, background: activeTab === 'extract' ? colors.accentBg : 'transparent', color: activeTab === 'extract' ? colors.accent : colors.textSecondary }}
                                onClick={() => setActiveTab('extract')}
                            >
                                <Unlock size={16} /> Reveal Data
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'hide' ? (
                                <HideDataPanel key="hide" styles={styles} colors={colors} setIntensity={setVisualIntensity} />
                            ) : (
                                <ExtractDataPanel key="extract" styles={styles} colors={colors} setIntensity={setVisualIntensity} />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Pane: Visualization */}
                    <div style={styles.visualPane}>
                        <div style={styles.visualHeader}>
                            <Eye size={16} color={colors.accent} />
                            <span style={{ fontSize: '12px', fontWeight: '600', color: colors.accent, letterSpacing: '1px' }}>BINARY STREAM VISUALIZER</span>
                        </div>
                        <div style={styles.canvasContainer}>
                            {/* Reactive Visualizer */}
                            <BinaryVisualizer
                                active={true}
                                width={380}
                                height={300}
                                color={visualIntensity > 0.5 ? '#fff' : colors.accent}
                                intensity={visualIntensity}
                            />
                        </div>
                        <div style={styles.visualFooter}>
                            <div style={styles.statItem}>
                                <span style={styles.statLabel}>ALGORITHM</span>
                                <span style={styles.statValue}>LSB-3 (TRIPLE)</span>
                            </div>
                            <div style={styles.statItem}>
                                <span style={styles.statLabel}>STATUS</span>
                                <span style={{ ...styles.statValue, color: visualIntensity > 0 ? colors.success : colors.text }}>
                                    {visualIntensity > 0 ? 'PROCESSING...' : 'IDLE'}
                                </span>
                            </div>
                            <div style={styles.statItem}>
                                <span style={styles.statLabel}>CAPACITY</span>
                                <span style={styles.statValue}>HIGH</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const HideDataPanel = ({ styles, colors, setIntensity }) => {
    const [coverImage, setCoverImage] = useState(null);
    const [secretFile, setSecretFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [resultBlob, setResultBlob] = useState(null);
    const [error, setError] = useState('');
    const [capacity, setCapacity] = useState(0);
    const [usagePercent, setUsagePercent] = useState(0);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverImage(file);
        setResultBlob(null);
        setError('');

        // Anti-pattern warning
        if (file.type === 'image/jpeg') {
            // We can allow it but warn heavily
        }

        try {
            const cap = await calculateCapacity(file);
            setCapacity(cap);
            if (secretFile) updateUsage(cap, secretFile.size);
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSecretFile(file);
        if (coverImage) updateUsage(capacity, file.size);
    };

    const updateUsage = (cap, size) => {
        const p = Math.min(100, (size / cap) * 100);
        setUsagePercent(p);
        if (size > cap) setError(`File too large! exceeds image capacity by ${(size - cap).toLocaleString()} bytes.`);
        else setError('');
    };

    const handleProcess = async () => {
        if (!coverImage || !secretFile) return;
        setProcessing(true);
        setError('');

        // Simulating "Matrix" calculation time for effect
        await new Promise(r => setTimeout(r, 1500));

        try {
            const result = await encodeLSB(coverImage, secretFile);
            setResultBlob(result);
        } catch (err) {
            setError(err.message);
        }
        setProcessing(false);
    };

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            {/* Step 1: Cover Image */}
            <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                    <div style={styles.stepIcon}><ImageIcon size={16} /></div>
                    <span style={styles.stepTitle}>Cover Image</span>
                </div>
                <div style={styles.dropZone}>
                    <input type="file" accept="image/*" onChange={handleImageSelect} style={styles.hiddenInput} id="coverUpload" />
                    <label htmlFor="coverUpload" style={styles.dropLabel}>
                        {coverImage ? (
                            <span style={{ color: colors.text }}>{coverImage.name} ({(coverImage.size / 1024).toFixed(0)} KB)</span>
                        ) : (
                            <span>Drag image or click to browse (PNG/JPG)</span>
                        )}
                    </label>
                </div>
                {coverImage && coverImage.type === 'image/jpeg' && (
                    <div style={styles.warningBox}>
                        <AlertTriangle size={14} /> Note: JPGs are noisy. Result will be saved as PNG.
                    </div>
                )}
            </div>

            {/* Step 2: Secret File */}
            <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                    <div style={styles.stepIcon}><FileText size={16} /></div>
                    <span style={styles.stepTitle}>Secret Data</span>
                </div>
                <div style={styles.dropZone}>
                    <input type="file" onChange={handleFileSelect} style={styles.hiddenInput} id="secretUpload" />
                    <label htmlFor="secretUpload" style={styles.dropLabel}>
                        {secretFile ? (
                            <span style={{ color: colors.text }}>{secretFile.name} ({(secretFile.size / 1024).toFixed(1)} KB)</span>
                        ) : (
                            <span>Drag secret file here</span>
                        )}
                    </label>
                </div>
            </div>

            {/* Capacity Gauge */}
            {coverImage && (
                <div style={styles.capacityContainer}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: colors.textSecondary }}>
                        <span>Storage Usage</span>
                        <span>{usagePercent.toFixed(1)}%</span>
                    </div>
                    <div style={styles.progressBarBg}>
                        <div style={{
                            ...styles.progressBarFill,
                            width: `${usagePercent}%`,
                            background: usagePercent > 100 ? colors.danger : colors.accent
                        }} />
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                        Capacity: {(capacity / 1024).toFixed(1)} KB | Payload: {secretFile ? (secretFile.size / 1024).toFixed(1) : 0} KB
                    </div>
                </div>
            )}

            {error && <div style={styles.errorMsg}><AlertTriangle size={16} /> {error}</div>}

            <button
                onClick={handleProcess}
                style={{ ...styles.btnPrimary, width: '100%', marginTop: '20px' }}
                disabled={!coverImage || !secretFile || processing || usagePercent > 100}
            >
                {processing ? <RefreshCw size={18} className="spin" /> : <Lock size={18} />}
                {processing ? ' ENCODING PIXELS...' : ' ENCRYPT & EMBED'}
            </button>

            {resultBlob && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={styles.successCard}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ShieldCheck size={24} color={colors.success} />
                        <div>
                            <h4 style={{ margin: 0, color: colors.text }}>Stegano-Image Ready</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>Data hidden successfully.</p>
                        </div>
                    </div>
                    <button onClick={() => {
                        const url = URL.createObjectURL(resultBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `stego_protected_${Date.now()}.png`;
                        a.click();
                    }} style={styles.btnDownload}>
                        <Download size={16} /> Download
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

const ExtractDataPanel = ({ styles, colors }) => {
    const [stegoImage, setStegoImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [extractedBlob, setExtractedBlob] = useState(null);
    const [error, setError] = useState('');

    const handleExtract = async () => {
        if (!stegoImage) return;
        setProcessing(true);
        setError('');
        setExtractedBlob(null);

        await new Promise(r => setTimeout(r, 1500)); // Matrix effect

        try {
            const result = await decodeLSB(stegoImage);
            setExtractedBlob(result);
        } catch (err) {
            setError(err.message);
        }
        setProcessing(false);
    };

    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                    <div style={styles.stepIcon}><ImageIcon size={16} /></div>
                    <span style={styles.stepTitle}>Source Image</span>
                </div>
                <div style={styles.dropZone}>
                    <input type="file" accept="image/png" onChange={(e) => setStegoImage(e.target.files[0])} style={styles.hiddenInput} id="stegoUpload" />
                    <label htmlFor="stegoUpload" style={styles.dropLabel}>
                        {stegoImage ? (
                            <span style={{ color: colors.text }}>{stegoImage.name}</span>
                        ) : (
                            <span>Upload Stego-Image (PNG)</span>
                        )}
                    </label>
                </div>
            </div>

            {error && <div style={styles.errorMsg}><AlertTriangle size={16} /> {error}</div>}

            <button
                onClick={handleExtract}
                style={{ ...styles.btnPrimary, width: '100%', marginTop: '20px' }}
                disabled={!stegoImage || processing}
            >
                {processing ? <RefreshCw size={18} className="spin" /> : <Unlock size={18} />}
                {processing ? ' DECODING STREAM...' : ' EXTRACT HIDDEN DATA'}
            </button>

            {extractedBlob && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={styles.successCard}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <FileText size={24} color={colors.accent} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, color: colors.text }}>File Recovered</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>{extractedBlob.name}</p>
                        </div>
                    </div>
                    <button onClick={() => {
                        const url = URL.createObjectURL(extractedBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = extractedBlob.name;
                        a.click();
                    }} style={styles.btnDownload}>
                        <Download size={16} /> Save File
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

const getStyles = (colors, isDark, isMobile) => ({
    layout: {
        display: 'flex',
        minHeight: '100vh',
        background: colors.bg,
    },
    main: {
        flex: 1,
        marginLeft: isMobile ? 0 : '260px',
        padding: isMobile ? '76px 16px 24px 16px' : '32px 40px',
    },
    header: { marginBottom: '24px' },
    pageTitle: { fontSize: isMobile ? '20px' : '28px', fontWeight: '700', color: colors.text, marginBottom: '4px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' },
    versionBadge: { fontSize: '12px', background: colors.accentBg, color: colors.accent, padding: '2px 8px', borderRadius: '12px' },
    pageSubtitle: { fontSize: isMobile ? '12px' : '14px', color: colors.textSecondary },

    gridContainer: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: isMobile ? '20px' : '32px', alignItems: 'start' },

    controlPane: { background: colors.cardBg, borderRadius: '16px', border: `1px solid ${colors.border}`, padding: '24px', boxShadow: !isDark && '0 4px 12px rgba(0,0,0,0.05)' },
    tabContainer: { display: 'flex', gap: '12px', marginBottom: '24px', background: colors.inputBg, padding: '4px', borderRadius: '12px' },
    tab: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },

    stepBox: { marginBottom: '20px' },
    stepHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
    stepIcon: { width: '24px', height: '24px', borderRadius: '6px', background: colors.accentBg, color: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    stepTitle: { fontSize: '14px', fontWeight: '600', color: colors.text },

    dropZone: { border: `2px dashed ${colors.border}`, borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: colors.inputBg, transition: 'all 0.2s' },
    hiddenInput: { display: 'none' },
    dropLabel: { cursor: 'pointer', fontSize: '13px', color: colors.textSecondary, width: '100%', display: 'block' },

    warningBox: { marginTop: '8px', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '6px', color: '#b45309', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' },
    errorMsg: { marginTop: '16px', padding: '12px', background: colors.dangerBg, color: colors.danger, borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' },

    capacityContainer: { marginTop: '24px', padding: '16px', background: colors.inputBg, borderRadius: '10px', border: `1px solid ${colors.border}` },
    progressBarBg: { width: '100%', height: '6px', background: colors.border, borderRadius: '3px', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },

    btnPrimary: { background: colors.accent, color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.5px' },

    successCard: { marginTop: '24px', padding: '20px', background: colors.successBg, border: `1px solid ${colors.success}`, borderRadius: '12px' },
    btnDownload: { marginTop: '12px', width: '100%', padding: '10px', background: colors.success, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },

    visualPane: { position: 'sticky', top: '20px' },
    canvasContainer: { background: '#000', borderRadius: '12px', border: `1px solid ${colors.accent}`, overflow: 'hidden', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${colors.accent}20` },
    visualHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
    visualFooter: { display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '16px', background: colors.cardBg, borderRadius: '12px', border: `1px solid ${colors.border}` },
    statItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    statLabel: { fontSize: '10px', color: colors.textMuted, fontWeight: '600' },
    statValue: { fontSize: '12px', color: colors.text, fontFamily: 'monospace' },
});

export default SteganographyPage;

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    dark: {
        name: 'dark',
        bg: '#0f0f12',
        cardBg: '#16161a',
        inputBg: '#1c1c21',
        text: '#ffffff',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        border: 'rgba(255,255,255,0.06)',
        borderLight: 'rgba(255,255,255,0.04)',
        accent: '#3b82f6', // Enterprise Blue (Blue-500)
        accentBg: 'rgba(59, 130, 246, 0.15)', // Blue-500 with opacity
        secondary: '#94a3b8',
        secondaryBg: 'rgba(148, 163, 184, 0.1)',
        success: '#10b981', // Emerald-500
        successBg: 'rgba(16, 185, 129, 0.1)',
        warning: '#f59e0b',
        warningBg: 'rgba(245, 158, 11, 0.1)',
        danger: '#ef4444',
        dangerBg: 'rgba(239, 68, 68, 0.1)',
        info: '#0ea5e9',
        infoBg: 'rgba(14, 165, 233, 0.1)',
    },
    light: {
        name: 'light',
        bg: '#f8fafc',
        cardBg: '#ffffff',
        inputBg: '#f1f5f9',
        text: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        border: 'rgba(0,0,0,0.08)',
        borderLight: 'rgba(0,0,0,0.04)',
        accent: '#2563eb', // Enterprise Blue (Blue-600) for better contrast on light
        accentBg: 'rgba(37, 99, 235, 0.1)',
        secondary: '#64748b',
        secondaryBg: 'rgba(100, 116, 139, 0.1)',
        success: '#16a34a',
        successBg: 'rgba(22, 163, 74, 0.1)',
        warning: '#d97706',
        warningBg: 'rgba(217, 119, 6, 0.1)',
        danger: '#dc2626',
        dangerBg: 'rgba(220, 38, 38, 0.1)',
        info: '#0284c7',
        infoBg: 'rgba(2, 132, 199, 0.1)',
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved || 'light'; // Default to light theme
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.body.style.background = themes[theme].bg;
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value = {
        theme,
        colors: themes[theme],
        isDark: theme === 'dark',
        toggleTheme,
        setTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        return { colors: themes.dark, isDark: true, toggleTheme: () => { }, theme: 'dark' };
    }
    return context;
};

export default ThemeContext;

import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // Sidebar
        dashboard: 'Dashboard',
        myFiles: 'My Files',
        shared: 'Shared',
        activity: 'Activity',
        security: 'Security',
        settings: 'Settings',
        logout: 'Logout',
        // Settings
        appearance: 'Appearance',
        language: 'Language',
        notifications: 'Notifications',
        exportData: 'Export Data',
        deleteAccount: 'Delete Account',
        account: 'Account',
        preferences: 'Preferences',
        data: 'Data',
        profileInfo: 'Profile Information',
        changePassword: 'Change Password',
        securitySettings: 'Security Settings',
        // Files
        upload: 'Upload',
        share: 'Share',
        delete: 'Delete',
        view: 'View',
        download: 'Download',
    },
    ta: {
        // Sidebar
        dashboard: 'டாஷ்போர்டு',
        myFiles: 'எனது கோப்புகள்',
        shared: 'பகிரப்பட்டவை',
        activity: 'நடவடிக்கை',
        security: 'பாதுகாப்பு',
        settings: 'அமைப்புகள்',
        logout: 'வெளியேறு',
        // Settings
        appearance: 'தோற்றம்',
        language: 'மொழி',
        notifications: 'அறிவிப்புகள்',
        exportData: 'தரவை ஏற்றுமதி செய்',
        deleteAccount: 'கணக்கை நீக்கு',
        account: 'கணக்கு',
        preferences: 'முன்னுரிமைகள்',
        data: 'தரவு',
        profileInfo: 'சுயவிவரத் தகவல்',
        changePassword: 'கடவுச்சொல்லை மாற்று',
        securitySettings: 'பாதுகாப்பு அமைப்புகள்',
        // Files
        upload: 'பதிவேற்று',
        share: 'பகிர்',
        delete: 'நீக்கு',
        view: 'பார்',
        download: 'பதிவிறக்கு',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
    return context;
};

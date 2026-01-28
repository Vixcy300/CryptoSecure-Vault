import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FilesPage from './pages/FilesPage';
import ActivityPage from './pages/ActivityPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SecurityPage from './pages/SecurityPage';
import SettingsPage from './pages/SettingsPage';
import SharedPage from './pages/SharedPage';
import SecurityVerifier from './pages/SecurityVerifier';
import SteganographyPage from './pages/SteganographyPage';
import LiveBackground from './components/LiveBackground';
import ErrorBoundary from './ErrorBoundary';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <LiveBackground>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/files" element={<PrivateRoute><FilesPage /></PrivateRoute>} />
                <Route path="/activity" element={<PrivateRoute><ActivityPage /></PrivateRoute>} />
                <Route path="/shared" element={<PrivateRoute><SharedPage /></PrivateRoute>} />
                <Route path="/security" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />
                <Route path="/verify" element={<PrivateRoute><SecurityVerifier /></PrivateRoute>} />
                <Route path="/steganography" element={<PrivateRoute><SteganographyPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>
            </Router>
          </LiveBackground>
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;


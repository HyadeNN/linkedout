import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ConnectionProvider } from '../contexts/ConnectionContext';

const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <LanguageProvider>
              <Router>
                {children}
              </Router>
            </LanguageProvider>
          </NotificationProvider>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProviders; 
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ConnectionProvider } from './contexts/ConnectionContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Network from './pages/Network';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import MyJobs from './pages/MyJobs';
import SavedJobs from './pages/SavedJobs';
import Applications from './pages/Applications';
import Notifications from './pages/Notifications';
import PostDetail from './pages/PostDetail';
import UserProfile from './pages/UserProfile';
import NotFound from './pages/NotFound';
import TestApi from './pages/TestApi';  // Import test page
import About from './pages/About';
import Careers from './pages/Careers';
import Advertising from './pages/Advertising';
import SmallBusiness from './pages/SmallBusiness';
import TalentSolutions from './pages/TalentSolutions';
import MarketingSolutions from './pages/MarketingSolutions';
import SalesSolutions from './pages/SalesSolutions';
import SafetyCenter from './pages/SafetyCenter';
import CommunityGuidelines from './pages/CommunityGuidelines';
import PrivacyTerms from './pages/PrivacyTerms';
import MobileApp from './pages/MobileApp';

// Private Route component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/auth/login" />;
};

// Public Route component (redirects to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConnectionProvider>
          <NotificationProvider>
            <LanguageProvider>
              <Router>
                <Routes>
                  {/* Test API Page - accessible without auth */}
                  <Route path="/test-api" element={<TestApi />} />

                  {/* Auth Routes */}
                  <Route path="/auth/login" element={
                    <PublicRoute>
                      <AuthLayout>
                        <Login />
                      </AuthLayout>
                    </PublicRoute>
                  } />
                  <Route path="/auth/register" element={
                    <PublicRoute>
                      <AuthLayout>
                        <Register />
                      </AuthLayout>
                    </PublicRoute>
                  } />
                  {/* Alternative routes for convenience - redirect to /auth/* paths */}
                  <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/register" element={<Navigate to="/auth/register" replace />} />
                  <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />

                  <Route path="/auth/verify-email" element={
                    <PublicRoute>
                      <AuthLayout>
                        <VerifyEmail />
                      </AuthLayout>
                    </PublicRoute>
                  } />
                  <Route path="/auth/forgot-password" element={
                    <PublicRoute>
                      <AuthLayout>
                        <ForgotPassword />
                      </AuthLayout>
                    </PublicRoute>
                  } />
                  <Route path="/auth/reset-password" element={
                    <PublicRoute>
                      <AuthLayout>
                        <ResetPassword />
                      </AuthLayout>
                    </PublicRoute>
                  } />

                  {/* Protected Routes */}
                  <Route path="/" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Home />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Profile />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/profile/edit" element={
                    <PrivateRoute>
                      <MainLayout>
                        <EditProfile />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/network" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Network />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/jobs" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Jobs />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/jobs/:jobId" element={
                    <PrivateRoute>
                      <MainLayout>
                        <JobDetail />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/jobs/create" element={
                    <PrivateRoute>
                      <MainLayout>
                        <CreateJob />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/jobs/my-jobs" element={
                    <PrivateRoute>
                      <MainLayout>
                        <MyJobs />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/jobs/saved" element={
                    <PrivateRoute>
                      <MainLayout>
                        <SavedJobs />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/applications" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Applications />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/notifications" element={
                    <PrivateRoute>
                      <MainLayout>
                        <Notifications />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/posts/:postId" element={
                    <PrivateRoute>
                      <MainLayout>
                        <PostDetail />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/users/:userId" element={
                    <PrivateRoute>
                      <MainLayout>
                        <UserProfile />
                      </MainLayout>
                    </PrivateRoute>
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/advertising" element={<Advertising />} />
                  <Route path="/small-business" element={<SmallBusiness />} />
                  <Route path="/talent-solutions" element={<TalentSolutions />} />
                  <Route path="/marketing-solutions" element={<MarketingSolutions />} />
                  <Route path="/sales-solutions" element={<SalesSolutions />} />
                  <Route path="/safety-center" element={<SafetyCenter />} />
                  <Route path="/community-guidelines" element={<CommunityGuidelines />} />
                  <Route path="/privacy-terms" element={<PrivacyTerms />} />
                  <Route path="/mobile-app" element={<MobileApp />} />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </LanguageProvider>
          </NotificationProvider>
        </ConnectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
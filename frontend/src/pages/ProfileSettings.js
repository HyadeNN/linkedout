import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  unlink,
  GoogleAuthProvider,
  linkWithPopup,
  updateEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');
  const [phoneVerificationStep, setPhoneVerificationStep] = useState(1);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  
  // Provider management state
  const [providers, setProviders] = useState([]);
  const [providerError, setProviderError] = useState('');
  const [providerSuccess, setProviderSuccess] = useState('');
  
  // General loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch user providers on load
  useEffect(() => {
    if (firebaseUser) {
      const providerData = firebaseUser.providerData || [];
      setProviders(providerData);
      
      // Pre-fill email field
      setNewEmail(firebaseUser.email || '');
    }
  }, [firebaseUser]);
  
  // Setup reCAPTCHA when component mounts
  useEffect(() => {
    // Clean up any existing reCAPTCHA
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (err) {
        console.error("Error clearing reCAPTCHA:", err);
      }
    }
    
    // Initialize new reCAPTCHA only if in step 1
    if (phoneVerificationStep === 1) {
      const setupRecaptcha = () => {
        try {
          // First clear the container
          const container = document.getElementById('recaptcha-container');
          if (container) {
            container.innerHTML = '';
            
            // Create a new reCAPTCHA verifier - simplified implementation
            window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
              'size': 'normal',
              'callback': (response) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                setRecaptchaReady(true);
                console.log('reCAPTCHA verified');
              },
              'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTCHA again.
                setRecaptchaReady(false);
                setPhoneError('reCAPTCHA süresi doldu. Lütfen tekrar doğrulayın.');
              }
            }, auth);
            
            // Render the reCAPTCHA widget
            window.recaptchaVerifier.render()
              .then(widgetId => {
                window.recaptchaWidgetId = widgetId;
              })
              .catch(error => {
                console.error('reCAPTCHA render error:', error);
                setPhoneError('reCAPTCHA yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
              });
          }
        } catch (error) {
          console.error('Failed to set up reCAPTCHA:', error);
          setPhoneError('reCAPTCHA yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
        }
      };
      
      // Setup after a short delay to ensure the DOM is ready
      const timerId = setTimeout(setupRecaptcha, 1000);
      
      // Clear timeout on cleanup
      return () => clearTimeout(timerId);
    }
    
    // Cleanup function
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (error) {
          console.error('Error cleaning up reCAPTCHA:', error);
        }
      }
    };
  }, [phoneVerificationStep]);
  
  // Helper to check if a provider is linked
  const isProviderLinked = (providerId) => {
    return providers.some(provider => provider.providerId === providerId);
  };
  
  // Re-authenticate user (needed for sensitive operations)
  const reauthenticate = async (password) => {
    try {
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        password
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      return true;
    } catch (error) {
      console.error('Re-authentication error:', error);
      throw error;
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First re-authenticate
      await reauthenticate(currentPassword);
      
      // Then update password
      await updatePassword(firebaseUser, newPassword);
      
      setPasswordSuccess('Your password has been changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError(`Password could not be changed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle email change
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Enter a valid email address');
      return;
    }
    
    // If email is the same as current, no need to update
    if (newEmail === firebaseUser.email) {
      setEmailError('This is already your current email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First re-authenticate
      await reauthenticate(emailPassword);
      
      // Then update email
      await updateEmail(firebaseUser, newEmail);
      
      setEmailSuccess('Your email address has been updated successfully');
      setEmailPassword('');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setEmailError('Current password is incorrect');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email address is already in use');
      } else {
        setEmailError(`Email could not be updated: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle phone number verification - step 1: send code
  const handleSendPhoneVerification = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    
    // Validate phone number
    if (!phoneNumber.startsWith('+')) {
      setPhoneError('Phone number must start with country code (e.g. +1)');
      return;
    }
    
    if (!recaptchaReady) {
      setPhoneError('Please complete the reCAPTCHA verification first.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the recaptchaVerifier to send verification code
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      
      // Save the confirmation result for later use
      setConfirmationResult(confirmation);
      setPhoneSuccess('Verification code has been sent. Please enter the 6-digit code received on your phone.');
      setPhoneVerificationStep(2);
    } catch (error) {
      console.error('Phone verification error:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        setPhoneError('Invalid phone number');
      } else if (error.code === 'auth/captcha-check-failed') {
        setPhoneError('reCAPTCHA verification failed. Please try again.');
        
        // Reset reCAPTCHA
        try {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
          }
          
          // Clear the container
          const container = document.getElementById('recaptcha-container');
          if (container) {
            container.innerHTML = '';
          }
          
          // Setup reCAPTCHA again
          setTimeout(() => {
            try {
              window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
                'size': 'normal',
                'callback': () => {
                  setRecaptchaReady(true);
                }
              }, auth);
              
              window.recaptchaVerifier.render();
            } catch (e) {
              console.error('Error re-setting up reCAPTCHA:', e);
            }
          }, 1000);
        } catch (e) {
          console.error('Error resetting reCAPTCHA:', e);
        }
      } else if (error.code === 'auth/quota-exceeded') {
        setPhoneError('SMS sending limit exceeded. Please try again later.');
      } else if (error.code === 'auth/missing-verification-id') {
        setPhoneError('Verification process could not be started. Please refresh and try again.');
      } else if (error.code === 'auth/invalid-verification-id') {
        setPhoneError('Invalid verification session. Please refresh and try again.');
      } else {
        setPhoneError(`Verification code could not be sent: ${error.message}`);
      }
      
      setRecaptchaReady(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle phone verification - step 2: verify code
  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    
    if (!verificationCode || verificationCode.length !== 6) {
      setPhoneError('Please enter the 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!confirmationResult) {
        setPhoneError('Verification session is invalid. Please start over.');
        setPhoneVerificationStep(1);
        return;
      }
      
      // Confirm the verification code
      const result = await confirmationResult.confirm(verificationCode);
      
      // If the signed-in user is different from the current user, link the phone credential
      if (result.user && result.user.uid !== firebaseUser.uid) {
        // Create a phone credential
        const phoneCredential = PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          verificationCode
        );
        
        // Link the phone credential to the current user
        await linkWithCredential(firebaseUser, phoneCredential);
      }
      
      // Success!
      setPhoneSuccess('Your phone number has been verified and linked to your account');
      setPhoneVerificationStep(1);
      setPhoneNumber('');
      setVerificationCode('');
      setConfirmationResult(null);
      
      // Refresh providers
      if (firebaseUser) {
        const providerData = firebaseUser.providerData || [];
        setProviders(providerData);
      }
    } catch (error) {
      console.error('Code verification error:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        setPhoneError('Invalid verification code');
      } else if (error.code === 'auth/code-expired') {
        setPhoneError('Verification code has expired. Please request a new code.');
        setPhoneVerificationStep(1);
      } else {
        setPhoneError(`Phone verification failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle Google account linking
  const handleLinkGoogle = async () => {
    setProviderError('');
    setProviderSuccess('');
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(firebaseUser, provider);
      
      setProviderSuccess('Your Google account has been linked successfully');
      
      // Refresh providers
      setProviders(firebaseUser.providerData || []);
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
        setProviderError('This Google account is already linked to another account');
      } else {
        setProviderError(`Google account linking failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle provider unlinking
  const handleUnlinkProvider = async (providerId) => {
    setProviderError('');
    setProviderSuccess('');
    
    // Don't allow unlinking if it's the only provider
    if (providers.length <= 1) {
      setProviderError('At least one login method must remain linked');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await unlink(firebaseUser, providerId);
      
      setProviderSuccess('Account link has been successfully removed');
      
      // Refresh providers
      setProviders(firebaseUser.providerData || []);
    } catch (error) {
      setProviderError(`Could not unlink account: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset phone verification process
  const resetPhoneVerification = () => {
    setPhoneVerificationStep(1);
    setPhoneError('');
    setPhoneSuccess('');
    setVerificationCode('');
    setConfirmationResult(null);
    setRecaptchaReady(false);
    
    // Reset and clear any existing reCAPTCHA
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (e) {
        console.error("Error clearing reCAPTCHA:", e);
      }
    }
  };
  
  if (!user || !firebaseUser) {
    return <div className="loading-container">Loading...</div>;
  }
  
  return (
    <div className="profile-settings-container">
      <h1 className="profile-settings-title">Account Settings</h1>
      
      <div className="settings-section">
        <h2 className="settings-section-title">Linked Accounts</h2>
        <div className="linked-accounts">
          {/* Email Provider */}
          <div className="linked-account">
            <div className="account-info">
              <div className="account-type">
                <i className="fas fa-envelope"></i>
                <span>Email</span>
              </div>
              <div className="account-detail">{firebaseUser.email}</div>
            </div>
            <div className="account-actions">
              {providers.length > 1 && isProviderLinked('password') && (
                <button 
                  className="unlink-button"
                  onClick={() => handleUnlinkProvider('password')}
                  disabled={isLoading}
                >
                  Unlink
                </button>
              )}
            </div>
          </div>
          
          {/* Phone Provider */}
          {isProviderLinked('phone') && (
            <div className="linked-account">
              <div className="account-info">
                <div className="account-type">
                  <i className="fas fa-phone"></i>
                  <span>Phone</span>
                </div>
                <div className="account-detail">
                  {providers.find(p => p.providerId === 'phone')?.phoneNumber || 'Linked'}
                </div>
              </div>
              <div className="account-actions">
                <button 
                  className="unlink-button"
                  onClick={() => handleUnlinkProvider('phone')}
                  disabled={isLoading}
                >
                  Unlink
                </button>
              </div>
            </div>
          )}
          
          {/* Google Provider */}
          {isProviderLinked('google.com') ? (
            <div className="linked-account">
              <div className="account-info">
                <div className="account-type">
                  <i className="fab fa-google"></i>
                  <span>Google</span>
                </div>
                <div className="account-detail">
                  {providers.find(p => p.providerId === 'google.com')?.email || 'Linked'}
                </div>
              </div>
              <div className="account-actions">
                <button 
                  className="unlink-button"
                  onClick={() => handleUnlinkProvider('google.com')}
                  disabled={isLoading}
                >
                  Unlink
                </button>
              </div>
            </div>
          ) : (
            <div className="add-account">
              <button 
                className="link-button google-button"
                onClick={handleLinkGoogle}
                disabled={isLoading}
              >
                <i className="fab fa-google"></i>
                Link Google Account
              </button>
            </div>
          )}
        </div>
        
        {providerError && <div className="error-message">{providerError}</div>}
        {providerSuccess && <div className="success-message">{providerSuccess}</div>}
      </div>
      
      {/* Email Change Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Change Email</h2>
        <form onSubmit={handleEmailChange} className="settings-form">
          <div className="form-group">
            <label htmlFor="newEmail">New Email Address</label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="emailPassword">Current Password</label>
            <input
              type="password"
              id="emailPassword"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              required
            />
          </div>
          
          {emailError && <div className="error-message">{emailError}</div>}
          {emailSuccess && <div className="success-message">{emailSuccess}</div>}
          
          <button
            type="submit"
            className="update-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Update Email Address'}
          </button>
        </form>
      </div>
      
      {/* Password Change Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {passwordError && <div className="error-message">{passwordError}</div>}
          {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
          
          <button
            type="submit"
            className="update-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Update Password'}
          </button>
        </form>
      </div>
      
      {/* Phone Verification Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Phone Number Verification</h2>
        
        {!isProviderLinked('phone') ? (
          <>
            {phoneVerificationStep === 1 ? (
              <form onSubmit={handleSendPhoneVerification} className="settings-form">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1XXXXXXXXXX"
                    required
                  />
                  <small className="input-help">
                    This site uses Google reCAPTCHA protection for phone verification.
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Verification</label>
                  <div id="recaptcha-container" className="recaptcha-container"></div>
                </div>
                
                {phoneError && <div className="error-message">{phoneError}</div>}
                {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
                
                <button
                  type="submit"
                  className="update-button"
                  disabled={isLoading || !recaptchaReady}
                >
                  {isLoading ? 'Processing...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneCode} className="settings-form">
                <div className="form-group">
                  <label htmlFor="verificationCode">Verification Code</label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                  <small className="input-help">
                    Enter the 6-digit code received on your phone
                  </small>
                </div>
                
                {phoneError && <div className="error-message">{phoneError}</div>}
                {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={resetPhoneVerification}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="update-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Verify Code'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="verification-complete">
            <p>Your phone number has been verified and linked to your account.</p>
          </div>
        )}
      </div>
      
      <div className="settings-section">
        <h2 className="settings-section-title">Security Tips</h2>
        <div className="security-tips">
          <h3>Security Tips</h3>
          <ul>
            <li>Use a strong password to protect your account.</li>
            <li>Enable two-factor authentication for extra security.</li>
            <li>Verify your phone number for two-factor authentication.</li>
            <li>Link your Google account for secure logins.</li>
            <li>Having alternative methods to access your account is important if you forget your password.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 
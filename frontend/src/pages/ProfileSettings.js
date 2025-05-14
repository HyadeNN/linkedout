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
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First re-authenticate
      await reauthenticate(currentPassword);
      
      // Then update password
      await updatePassword(firebaseUser, newPassword);
      
      setPasswordSuccess('Şifreniz başarıyla değiştirildi');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Mevcut şifreniz hatalı');
      } else {
        setPasswordError(`Şifre değiştirilemedi: ${error.message}`);
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
      setEmailError('Geçerli bir e-posta adresi girin');
      return;
    }
    
    // If email is the same as current, no need to update
    if (newEmail === firebaseUser.email) {
      setEmailError('Bu zaten mevcut e-posta adresiniz');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First re-authenticate
      await reauthenticate(emailPassword);
      
      // Then update email
      await updateEmail(firebaseUser, newEmail);
      
      setEmailSuccess('E-posta adresiniz başarıyla değiştirildi');
      setEmailPassword('');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setEmailError('Şifreniz hatalı');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('Bu e-posta adresi zaten kullanımda');
      } else {
        setEmailError(`E-posta değiştirilemedi: ${error.message}`);
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
      setPhoneError('Telefon numarası ülke kodu ile başlamalıdır (ör. +90)');
      return;
    }
    
    if (!recaptchaReady) {
      setPhoneError('Lütfen önce reCAPTCHA doğrulamasını tamamlayın.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the recaptchaVerifier to send verification code
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      
      // Save the confirmation result for later use
      setConfirmationResult(confirmation);
      setPhoneSuccess('Doğrulama kodu gönderildi. Lütfen telefonunuza gelen 6 haneli kodu girin.');
      setPhoneVerificationStep(2);
    } catch (error) {
      console.error('Phone verification error:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        setPhoneError('Geçersiz telefon numarası');
      } else if (error.code === 'auth/captcha-check-failed') {
        setPhoneError('reCAPTCHA doğrulaması başarısız oldu. Lütfen tekrar deneyin.');
        
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
        setPhoneError('SMS gönderme sınırına ulaşıldı. Lütfen daha sonra tekrar deneyin.');
      } else if (error.code === 'auth/missing-verification-id') {
        setPhoneError('Doğrulama işlemi başlatılamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      } else if (error.code === 'auth/invalid-verification-id') {
        setPhoneError('Geçersiz doğrulama oturumu. Lütfen sayfayı yenileyip tekrar deneyin.');
      } else {
        setPhoneError(`Doğrulama kodu gönderilemedi: ${error.message}`);
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
      setPhoneError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!confirmationResult) {
        setPhoneError('Doğrulama oturumu geçersiz. Lütfen tekrar baştan başlayın.');
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
      setPhoneSuccess('Telefon numaranız başarıyla doğrulandı ve hesabınıza bağlandı');
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
        setPhoneError('Geçersiz doğrulama kodu');
      } else if (error.code === 'auth/code-expired') {
        setPhoneError('Doğrulama kodu süresi doldu. Lütfen yeni bir kod isteyin.');
        setPhoneVerificationStep(1);
      } else {
        setPhoneError(`Telefon doğrulama başarısız: ${error.message}`);
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
      
      setProviderSuccess('Google hesabınız başarıyla bağlandı');
      
      // Refresh providers
      setProviders(firebaseUser.providerData || []);
    } catch (error) {
      if (error.code === 'auth/credential-already-in-use') {
        setProviderError('Bu Google hesabı zaten başka bir hesaba bağlı');
      } else {
        setProviderError(`Google hesabı bağlama başarısız: ${error.message}`);
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
      setProviderError('En az bir giriş yöntemi bağlı kalmalıdır');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await unlink(firebaseUser, providerId);
      
      setProviderSuccess('Hesap bağlantısı başarıyla kaldırıldı');
      
      // Refresh providers
      setProviders(firebaseUser.providerData || []);
    } catch (error) {
      setProviderError(`Hesap bağlantısı kaldırılamadı: ${error.message}`);
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
    return <div className="loading-container">Yükleniyor...</div>;
  }
  
  return (
    <div className="profile-settings-container">
      <h1 className="profile-settings-title">Hesap Ayarları</h1>
      
      <div className="settings-section">
        <h2 className="settings-section-title">Bağlı Hesaplar</h2>
        <div className="linked-accounts">
          {/* Email Provider */}
          <div className="linked-account">
            <div className="account-info">
              <div className="account-type">
                <i className="fas fa-envelope"></i>
                <span>E-posta</span>
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
                  Bağlantıyı Kaldır
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
                  <span>Telefon</span>
                </div>
                <div className="account-detail">
                  {providers.find(p => p.providerId === 'phone')?.phoneNumber || 'Bağlı'}
                </div>
              </div>
              <div className="account-actions">
                <button 
                  className="unlink-button"
                  onClick={() => handleUnlinkProvider('phone')}
                  disabled={isLoading}
                >
                  Bağlantıyı Kaldır
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
                  {providers.find(p => p.providerId === 'google.com')?.email || 'Bağlı'}
                </div>
              </div>
              <div className="account-actions">
                <button 
                  className="unlink-button"
                  onClick={() => handleUnlinkProvider('google.com')}
                  disabled={isLoading}
                >
                  Bağlantıyı Kaldır
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
                Google Hesabını Bağla
              </button>
            </div>
          )}
        </div>
        
        {providerError && <div className="error-message">{providerError}</div>}
        {providerSuccess && <div className="success-message">{providerSuccess}</div>}
      </div>
      
      {/* Email Change Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">E-posta Değiştir</h2>
        <form onSubmit={handleEmailChange} className="settings-form">
          <div className="form-group">
            <label htmlFor="newEmail">Yeni E-posta Adresi</label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="emailPassword">Mevcut Şifreniz</label>
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
            {isLoading ? 'İşleniyor...' : 'E-posta Adresini Güncelle'}
          </button>
        </form>
      </div>
      
      {/* Password Change Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Şifre Değiştir</h2>
        <form onSubmit={handlePasswordChange} className="settings-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Mevcut Şifre</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">Yeni Şifre</label>
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
            <label htmlFor="confirmPassword">Yeni Şifreyi Onayla</label>
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
            {isLoading ? 'İşleniyor...' : 'Şifreyi Güncelle'}
          </button>
        </form>
      </div>
      
      {/* Phone Verification Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">Telefon Numarası Doğrulama</h2>
        
        {!isProviderLinked('phone') ? (
          <>
            {phoneVerificationStep === 1 ? (
              <form onSubmit={handleSendPhoneVerification} className="settings-form">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Telefon Numarası</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+90XXXXXXXXXX"
                    required
                  />
                  <small className="input-help">
                    Ülke kodu ile birlikte girin (örn. +905551234567)
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Doğrulama</label>
                  <div id="recaptcha-container" className="recaptcha-container"></div>
                </div>
                
                {phoneError && <div className="error-message">{phoneError}</div>}
                {phoneSuccess && <div className="success-message">{phoneSuccess}</div>}
                
                <p className="recaptcha-disclosure">
                  Bu site, telefon doğrulama için Google reCAPTCHA koruması kullanmaktadır.
                </p>
                
                <button
                  type="submit"
                  className="update-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'İşleniyor...' : 'Doğrulama Kodu Gönder'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneCode} className="settings-form">
                <div className="form-group">
                  <label htmlFor="verificationCode">Doğrulama Kodu</label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="6 haneli kod"
                    maxLength={6}
                    required
                  />
                  <small className="input-help">
                    Telefonunuza gönderilen 6 haneli kodu girin
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
                    Geri
                  </button>
                  
                  <button
                    type="submit"
                    className="update-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'İşleniyor...' : 'Kodu Doğrula'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="verification-complete">
            <p>Telefon numaranız doğrulanmış ve hesabınıza bağlı.</p>
          </div>
        )}
      </div>
      
      <div className="settings-section">
        <h2 className="settings-section-title">Güvenlik İpuçları</h2>
        <div className="security-tips">
          <ul>
            <li>Hesabınızı korumak için güçlü bir şifre kullanın.</li>
            <li>Şifrenizi düzenli olarak değiştirin.</li>
            <li>İki faktörlü kimlik doğrulama için telefon numaranızı doğrulayın.</li>
            <li>Güvenli girişler için Google hesabınızı bağlayın.</li>
            <li>Şifrenizi unutursanız, hesaba erişmek için alternatif yöntemler olması önemlidir.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 
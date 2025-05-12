import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Footer.css';

const translations = {
  en: {
    about: 'About',
    careers: 'Careers',
    advertising: 'Advertising',
    smallBusiness: 'Small Business',
    talentSolutions: 'Talent Solutions',
    marketingSolutions: 'Marketing Solutions',
    salesSolutions: 'Sales Solutions',
    safetyCenter: 'Safety Center',
    communityGuidelines: 'Community Guidelines',
    privacyTerms: 'Privacy & Terms',
    mobileApp: 'Mobile App',
    fastAccess: 'Fast access',
    questions: 'Questions?',
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    turkish: 'Türkçe',
  },
  tr: {
    about: 'Hakkında',
    careers: 'Kariyerler',
    advertising: 'Reklam',
    smallBusiness: 'Küçük İşletme',
    talentSolutions: 'Yetenek Çözümleri',
    marketingSolutions: 'Pazarlama Çözümleri',
    salesSolutions: 'Satış Çözümleri',
    safetyCenter: 'Güvenlik Merkezi',
    communityGuidelines: 'Topluluk Kuralları',
    privacyTerms: 'Gizlilik ve Şartlar',
    mobileApp: 'Mobil Uygulama',
    fastAccess: 'Hızlı erişim',
    questions: 'Sorular?',
    settings: 'Ayarlar',
    language: 'Dil',
    english: 'English',
    turkish: 'Türkçe',
  },
};

const Footer = () => {
  const { lang, setLang } = useLanguage();
  const t = translations[lang];

  return (
    <footer className="figma-footer">
      <div className="figma-footer-bg" />
      <div className="figma-footer-sep">
        <div className="figma-footer-line" />
        <div className="figma-footer-gradient" />
      </div>
      <div className="figma-footer-content">
        <div className="figma-footer-logo">
          <div className="figma-logo-icon" />
          <span className="figma-logo-text">LinkedOut</span>
        </div>
        <div className="figma-footer-nav">
          <div className="figma-nav-col">
            <Link className="figma-nav-link" to="/about">{t.about}</Link>
            <Link className="figma-nav-link" to="/careers">{t.careers}</Link>
            <Link className="figma-nav-link" to="/advertising">{t.advertising}</Link>
            <Link className="figma-nav-link" to="/small-business">{t.smallBusiness}</Link>
          </div>
          <div className="figma-nav-col">
            <Link className="figma-nav-link" to="/talent-solutions">{t.talentSolutions}</Link>
            <Link className="figma-nav-link" to="/marketing-solutions">{t.marketingSolutions}</Link>
            <Link className="figma-nav-link" to="/sales-solutions">{t.salesSolutions}</Link>
            <Link className="figma-nav-link" to="/safety-center">{t.safetyCenter}</Link>
          </div>
          <div className="figma-nav-col">
            <Link className="figma-nav-link" to="/community-guidelines">{t.communityGuidelines}</Link>
            <Link className="figma-nav-link" to="/privacy-terms">{t.privacyTerms}</Link>
            <Link className="figma-nav-link" to="/mobile-app">{t.mobileApp}</Link>
          </div>
        </div>
        <div className="figma-footer-fastaccess">
          <div className="figma-nav-title">{t.fastAccess}</div>
          <button className="figma-fast-btn primary">
            <span>{t.questions}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#fff" strokeWidth="2"/><text x="8" y="12" textAnchor="middle" fontSize="10" fill="#fff">?</text></svg>
          </button>
          <button className="figma-fast-btn secondary">
            <span>{t.settings}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#0077b5" strokeWidth="2"/><rect x="6" y="6" width="4" height="4" fill="#0077b5"/></svg>
          </button>
        </div>
        <div className="figma-footer-language">
          <div className="figma-nav-title">{t.language}</div>
          <div className="figma-language-selector">
            <select value={lang} onChange={e => setLang(e.target.value)}>
              <option value="en">{t.english}</option>
              <option value="tr">{t.turkish}</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
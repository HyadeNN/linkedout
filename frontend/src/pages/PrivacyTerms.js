import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const PrivacyTerms = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Gizlilik ve Şartlar' : 'Privacy & Terms'}</h1>
      <p>{lang === 'tr' ? 'Bu, Gizlilik ve Şartlar sayfasıdır.' : 'This is the Privacy & Terms page.'}</p>
    </div>
  );
};

export default PrivacyTerms; 
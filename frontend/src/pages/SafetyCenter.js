import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const SafetyCenter = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Güvenlik Merkezi' : 'Safety Center'}</h1>
      <p>{lang === 'tr' ? 'Bu, Güvenlik Merkezi sayfasıdır.' : 'This is the Safety Center page.'}</p>
    </div>
  );
};

export default SafetyCenter; 
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const MobileApp = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Mobil Uygulama' : 'Mobile App'}</h1>
      <p>{lang === 'tr' ? 'Bu, Mobil Uygulama sayfasıdır.' : 'This is the Mobile App page.'}</p>
    </div>
  );
};

export default MobileApp; 
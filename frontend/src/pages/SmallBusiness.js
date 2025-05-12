import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const SmallBusiness = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Küçük İşletme' : 'Small Business'}</h1>
      <p>{lang === 'tr' ? 'Bu, Küçük İşletme sayfasıdır.' : 'This is the Small Business page.'}</p>
    </div>
  );
};

export default SmallBusiness; 
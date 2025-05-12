import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Advertising = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Reklam' : 'Advertising'}</h1>
      <p>{lang === 'tr' ? 'Bu, Reklam sayfasıdır.' : 'This is the Advertising page.'}</p>
    </div>
  );
};

export default Advertising; 
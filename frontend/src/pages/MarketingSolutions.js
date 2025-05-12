import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const MarketingSolutions = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Pazarlama Çözümleri' : 'Marketing Solutions'}</h1>
      <p>{lang === 'tr' ? 'Bu, Pazarlama Çözümleri sayfasıdır.' : 'This is the Marketing Solutions page.'}</p>
    </div>
  );
};

export default MarketingSolutions; 
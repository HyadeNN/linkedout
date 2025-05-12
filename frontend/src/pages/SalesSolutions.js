import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const SalesSolutions = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Satış Çözümleri' : 'Sales Solutions'}</h1>
      <p>{lang === 'tr' ? 'Bu, Satış Çözümleri sayfasıdır.' : 'This is the Sales Solutions page.'}</p>
    </div>
  );
};

export default SalesSolutions; 
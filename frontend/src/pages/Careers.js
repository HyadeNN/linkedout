import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Careers = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Kariyerler' : 'Careers'}</h1>
      <p>{lang === 'tr' ? 'Bu, Kariyerler sayfasıdır.' : 'This is the Careers page.'}</p>
    </div>
  );
};

export default Careers; 
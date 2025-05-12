import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const TalentSolutions = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Yetenek Çözümleri' : 'Talent Solutions'}</h1>
      <p>{lang === 'tr' ? 'Bu, Yetenek Çözümleri sayfasıdır.' : 'This is the Talent Solutions page.'}</p>
    </div>
  );
};

export default TalentSolutions; 
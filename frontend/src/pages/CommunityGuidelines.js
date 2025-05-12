import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CommunityGuidelines = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Topluluk Kuralları' : 'Community Guidelines'}</h1>
      <p>{lang === 'tr' ? 'Bu, Topluluk Kuralları sayfasıdır.' : 'This is the Community Guidelines page.'}</p>
    </div>
  );
};

export default CommunityGuidelines; 
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const About = () => {
  const { lang } = useLanguage();
  return (
    <div style={{ padding: 40 }}>
      <h1>{lang === 'tr' ? 'Hakkında' : 'About'}</h1>
      <p>{lang === 'tr' ? 'Bu, Hakkında sayfasıdır.' : 'This is the About page.'}</p>
    </div>
  );
};

export default About; 
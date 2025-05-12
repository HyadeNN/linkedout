import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <div className="nav-logo-zone">
    <Link to="/">
      <img src="/linkedin-logo.svg" alt="Logo" className="nav-logo" />
    </Link>
  </div>
);

export default Logo; 
import React from 'react';
import { Link } from 'react-router-dom';
import linkedoutLogo from '../../assets/images/linkedout-logo.svg';

const Logo = () => (
  <div className="nav-logo-zone">
    <Link to="/">
      <img src={linkedoutLogo} alt="LinkedOut" className="nav-logo" />
    </Link>
  </div>
);

export default Logo; 
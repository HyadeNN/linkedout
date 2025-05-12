import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const NavigationMenu = ({ navItems }) => {
  const location = useLocation();
  return (
    <nav className="nav-menu">
      {navItems.map((item) => (
        <Link
          to={item.path}
          className={`nav-menu-item${location.pathname === item.path ? ' active' : ''}`}
          key={item.name}
        >
          <span className="nav-menu-icon">{item.icon}</span>
          <span className="nav-menu-label">{item.name}</span>
        </Link>
      ))}
    </nav>
  );
};

export default NavigationMenu; 
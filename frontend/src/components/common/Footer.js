import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-title">LinkedOut</h3>
          <p className="footer-description">Connect with professionals, find jobs, and build your career.</p>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">General</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/network">Network</Link></li>
            <li><Link to="/jobs">Jobs</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Browse Jobs</h4>
          <ul className="footer-links">
            <li><Link to="/jobs">Job Search</Link></li>
            <li><Link to="/jobs/saved">Saved Jobs</Link></li>
            <li><Link to="/applications">Applications</Link></li>
            <li><Link to="/jobs/create">Post a Job</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Business</h4>
          <ul className="footer-links">
            <li><Link to="/jobs/my-jobs">My Job Postings</Link></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Enterprise Solutions</a></li>
            <li><a href="#">Small Business</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Legal</h4>
          <ul className="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Cookie Policy</a></li>
            <li><a href="#">Copyright Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">&copy; {currentYear} LinkedOut. All rights reserved.</p>
        <div className="language-selector">
          <select>
            <option value="en">English</option>
            <option value="tr">Turkish</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
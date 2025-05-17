import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landingpage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="navbar">
        <div className="logo">
          <span className="logo-text">M</span>
          <span className="logo-text-urgency">Urgency</span>
        </div>
        <ul className="nav-links">
          <li onClick={() => navigate('/')}>Home</li>
          <li onClick={() => navigate('/about')}>About Us</li>
          <li onClick={() => navigate('/contact')}>Contact Us</li>
          <li onClick={() => navigate('/signin')}>Login / Signup</li>
        </ul>
      </div>

      <div className="hero-text">
        <h1 className="fade-in">Emergency Medical Response</h1>
        <h2 className="fade-in delay-1">Fast, Easy and Reliable</h2>
        <p className="fade-in delay-2">Try our first emergency response app for real-time help</p>
        <div className="cta-buttons fade-in delay-3">
          <button className="signup-button" onClick={() => navigate('/signup')}>
            Get Started
          </button>
          <button className="login-button" onClick={() => navigate('/signin')}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
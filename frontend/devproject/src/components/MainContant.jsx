import React, { useState, useEffect } from 'react';
import './MainContent.css';
import { FaHeartbeat, FaExclamationTriangle, FaClock } from 'react-icons/fa';

const MainContent = ({ onNavigate }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setAnimate(true);
  }, []);

  return (
    <div className="main-content">
      <div className={`features-section ${animate ? 'animate-section' : ''}`}>
        <div className="feature red">
          <div className="feature-icon"><FaHeartbeat /></div>
          <h3>Medical Emergencies</h3>
          <p>Get the nearest ambulance and first responders with real-time tracking and ETA.</p>
        </div>

        <div className="feature orange">
          <div className="feature-icon"><FaExclamationTriangle /></div>
          <h3>Crime or Safety Alerts</h3>
          <p>Quickly notify law enforcement and alert nearby responders for immediate action.</p>
        </div>

        <div className="feature blue">
          <div className="feature-icon"><FaClock /></div>
          <h3>Smart Delay Notifications</h3>
          <p>Stay informed about potential delays due to traffic congestion or route blockages.</p>
        </div>
      </div>

      <div className={`cta-section ${animate ? 'fade-in-up' : ''}`}>
        <h2>Smart Delay Warnings</h2>
        <p>We analyze traffic and inform you of delays before responders are even dispatched.</p>
        <div className="cta-buttons">
          <button className="cta-primary" onClick={() => onNavigate('signup')}>Request Help Now</button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;

import React, { useState } from 'react';
import './Auth.css';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign up form submitted:', formData);
    // Navigate to Emergency Homepage on successful signup
    navigate('/user');
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="back-button" onClick={() => navigate('/signin')}>
          <FaArrowLeft />
        </button>
        <div className="logo">
          <span className="logo-text">M</span>
          <span className="logo-text-urgency">Urgency</span>
        </div>
      </div>

      <div className="auth-form-container">
        <h2>Create Account</h2>
        <p>Join MUrgency's emergency response network</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="auth-button">Create Account</button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <button className="text-button" onClick={() => navigate('/signin')}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

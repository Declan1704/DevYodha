import React, { useState } from "react";
import "./Auth.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be 10 digits");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8787/api/users/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      });
      console.log("User signed up:", res.data.user);
      navigate("/signin");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Signup failed. Please try again.";
      setError(errorMsg);
      console.error(
        "Signup error:",
        err.response?.data,
        err.response?.status,
        err.message
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="back-button" onClick={() => navigate("/signin")}>
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
        {error && <p className="error-message">{error}</p>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <button className="text-button" onClick={() => navigate("/signin")}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

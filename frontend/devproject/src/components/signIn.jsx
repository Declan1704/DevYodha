import React, { useState } from "react";
import "./Auth.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:34869/api/users/signin", {
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", res.data.token);
      console.log("User signed in:", res.data.user);
      navigate("/user");
    } catch (err) {
      console.error("Sign in error:", err.response?.data?.error || err.message);
      alert(err.response?.data?.error || "Sign in failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <FaArrowLeft />
        </button>
        <div className="logo">
          <span className="logo-text">M</span>
          <span className="logo-text-urgency">Urgency</span>
        </div>
      </div>

      <div className="auth-form-container">
        <h2>Sign In</h2>
        <p>Welcome back! Please sign in to your account</p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>
          <button type="submit" className="auth-button">
            Sign In
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <button className="text-button" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

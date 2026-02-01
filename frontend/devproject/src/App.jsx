import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet, // For protected routes
  useNavigate, // For programmatic navigation
} from "react-router-dom";

// Import your components
import SignIn from "./components/signIn"; // Assuming you have this
import SignUp from "./components/signup"; // Assuming you have this
import EmergencyHomePage from "./components/EmergencyHomePage"; // User's dashboard
import LandingPage from "./components/landingpage";
import MapComponent from "./components/MapComponent"; // The main map interface

// 1. Create an Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

// 2. AuthProvider Component
const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const navigate = useNavigate(); // Hook for navigation within AuthProvider

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      // Optional: Add a check here to verify token validity with the backend
      // If invalid, clear token and redirect to login.
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    // Navigate to a default authenticated page after login, e.g., '/mapping' or '/user'
    navigate("/mapping", { replace: true });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/landingpage", { replace: true }); // Navigate to landing or signin on logout
  };

  const value = { token, login, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. ProtectedRoute Component
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // Redirect them to the /signin page, but save the current location they were
    // trying to go to so we can send them along after they login.
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />; // Renders the child route's element
};

function App() {
  return (
    // Wrap the entire app with Router and then AuthProvider
    // Note: AuthProvider needs to be INSIDE Router to use `useNavigate`
    <Router>
      <AuthProviderWrapper />
    </Router>
  );
}

// Helper component to ensure AuthProvider is within Router context
function AuthProviderWrapper() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/landingpage" replace />} />
        <Route path="/landingpage" element={<LandingPage />} />
        {/* Pass the login function to SignIn component */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Outlet will render these child routes if authenticated */}
          <Route path="/user" element={<EmergencyHomePage />} />
          <Route path="/mapping" element={<MapPageWithLogout />} />
        </Route>

        {/* Fallback for unknown routes (optional) */}
        <Route path="*" element={<Navigate to="/landingpage" replace />} />
      </Routes>
    </AuthProvider>
  );
}

// Wrapper for MapComponent to include the logout button easily
function MapPageWithLogout() {
  const { logout } = useAuth();
  return (
    <>
      <button
        onClick={logout}
        style={{
          position: "fixed", // Use fixed for viewport-relative positioning
          top: "20px",
          right: "20px",
          zIndex: 10001, // Ensure it's above map controls
          padding: "8px 15px",
          background: "#ef4444", // Red for logout
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "0.875rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        Logout
      </button>
      <MapComponent />
    </>
  );
}

// Example SignInPage and SignUpPage components that use the AuthContext
// You should replace these with your actual SignIn and SignUp components
// and make them use the `login` function from `useAuth()`.

function SignInPage() {
  const { login } = useAuth(); // Get login function from context
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(
        "https://my-app.dev-yodha.workers.dev/api/users/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      login(data.token); // Use the login function from AuthContext
      // Navigation is handled by the login function in AuthProvider
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#1a202c",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#2d3748",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Sign In</h2>
        {error && (
          <p
            style={{
              color: "#f87171",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            {error}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Sign In
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.875rem",
          }}
        >
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            style={{
              color: "#60a5fa",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(
        "https://my-app.dev-yodha.workers.dev/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, phone }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
      alert("Registration successful! Please proceed to sign in.");
      navigate("/signin"); // Redirect to signin page after successful registration
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#1a202c",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#2d3748",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Sign Up</h2>
        {error && (
          <p
            style={{
              color: "#f87171",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            {error}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            required
            style={inputStyle}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            required
            style={inputStyle}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (Optional)"
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Sign Up
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.875rem",
          }}
        >
          Already have an account?{" "}
          <button
            onClick={() => navigate("/signin")}
            style={{
              color: "#60a5fa",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

// Shared styles (can be moved to a CSS file)
const inputStyle = {
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #4A5568",
  background: "#1A202C",
  color: "white",
  fontSize: "1rem",
};
const buttonStyle = {
  padding: "12px 15px",
  borderRadius: "6px",
  border: "none",
  background: "#3182CE",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1rem",
};

export default App;

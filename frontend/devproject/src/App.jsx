import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/signIn';
import SignUp from './components/signup';
import EmergencyHomePage from './components/EmergencyHomePage';
import LandingPage from './components/landingpage'; // Make sure this path and file exists

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root "/" to "/landingpage" */}
        <Route path="/" element={<Navigate to="/landingpage" replace />} />

        {/* Landing page route */}
        <Route path="/landingpage" element={<LandingPageage />} />

        {/* Other routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/user" element={<EmergencyHomePage />} />
      </Routes>
    </Router>
  );
}

export default App;

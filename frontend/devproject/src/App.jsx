import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/signIn';
import SignUp from './components/signup';
import EmergencyHomePage from './components/EmergencyHomePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signIn" />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/user" element={<EmergencyHomePage />} />
      </Routes>
    </Router>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MinistryDirectory from './pages/MinistryDirectory';
import MinistryDetail from './pages/MinistryDetail';
import Leaderboard from './pages/Leaderboard';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="ministries" element={<MinistryDirectory />} />
            <Route path="ministries/:id/analytics" element={<MinistryDetail />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute roles={['citizen']} />}>
              <Route path="submit-complaint" element={<SubmitComplaint />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

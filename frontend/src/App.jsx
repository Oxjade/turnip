import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import CookieBanner from './components/CookieBanner';
import Home from './pages/Home';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Docs from './pages/Docs';
import Affiliate from './pages/Affiliate';
import { Security, Terms, Privacy } from './pages/Legal';

// Tracker component to extract ?ref=... and save to localStorage
function ReferralTracker() {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('turnip_referral', refCode);
    }
  }, []);
  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
      <div className="app-container">
        <ReferralTracker />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/security" element={<Security />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </main>

        {/* Footer could go here or as a component */}
      </div>
      <CookieBanner />
      </AuthProvider>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        main {
          flex: 1;
        }
      `}</style>
    </Router>
  );
}

export default App;

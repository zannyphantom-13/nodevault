import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppContext, { useApp } from './context/AppContext';
import Layout from './components/Layout';
import RegionSelect from './pages/RegionSelect';
import Landing from './pages/Landing';
import Tiers from './pages/Tiers';
import Register from './pages/Register';
import Login from './pages/Login';
import KYC from './pages/KYC';
import AccountSettings from './pages/AccountSettings';
import Dashboard from './pages/Dashboard';
import FreeMining from './pages/FreeMining';
import Admin from './pages/Admin';
import './index.css';
import './App.css';

// Guard: if no region selected, show RegionSelect first
function RegionGuard({ children }) {
  const { regionCode } = useApp();
  if (!regionCode) return <RegionSelect />;
  return children;
}

export default function App() {
  return (
    <AppContext>
      <BrowserRouter>
        <RegionGuard>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Landing />} />
              <Route path="/tiers" element={<Tiers />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/kyc" element={<KYC />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/mining" element={<FreeMining />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RegionGuard>
      </BrowserRouter>
    </AppContext>
  );
}

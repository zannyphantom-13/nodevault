import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  REGIONS,
  TIER_DATA_NG,
  TIER_DATA_US,
  MOCK_USER_NG,
  MOCK_USER_US,
  MOCK_POOLS_NG,
  MOCK_POOLS_US,
  buildTierData,
} from '../data/platform';
import { dbAuth, dbKYC, dbBank, dbDocs, dbRefunds, dbTransactions, dbNetwork, dbAdmin, dbConnection } from '../services/db';

const Ctx = createContext(null);

export default function AppContext({ children }) {
  // Region state — defaults to NG if stored or null for modal
  const [regionCode, setRegionCode] = useState(() => {
    return localStorage.getItem('nodevault_region') || 'NG';
  });

  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const [user,         setUser]         = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [dbStatus,     setDbStatus]     = useState(dbConnection.getStatusSummary());

  // Restore authenticated session from persistent DB on mount
  useEffect(() => {
    const active = dbAuth.getCurrentUser();
    if (active) {
      setUser(active);
      setIsLoggedIn(true);
      if (active.region) {
        setRegionCode(active.region);
        localStorage.setItem('nodevault_region', active.region);
      }
    }
  }, []);

  // Update DB status listener
  const refreshDbStatus = () => {
    setDbStatus(dbConnection.getStatusSummary());
  };

  // Derived region object + tier data
  const region = regionCode ? REGIONS[regionCode] : REGIONS.NG;
  const tierData = useMemo(() => {
    if (!regionCode) return TIER_DATA_NG;
    return regionCode === 'NG' ? TIER_DATA_NG : TIER_DATA_US;
  }, [regionCode]);

  const pools = useMemo(() => {
    if (!regionCode) return MOCK_POOLS_NG;
    return regionCode === 'NG' ? MOCK_POOLS_NG : MOCK_POOLS_US;
  }, [regionCode]);

  const mockUser = regionCode === 'NG' ? MOCK_USER_NG : MOCK_USER_US;

  // Region selector
  const selectRegion = (code) => {
    setRegionCode(code);
    localStorage.setItem('nodevault_region', code);
    if (user) {
      const updated = dbAuth.updateUser({ region: code });
      setUser(updated);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (userData.region) {
      setRegionCode(userData.region);
      localStorage.setItem('nodevault_region', userData.region);
    }
    refreshDbStatus();
  };

  const logout = async () => {
    await dbAuth.logout();
    setIsLoggedIn(false);
    setUser(null);
    refreshDbStatus();
  };

  const updateUserProfile = (updates) => {
    const updated = dbAuth.updateUser(updates);
    if (updated) {
      setUser(updated);
    }
    return updated;
  };

  return (
    <Ctx.Provider value={{
      regionCode,
      region,
      selectRegion,
      tierData,
      pools,
      mockUser,
      user,
      setUser,
      isLoggedIn,
      login,
      logout,
      updateUserProfile,
      selectedTier,
      setSelectedTier,
      dbStatus,
      refreshDbStatus,
      // Database services
      dbAuth,
      dbKYC,
      dbBank,
      dbDocs,
      dbRefunds,
      dbTransactions,
      dbNetwork,
      dbAdmin,
      dbConnection,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
};

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
import { dbAuth, dbKYC, dbBank, dbDocs, dbRefunds, dbTransactions, dbNetwork, dbAdmin, dbConnection, getSupabase } from '../services/db';

const Ctx = createContext(null);

export default function AppContext({ children }) {
  // Region strictly locked to Nigeria (NGN)
  const [regionCode] = useState('NG');

  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const [user,         setUser]         = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [dbStatus,     setDbStatus]     = useState(dbConnection.getStatusSummary());

  // Restore authenticated session & listen to Supabase Auth (e.g. Google OAuth redirect)
  useEffect(() => {
    // 1. Initial local store check
    const active = dbAuth.getCurrentUser();
    if (active) {
      setUser(active);
      setIsLoggedIn(true);
    }

    // 2. Supabase Cloud Session & OAuth Listener (Google Sign-In)
    const sb = getSupabase();
    if (sb) {
      sb.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const synced = await dbAuth.syncSupabaseUser(session.user);
          if (synced) {
            setUser(synced);
            setIsLoggedIn(true);
          }
        }
      }).catch(err => console.warn('Supabase getSession error:', err));

      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
          const synced = await dbAuth.syncSupabaseUser(session.user);
          if (synced) {
            setUser(synced);
            setIsLoggedIn(true);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoggedIn(false);
          localStorage.removeItem('nodevault_current_user');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, []);

  // Update DB status listener
  const refreshDbStatus = () => {
    setDbStatus(dbConnection.getStatusSummary());
  };

  // Strictly Nigerian Naira (NGN) platform
  const region   = REGIONS.NG;
  const tierData = TIER_DATA_NG;
  const pools    = MOCK_POOLS_NG;
  const mockUser = MOCK_USER_NG;

  const selectRegion = () => {}; // Strictly NGN supported

  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
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

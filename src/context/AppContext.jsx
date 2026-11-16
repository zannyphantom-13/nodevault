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
  formatProjected,
  toNVT,
  formatNVT,
  COIN_RATE_NGN,
  SOVEREIGN_BENCHMARK,
  getActiveSovereignRate,
  calculateNTBRealYield,
  calculateCustomerAPY,
} from '../data/platform';
import { dbAuth, dbKYC, dbBank, dbDocs, dbRefunds, dbTransactions, dbNetwork, dbAdmin, dbConnection, getSupabase } from '../services/db';

const Ctx = createContext(null);

export default function AppContext({ children }) {
  // Region strictly locked to Nigeria (NGN)
  const [regionCode] = useState('NG');

  // Currency Projection Engine: 'NGN' (default ₦) or 'NVT' ($NVT token projection)
  const [projectionMode, setProjectionMode] = useState(() => {
    return localStorage.getItem('nodevault_projection_mode') || 'NGN';
  });

  // Sovereign Benchmark Yield Engine (CBN / DMO 364D NTB)
  const [sovereignRate, setSovereignRate] = useState(() => getActiveSovereignRate());

  const updateSovereignBenchmark = ({ stopRate, protocolFee = 6.0, model = 'REAL_YIELD_MINUS_FEE', auctionCode, approvedBy = 'Admin' }) => {
    const realYield = calculateNTBRealYield(stopRate, 364);
    const customerAPY = calculateCustomerAPY(stopRate, protocolFee, model, 364);
    const newBenchmark = {
      auctionCode: auctionCode || `CBN-NTB-364D-${new Date().getFullYear()}`,
      tenorDays: 364,
      stopRate: Number(stopRate),
      realYield,
      protocolFee: Number(protocolFee),
      customerAPY,
      feeModel: model,
      effectiveDate: new Date().toISOString().split('T')[0],
      settlementAgency: 'Central Bank of Nigeria (CBN) / DMO Primary Auction',
      approvedBy,
      status: 'active'
    };
    setSovereignRate(newBenchmark);
    localStorage.setItem('nodevault_sovereign_rate', JSON.stringify(newBenchmark));
    return newBenchmark;
  };

  const toggleProjection = () => {
    setProjectionMode((prev) => {
      const next = prev === 'NGN' ? 'NVT' : 'NGN';
      localStorage.setItem('nodevault_projection_mode', next);
      return next;
    });
  };

  const formatProjectedValue = (amount, compact = false) => {
    return formatProjected(amount, projectionMode, compact);
  };

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

  // Dynamic Tier Registry & Platform Modules Engine
  const [tierData, setTierData] = useState(() => dbAdmin.getTiersList());
  const refreshTiers = () => setTierData(dbAdmin.getTiersList());

  const [platformModules, setPlatformModules] = useState(() => dbAdmin.getPlatformModules());
  const refreshModules = () => setPlatformModules(dbAdmin.getPlatformModules());

  // Strictly Nigerian Naira (NGN) platform — synchronized with dynamic tiers
  const region = useMemo(() => ({
    ...REGIONS.NG,
    tiers: tierData,
    tierCount: tierData.length,
    cap: tierData.length > 0 ? tierData[tierData.length - 1].fee : 2560000,
  }), [tierData]);

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
      projectionMode,
      setProjectionMode,
      toggleProjection,
      formatProjectedValue,
      toNVT,
      formatNVT,
      sovereignRate,
      updateSovereignBenchmark,
      calculateNTBRealYield,
      calculateCustomerAPY,
      tierData,
      refreshTiers,
      platformModules,
      refreshModules,
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
  if (!ctx) {
    return {
      regionCode: 'NG',
      region: { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
      isLoggedIn: false,
      user: null,
      dbAuth,
      dbKYC,
      dbBank,
      dbDocs,
      dbRefunds,
      dbTransactions,
      dbNetwork,
      dbAdmin,
      dbConnection,
    };
  }
  return ctx;
};

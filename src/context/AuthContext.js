import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const TOKEN_KEY = '@heritage_explorer/token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const applyAuth = useCallback(async response => {
    const nextToken = response.data.token;
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);
  const refreshProfile = useCallback(async () => {
    const response = await api.get('/users/profile');
    setUser(response.data.user);
    return response.data.user;
  }, []);
  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(async saved => {
      if (!saved) return;
      setToken(saved);
      try { await refreshProfile(); }
      catch (error) { await AsyncStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); }
    }).finally(() => setIsLoading(false));
  }, [refreshProfile]);
  const actions = useMemo(() => ({
    login: credentials => api.post('/auth/login', credentials).then(applyAuth),
    register: credentials => api.post('/auth/register', credentials).then(applyAuth),
    updateProfile: async profile => {
      const response = await api.put('/users/profile', profile);
      setUser(response.data.user);
      return response.data.user;
    },
    refreshProfile,
    logout: async () => { await AsyncStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); },
  }), [applyAuth, refreshProfile]);
  return <AuthContext.Provider value={{ token, user, isLoading, isAuthenticated: Boolean(token), ...actions }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; };

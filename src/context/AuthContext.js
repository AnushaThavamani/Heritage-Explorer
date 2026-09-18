import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const TOKEN_KEY = '@heritage_explorer/token';
const AuthContext = createContext(null);
const userFromToken = token => { try { const payload = jwtDecode(token); return payload.exp && payload.exp * 1000 < Date.now() ? null : payload; } catch (error) { return null; } };

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { AsyncStorage.getItem(TOKEN_KEY).then(saved => { if (saved && userFromToken(saved)) { setToken(saved); setUser(userFromToken(saved)); } }).finally(() => setIsLoading(false)); }, []);
  const saveAuth = async response => { await AsyncStorage.setItem(TOKEN_KEY, response.data.token); setToken(response.data.token); setUser(response.data.user); return response.data.user; };
  const actions = useMemo(() => ({
    login: async credentials => saveAuth(await api.post('/auth/login', credentials)),
    register: async credentials => saveAuth(await api.post('/auth/register', credentials)),
    logout: async () => { await AsyncStorage.removeItem(TOKEN_KEY); await AsyncStorage.removeItem('@heritage_explorer/user'); setToken(null); setUser(null); },
  }), []);
  return <AuthContext.Provider value={{ token, user, isLoading, isAuthenticated: Boolean(token), ...actions }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within AuthProvider'); return context; };

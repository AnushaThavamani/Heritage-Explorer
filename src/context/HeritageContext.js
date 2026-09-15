import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, setFavorites, setTrail, setUser } from '../store/store';

const HeritageContext = createContext(null);
const STORAGE_KEYS = { user: '@heritage_explorer/user', favorites: '@heritage_explorer/favorites', trail: '@heritage_explorer/trail', visited: '@heritage_explorer/visited' };
const HERITAGE_SITES = [
  { id: 'meenakshi-amman-temple', title: 'Meenakshi Amman Temple', location: 'Madurai, Tamil Nadu', city: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', stateCode: 'TN', category: 'Temples', type: 'Dravidian Temple', latitude: 9.9195, longitude: 78.1193, timings: '5:00 AM - 9:30 PM', duration: '2 - 3 hours', unesco: false },
  { id: 'taj-mahal', title: 'Taj Mahal', location: 'Agra, Uttar Pradesh', city: 'Agra', district: 'Agra', state: 'Uttar Pradesh', stateCode: 'UP', category: 'UNESCO Sites', type: 'Mausoleum', latitude: 27.1751, longitude: 78.0421, timings: 'Sunrise - Sunset (closed Fridays)', duration: '2 - 3 hours', unesco: true },
  { id: 'hampi', title: 'Hampi', location: 'Hampi, Karnataka', city: 'Hampi', district: 'Vijayanagara', state: 'Karnataka', stateCode: 'KA', category: 'UNESCO Sites', type: 'Heritage Complex', latitude: 15.335, longitude: 76.46, timings: 'Sunrise - Sunset', duration: 'Half day', unesco: true },
  { id: 'mysore-palace', title: 'Mysore Palace', location: 'Mysuru, Karnataka', city: 'Mysuru', district: 'Mysuru', state: 'Karnataka', stateCode: 'KA', category: 'Palaces', type: 'Palace', latitude: 12.3052, longitude: 76.6552, timings: '10:00 AM - 5:30 PM', duration: '2 hours', unesco: false },
  { id: 'qutb-minar', title: 'Qutb Minar', location: 'New Delhi, Delhi', city: 'New Delhi', district: 'South Delhi', state: 'Delhi', stateCode: 'DL', category: 'UNESCO Sites', type: 'Minaret', latitude: 28.5244, longitude: 77.1855, timings: '7:00 AM - 5:00 PM', duration: '1.5 - 2 hours', unesco: true },
];
const initialState = { sites: [], user: null, favorites: [], visited: [], trail: [], isHydrated: false, isLoadingSites: true, sitesError: '' };
const readStoredJson = async key => { const value = await AsyncStorage.getItem(key); return value ? JSON.parse(value) : null; };
const normalizeVisited = visited => Array.isArray(visited) ? visited.map(item => typeof item === 'string' ? { id: item, visitedAt: new Date().toISOString() } : item).filter(item => item && item.id) : [];

function heritageReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.payload, visited: normalizeVisited(action.payload.visited), isHydrated: true };
    case 'LOAD_SITES': return { ...state, sites: action.payload, isLoadingSites: false, sitesError: '' };
    case 'SITES_ERROR': return { ...state, isLoadingSites: false, sitesError: action.payload };
    case 'SITES_LOADING': return { ...state, isLoadingSites: true, sitesError: '' };
    case 'LOGIN': return { ...state, user: { name: action.payload.name || 'Heritage Traveller', email: action.payload.email, mobile: action.payload.mobile || '', category: action.payload.category || 'All' } };
    case 'UPDATE_PROFILE': return { ...state, user: { ...state.user, ...action.payload } };
    case 'TOGGLE_FAVORITE': return { ...state, favorites: state.favorites.includes(action.payload) ? state.favorites.filter(id => id !== action.payload) : [action.payload, ...state.favorites] };
    case 'TOGGLE_TRAIL': return { ...state, trail: state.trail.includes(action.payload) ? state.trail.filter(id => id !== action.payload) : [...state.trail, action.payload] };
    case 'MARK_VISITED': return state.visited.some(item => item.id === action.payload.id) ? state : { ...state, visited: [...state.visited, action.payload] };
    case 'LOGOUT': return { ...initialState, sites: state.sites, isHydrated: true, isLoadingSites: state.isLoadingSites, sitesError: state.sitesError };
    default: return state;
  }
}

export function HeritageProvider({ children }) {
  const [state, dispatch] = useReducer(heritageReducer, initialState);
  const reduxDispatch = useDispatch();
  const reduxFavorites = useSelector(reduxState => reduxState.heritage.favorites);
  const clearingStorage = useRef(false);
  const refreshSites = useCallback(async () => {
    dispatch({ type: 'SITES_LOADING' });
    try {
      const sites = await Promise.all(HERITAGE_SITES.map(async seed => {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(seed.title)}`);
        if (!response.ok) throw new Error(`Wikipedia returned ${response.status}`);
        const summary = await response.json();
        return { ...seed, name: summary.title || seed.title, description: summary.extract || 'Wikipedia summary is unavailable for this site.', image: summary.originalimage?.source || summary.thumbnail?.source || '', wikipediaUrl: summary.content_urls?.desktop?.page || '' };
      }));
      dispatch({ type: 'LOAD_SITES', payload: sites });
    } catch (error) { dispatch({ type: 'SITES_ERROR', payload: 'We could not load heritage sites right now. Check your connection and try again.' }); }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [user, favorites, trail, visited] = await Promise.all([readStoredJson(STORAGE_KEYS.user), readStoredJson(STORAGE_KEYS.favorites), readStoredJson(STORAGE_KEYS.trail), readStoredJson(STORAGE_KEYS.visited)]);
        dispatch({ type: 'HYDRATE', payload: { user, favorites: Array.isArray(favorites) ? favorites : [], trail: Array.isArray(trail) ? trail : [], visited } });
      } catch (error) { dispatch({ type: 'HYDRATE', payload: { user: null, favorites: [], trail: [], visited: [] } }); }
    };
    hydrate();
    refreshSites();
  }, [refreshSites]);

  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user)); }, [state.isHydrated, state.user]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites)); }, [state.favorites, state.isHydrated]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.trail, JSON.stringify(state.trail)); }, [state.trail, state.isHydrated]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.visited, JSON.stringify(state.visited)); }, [state.visited, state.isHydrated]);
  useEffect(() => { reduxDispatch(setFavorites(state.favorites)); }, [reduxDispatch, state.favorites]);
  useEffect(() => { reduxDispatch(setTrail(state.trail)); }, [reduxDispatch, state.trail]);

  const actions = useMemo(() => ({
    login: user => { dispatch({ type: 'LOGIN', payload: user }); reduxDispatch(setUser({ name: user.name || 'Heritage Traveller', email: user.email })); },
    toggleFavorite: id => dispatch({ type: 'TOGGLE_FAVORITE', payload: id }), toggleTrail: id => dispatch({ type: 'TOGGLE_TRAIL', payload: id }),
    markVisited: site => { const id = typeof site === 'string' ? site : site.id || site.title || site.name; dispatch({ type: 'MARK_VISITED', payload: { id, title: typeof site === 'string' ? site : site.name, visitedAt: new Date().toISOString() } }); },
    updateProfile: profile => dispatch({ type: 'UPDATE_PROFILE', payload: profile }),
    logout: async () => { clearingStorage.current = true; dispatch({ type: 'LOGOUT' }); reduxDispatch(clearUser()); reduxDispatch(setFavorites([])); reduxDispatch(setTrail([])); try { await AsyncStorage.clear(); } finally { clearingStorage.current = false; } }, refreshSites,
  }), [reduxDispatch, refreshSites]);
  const previousFavorites = useRef(state.favorites);
  const hasLoadedFavorites = useRef(false);
  useEffect(() => { if (!state.isHydrated) return; if (!hasLoadedFavorites.current) { previousFavorites.current = state.favorites; hasLoadedFavorites.current = true; return; } if (previousFavorites.current !== state.favorites) { const added = state.favorites.length > previousFavorites.current.length; Alert.alert(added ? 'Added to favourites.' : 'Removed from favourites.', added ? 'This heritage site is now in your saved list.' : 'This heritage site was removed from your saved list.'); previousFavorites.current = state.favorites; } }, [state.favorites, state.isHydrated]);
  const previousVisited = useRef(state.visited);
  useEffect(() => { if (state.isHydrated && state.visited.length > previousVisited.current.length) Alert.alert('Marked as visited!', 'This site was added to your Heritage Passport.'); previousVisited.current = state.visited; }, [state.visited, state.isHydrated]);
  const citiesExplored = [...new Set(state.visited.map(visit => state.sites.find(site => site.id === visit.id)?.city).filter(Boolean))].length;
  const categoriesExplored = [...new Set(state.visited.map(visit => state.sites.find(site => site.id === visit.id)?.category).filter(Boolean))].length;
  return <HeritageContext.Provider value={{ ...state, reduxFavorites, citiesExplored, categoriesExplored, ...actions, dispatch }}>{children}</HeritageContext.Provider>;
}
export function useHeritage() { const context = useContext(HeritageContext); if (!context) throw new Error('useHeritage must be used within HeritageProvider'); return context; }

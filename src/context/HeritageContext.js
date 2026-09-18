import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, setFavorites, setTrail, setUser } from '../store/store';
import { useAuth } from './AuthContext';
import api, { apiMessage } from '../services/api';

const HeritageContext = createContext(null);
const STORAGE_KEYS = { user: '@heritage_explorer/user', favorites: '@heritage_explorer/favorites', trail: '@heritage_explorer/trail', visited: '@heritage_explorer/visited' };
const initialState = { sites: [], user: null, favorites: [], visited: [], trail: [], isHydrated: false, isLoadingSites: true, sitesError: '' };
const readStoredJson = async key => { const value = await AsyncStorage.getItem(key); return value ? JSON.parse(value) : null; };
const normalizeVisited = visited => Array.isArray(visited) ? visited.map(item => typeof item === 'string' ? { id: item, visitedAt: new Date().toISOString() } : item).filter(item => item && item.id) : [];

function heritageReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': return { ...state, ...action.payload, visited: normalizeVisited(action.payload.visited), isHydrated: true };
    case 'LOAD_SITES': return { ...state, sites: action.payload, isLoadingSites: false, sitesError: '' };
    case 'SITES_ERROR': return { ...state, isLoadingSites: false, sitesError: action.payload };
    case 'SITES_LOADING': return { ...state, isLoadingSites: true, sitesError: '' };
    case 'LOGIN': return { ...state, user: { id: action.payload.id, name: action.payload.name || 'Heritage Traveller', email: action.payload.email, mobile: action.payload.mobile || '', category: action.payload.category || 'All' } };
    case 'UPDATE_PROFILE': return { ...state, user: { ...state.user, ...action.payload } };
    case 'TOGGLE_FAVORITE': return { ...state, favorites: state.favorites.includes(action.payload) ? state.favorites.filter(id => id !== action.payload) : [action.payload, ...state.favorites] };
    case 'TOGGLE_TRAIL': return { ...state, trail: state.trail.includes(action.payload) ? state.trail.filter(id => id !== action.payload) : [...state.trail, action.payload] };
    case 'MARK_VISITED': return state.visited.some(item => item.id === action.payload.id) ? state : { ...state, visited: [...state.visited, action.payload] };
    case 'LOGOUT': return { ...initialState, sites: state.sites, isHydrated: true, isLoadingSites: state.isLoadingSites, sitesError: state.sitesError };
    default: return state;
  }
}

export function HeritageProvider({ children }) {
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
  const [state, dispatch] = useReducer(heritageReducer, initialState);
  const reduxDispatch = useDispatch();
  const reduxFavorites = useSelector(reduxState => reduxState.heritage.favorites);
  const clearingStorage = useRef(false);
  const refreshSites = useCallback(async () => {
    dispatch({ type: 'SITES_LOADING' });
    try {
      const response = await api.get('/heritage-sites');
      const sites = response.data.map(site => ({ ...site, id: site.siteId || site.id, title: site.title || site.name, timings: site.timings || site.visitorTimings, image: site.image || site.imageUrl }));
      dispatch({ type: 'LOAD_SITES', payload: sites });
    } catch (error) { dispatch({ type: 'SITES_ERROR', payload: apiMessage(error) }); }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [user, favorites, trail, visited] = await Promise.all([readStoredJson(STORAGE_KEYS.user), readStoredJson(STORAGE_KEYS.favorites), readStoredJson(STORAGE_KEYS.trail), readStoredJson(STORAGE_KEYS.visited)]);
        dispatch({ type: 'HYDRATE', payload: { user: authUser || user, favorites: Array.isArray(favorites) ? favorites : [], trail: Array.isArray(trail) ? trail : [], visited } });
      } catch (error) { dispatch({ type: 'HYDRATE', payload: { user: null, favorites: [], trail: [], visited: [] } }); }
    };
    hydrate();
    refreshSites();
  }, [authUser, refreshSites]);

  useEffect(() => { if (!isAuthLoading && authUser) dispatch({ type: 'LOGIN', payload: authUser }); }, [authUser, isAuthLoading]);
  useEffect(() => { if (!authUser?.id) return undefined; Promise.all([api.get(`/favourites/${authUser.id}`), api.get(`/visited-sites/${authUser.id}`)]).then(([favourites, visited]) => dispatch({ type: 'HYDRATE', payload: { user: authUser, favorites: favourites.data.map(item => item.siteId), visited: visited.data.map(item => ({ id: item.siteId, visitedAt: item.visitedAt })) } })).catch(() => {}); return undefined; }, [authUser]);

  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(state.user)); }, [state.isHydrated, state.user]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites)); }, [state.favorites, state.isHydrated]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.trail, JSON.stringify(state.trail)); }, [state.trail, state.isHydrated]);
  useEffect(() => { if (state.isHydrated && !clearingStorage.current) AsyncStorage.setItem(STORAGE_KEYS.visited, JSON.stringify(state.visited)); }, [state.visited, state.isHydrated]);
  useEffect(() => { reduxDispatch(setFavorites(state.favorites)); }, [reduxDispatch, state.favorites]);
  useEffect(() => { reduxDispatch(setTrail(state.trail)); }, [reduxDispatch, state.trail]);

  const currentFavorites = state.favorites;
  const currentUser = state.user;
  const actions = useMemo(() => ({
    login: user => { dispatch({ type: 'LOGIN', payload: user }); reduxDispatch(setUser({ name: user.name || 'Heritage Traveller', email: user.email })); },
    toggleFavorite: async id => { const saved = currentFavorites.includes(id); dispatch({ type: 'TOGGLE_FAVORITE', payload: id }); if (currentUser?.id) { try { if (saved) await api.delete(`/favourites/${currentUser.id}/${id}`); else await api.post('/favourites', { userId: currentUser.id, siteId: id }); } catch (error) { dispatch({ type: 'TOGGLE_FAVORITE', payload: id }); Alert.alert('Could not update favourite', apiMessage(error)); } } },
    toggleTrail: id => dispatch({ type: 'TOGGLE_TRAIL', payload: id }),
    saveTrail: async siteIds => { if (!currentUser?.id) return Alert.alert('Login required', 'Log in to save a personalized trail.'); try { await api.post('/trails', { userId: currentUser.id, trailName: 'My heritage trail', siteIds }); Alert.alert('Trail saved', 'Your personalized trail is synced to your account.'); } catch (error) { Alert.alert('Could not save trail', apiMessage(error)); } },
    markVisited: async site => { const id = typeof site === 'string' ? site : site.id || site.title || site.name; const visitedAt = new Date().toISOString(); dispatch({ type: 'MARK_VISITED', payload: { id, title: typeof site === 'string' ? site : site.name, visitedAt } }); if (currentUser?.id) { try { await api.post('/visited-sites', { userId: currentUser.id, siteId: id, visitedAt }); } catch (error) { Alert.alert('Could not sync visit', apiMessage(error)); } } },
    updateProfile: profile => dispatch({ type: 'UPDATE_PROFILE', payload: profile }),
    logout: async () => { clearingStorage.current = true; dispatch({ type: 'LOGOUT' }); reduxDispatch(clearUser()); reduxDispatch(setFavorites([])); reduxDispatch(setTrail([])); try { await AsyncStorage.clear(); } finally { clearingStorage.current = false; } }, refreshSites,
  }), [reduxDispatch, refreshSites, currentFavorites, currentUser]);
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

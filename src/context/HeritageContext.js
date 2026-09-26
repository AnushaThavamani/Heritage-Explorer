import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser, setFavorites, setTrail, setUser } from '../store/store';
import { useAuth } from './AuthContext';
import api, { apiMessage } from '../services/api';

const HeritageContext = createContext(null);
const initialState = { sites: [], favorites: [], visited: [], trails: [], trail: [], isHydrated: false, isLoadingSites: true, sitesError: '', isLoadingUserData: false };
const normalizeSite = site => ({ ...site, id: site.siteId || site.id, title: site.title || site.name, timings: site.timings || site.visitorTimings, image: site.image || site.imageUrl || site.images?.[0], latitude: site.latitude ?? site.coordinates?.latitude, longitude: site.longitude ?? site.coordinates?.longitude });
function reducer(state, action) {
  switch (action.type) {
    case 'SITES_LOADING': return { ...state, isLoadingSites: true, sitesError: '' };
    case 'SITES': return { ...state, sites: action.payload, isLoadingSites: false, sitesError: '' };
    case 'SITES_ERROR': return { ...state, isLoadingSites: false, sitesError: action.payload };
    case 'USER_DATA_LOADING': return { ...state, isLoadingUserData: true };
    case 'USER_DATA': return { ...state, ...action.payload, isHydrated: true, isLoadingUserData: false };
    case 'CLEAR_USER_DATA': return { ...state, favorites: [], visited: [], trails: [], trail: [], isHydrated: true, isLoadingUserData: false };
    case 'SET_DRAFT_TRAIL': return { ...state, trail: action.payload };
    default: return state;
  }
}

export function HeritageProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const reduxDispatch = useDispatch();
  const reduxFavorites = useSelector(reduxState => reduxState.heritage.favorites);
  const refreshSites = useCallback(async () => {
    dispatch({ type: 'SITES_LOADING' });
    try { const response = await api.get('/heritagesites'); dispatch({ type: 'SITES', payload: response.data.map(normalizeSite) }); }
    catch (error) { dispatch({ type: 'SITES_ERROR', payload: apiMessage(error) }); }
  }, []);
  const refreshUserData = useCallback(async () => {
    if (!isAuthenticated) { dispatch({ type: 'CLEAR_USER_DATA' }); return; }
    dispatch({ type: 'USER_DATA_LOADING' });
    try {
      const [favourites, visits, trails] = await Promise.all([api.get('/favourites'), api.get('/visitedsites'), api.get('/trails')]);
      dispatch({ type: 'USER_DATA', payload: { favorites: favourites.data.map(item => item.siteId), visited: visits.data.map(item => ({ id: item.siteId, visitedAt: item.visitedAt })), trails: trails.data } });
    } catch (error) { Alert.alert('Could not refresh saved data', apiMessage(error)); dispatch({ type: 'USER_DATA', payload: { favorites: [], visited: [], trails: [] } }); }
  }, [isAuthenticated]);
  useEffect(() => { refreshSites(); }, [refreshSites]);
  useEffect(() => { if (!authLoading) refreshUserData(); }, [authLoading, refreshUserData]);
  useEffect(() => { reduxDispatch(setFavorites(state.favorites)); }, [reduxDispatch, state.favorites]);
  useEffect(() => { reduxDispatch(setTrail(state.trail)); }, [reduxDispatch, state.trail]);
  useEffect(() => { if (user) reduxDispatch(setUser({ name: user.name, email: user.email })); else reduxDispatch(clearUser()); }, [reduxDispatch, user]);

  const requireUser = useCallback(() => { if (!isAuthenticated) { Alert.alert('Login required', 'Log in to save your personal heritage data.'); return false; } return true; }, [isAuthenticated]);
  const actions = useMemo(() => ({
    login: () => {},
    toggleFavorite: async siteId => {
      if (!requireUser()) return;
      try {
        if (state.favorites.includes(siteId)) await api.delete(`/favourites/${siteId}`);
        else await api.post('/favourites', { siteId });
        await refreshUserData();
        Alert.alert(state.favorites.includes(siteId) ? 'Removed from favourites' : 'Added to favourites', 'Your saved list has been refreshed.');
      } catch (error) { Alert.alert('Could not update favourite', apiMessage(error)); }
    },
    toggleTrail: siteId => dispatch({ type: 'SET_DRAFT_TRAIL', payload: state.trail.includes(siteId) ? state.trail.filter(id => id !== siteId) : [...state.trail, siteId] }),
    setTrail: siteIds => dispatch({ type: 'SET_DRAFT_TRAIL', payload: siteIds }),
    saveTrail: async ({ id, trailName, description = '', siteIds }) => {
      if (!requireUser()) return null;
      try {
        const response = id ? await api.put(`/trails/${id}`, { trailName, description, siteIds }) : await api.post('/trails', { trailName, description, siteIds });
        await refreshUserData();
        dispatch({ type: 'SET_DRAFT_TRAIL', payload: response.data.siteIds });
        return response.data;
      } catch (error) { Alert.alert('Could not save trail', apiMessage(error)); return null; }
    },
    deleteTrail: async id => { try { await api.delete(`/trails/${id}`); await refreshUserData(); return true; } catch (error) { Alert.alert('Could not delete trail', apiMessage(error)); return false; } },
    markVisited: async site => {
      if (!requireUser()) return;
      const siteId = typeof site === 'string' ? site : site.id;
      if (state.visited.some(item => item.id === siteId)) return;
      try { await api.post('/visitedsites', { siteId }); await refreshUserData(); Alert.alert('Marked as visited!', 'This site was added to your Heritage Passport.'); } catch (error) { Alert.alert('Could not mark visited', apiMessage(error)); }
    },
    unmarkVisited: async siteId => { try { await api.delete(`/visitedsites/${siteId}`); await refreshUserData(); Alert.alert('Visited status removed', 'Your Heritage Passport has been refreshed.'); } catch (error) { Alert.alert('Could not remove visited status', apiMessage(error)); } },
    createSite: async payload => { try { const response = await api.post('/heritagesites', payload); await refreshSites(); return response.data; } catch (error) { Alert.alert('Could not create site', apiMessage(error)); return null; } },
    updateSite: async (siteId, payload) => { try { const response = await api.put(`/heritagesites/${siteId}`, payload); await refreshSites(); return response.data; } catch (error) { Alert.alert('Could not update site', apiMessage(error)); return null; } },
    deleteSite: async siteId => { try { await api.delete(`/heritagesites/${siteId}`); await refreshSites(); return true; } catch (error) { Alert.alert('Could not delete site', apiMessage(error)); return false; } },
    refreshSites,
    refreshUserData,
    logout: () => dispatch({ type: 'CLEAR_USER_DATA' }),
  }), [refreshSites, refreshUserData, requireUser, state.favorites, state.trail, state.visited]);
  const citiesExplored = [...new Set(state.visited.map(visit => state.sites.find(site => site.id === visit.id)?.city).filter(Boolean))].length;
  const categoriesExplored = [...new Set(state.visited.map(visit => state.sites.find(site => site.id === visit.id)?.category).filter(Boolean))].length;
  return <HeritageContext.Provider value={{ ...state, user, reduxFavorites, citiesExplored, categoriesExplored, ...actions }}>{children}</HeritageContext.Provider>;
}
export function useHeritage() { const context = useContext(HeritageContext); if (!context) throw new Error('useHeritage must be used within HeritageProvider'); return context; }

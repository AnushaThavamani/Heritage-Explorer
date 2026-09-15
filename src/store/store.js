import { configureStore, createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { name: 'Heritage Traveller', email: 'traveller@heritage.in' },
  reducers: {
    setUser: (state, action) => action.payload,
    clearUser: () => ({ name: 'Heritage Traveller', email: 'traveller@heritage.in' }),
  },
});

const heritageSlice = createSlice({
  name: 'heritage',
  initialState: { favorites: ['modhera-sun-temple'], trail: [] },
  reducers: {
    setFavorites: (state, action) => { state.favorites = action.payload; },
    setTrail: (state, action) => { state.trail = action.payload; },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export const { setFavorites, setTrail } = heritageSlice.actions;

export const store = configureStore({
  reducer: { user: userSlice.reducer, heritage: heritageSlice.reducer },
});

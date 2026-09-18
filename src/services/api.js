import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
export const api = axios.create({ baseURL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('@heritage_explorer/token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const apiMessage = error => error?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export { API_BASE_URL } from '../config/api';
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('@heritage_explorer/token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const apiMessage = error => error?.response?.data?.message || 'Something went wrong. Please try again.';
export default api;

import { Platform } from 'react-native';

// Android emulator: 10.0.2.2 points to this computer. For a physical device,
// replace the Android URL with your computer's LAN address, e.g. 192.168.1.20.
const host = Platform.OS === 'android' ? '10.0.2.2:5000' : 'localhost:5000';
export const API_BASE_URL = `http://${host}/api`;

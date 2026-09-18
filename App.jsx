import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { HeritageProvider } from './src/context/HeritageContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <Provider store={store}><SafeAreaView style={styles.safeArea}><StatusBar barStyle="dark-content" backgroundColor="#F7EFE6" /><AuthProvider><HeritageProvider><AppNavigator /></HeritageProvider></AuthProvider></SafeAreaView></Provider>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F7EFE6' } });

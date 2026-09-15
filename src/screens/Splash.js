import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HeritageLogo from '../components/HeritageLogo';

export default function SplashScreen() {
  return <View style={styles.screen}><HeritageLogo size={96} /><Text style={styles.loading}>Preparing your journey…</Text></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7EFE6' }, loading: { marginTop: 28, color: '#8B4A24', fontWeight: '700' } });

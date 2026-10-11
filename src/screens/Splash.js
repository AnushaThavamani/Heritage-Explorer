import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HeritageLogo from '../components/HeritageLogo';

export default function SplashScreen() {
  return (
    <View style={styles.screen}>
      <HeritageLogo size={96} />
      <Text style={styles.title}>Heritage Explorer</Text>
      <Text style={styles.subtitle}>Discover the Heritage of Tamil Nadu</Text>
      <Text style={styles.loading}>Preparing your journey…</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7EFE6', paddingHorizontal: 24 },
  title: { marginTop: 20, fontSize: 26, fontWeight: '800', color: '#3A1F18', letterSpacing: 0.5 },
  subtitle: { marginTop: 6, fontSize: 14, fontWeight: '600', color: '#A0522D', letterSpacing: 0.3 },
  loading: { marginTop: 24, color: '#8A7161', fontWeight: '600', fontSize: 13 }
});

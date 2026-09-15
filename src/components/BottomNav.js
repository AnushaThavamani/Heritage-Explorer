import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHeritage } from '../context/HeritageContext';

const tabs = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'explore', label: 'Explore', icon: '⌕' },
  { key: 'trail', label: 'Trail', icon: '⌁' },
  { key: 'profile', label: 'Profile', icon: '◉' },
];

export default function BottomNav({ active, onChange }) {
  const { favorites } = useHeritage();
  return (
    <View style={styles.bar}>
      {tabs.map(tab => (
        <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
          <View>
            <Text style={[styles.icon, active === tab.key && styles.activeText]}>{tab.icon}</Text>
            {tab.key === 'trail' && favorites.length ? <View style={styles.badge}><Text style={styles.badgeText}>{favorites.length}</Text></View> : null}
          </View>
          <Text style={[styles.label, active === tab.key && styles.activeText]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#FFFDF9', borderTopWidth: 1, borderColor: '#EADCCE', paddingVertical: 8, elevation: 12 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  icon: { color: '#8A7161', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  label: { color: '#8A7161', fontSize: 10, fontWeight: '700', marginTop: 2 },
  activeText: { color: '#B9572B' },
  badge: { position: 'absolute', right: -9, top: -4, backgroundColor: '#B9572B', minWidth: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import HeritageImage from './HeritageImage';
import { useHeritage } from '../context/HeritageContext';

export default function SiteCard({ site, onPress, compact = false }) {
  const { favorites, visited, toggleFavorite } = useHeritage();
  const saved = favorites.includes(site.id);
  return (
    <Pressable style={[styles.card, compact && styles.compact]} onPress={() => onPress(site)}>
      <HeritageImage uri={site.image} style={styles.image} accessibilityLabel={site.name} />
      <View style={styles.body}>
        <View style={styles.topRow}><Text numberOfLines={2} style={styles.name}>{site.name}</Text><Pressable hitSlop={8} onPress={() => toggleFavorite(site.id)}><Text style={styles.heart}>{saved ? '♥' : '♡'}</Text></Pressable></View>
        <Text numberOfLines={1} style={styles.location}>⌖ {site.location}</Text>
        <Text numberOfLines={1} style={styles.district}>District: {site.district || site.city}</Text>
        <View style={styles.badges}><Text style={styles.category}>{site.category}</Text>{visited.some(visit => visit.id === site.id) ? <Text style={styles.visited}>Visited</Text> : null}</View>
        {!compact ? <Text numberOfLines={1} style={styles.timing}>◷ {site.timings}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', backgroundColor: '#FFF', marginBottom: 14, borderRadius: 16, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, compact: { width: 220, marginRight: 12 },
  image: { width: '100%', height: 120 }, body: { padding: 10 }, topRow: { flexDirection: 'row', alignItems: 'flex-start' }, name: { flex: 1, color: '#4B2E23', fontWeight: '900', fontSize: 13, lineHeight: 18 }, heart: { fontSize: 22, lineHeight: 20, color: '#B9572B', marginLeft: 5 }, location: { color: '#6F594A', fontSize: 11, marginTop: 6 }, district: { color: '#8A7161', fontSize: 10, marginTop: 3 }, badges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, category: { color: '#8B4A24', fontSize: 10, fontWeight: '800', marginTop: 7, textTransform: 'uppercase' }, visited: { color: '#23805D', fontSize: 10, fontWeight: '900', marginTop: 7 }, timing: { color: '#6F594A', fontSize: 10, marginTop: 4 },
});

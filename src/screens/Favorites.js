import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import SiteCard from '../components/SiteCard';
import { useHeritage } from '../context/HeritageContext';

export default function FavoritesScreen({ onBack, onOpenDetails, onOpenTrail }) {
  const { sites, favorites } = useHeritage();
  const saved = sites.filter(site => favorites.includes(site.id));
  return <ScrollView contentContainerStyle={styles.screen}>{onBack ? <Pressable onPress={onBack}><Text style={styles.back}>← Back to home</Text></Pressable> : null}<Text style={styles.title}>My favourites</Text><Text style={styles.subtitle}>{saved.length} bookmarked heritage sites</Text>{saved.length ? <View style={styles.grid}>{saved.map(site => <SiteCard key={site.id} site={site} onPress={onOpenDetails} />)}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>Your saved list is empty</Text><Text style={styles.emptyText}>Tap the heart on any monument to save it here.</Text></View>}<PrimaryButton onPress={onOpenTrail} style={styles.button}>View Trail</PrimaryButton></ScrollView>;
}
const styles = StyleSheet.create({ screen: { flexGrow: 1, padding: 16, backgroundColor: '#F7EFE6' }, back: { color: '#4B2E23', fontWeight: '800' }, title: { color: '#4B2E23', fontSize: 27, fontWeight: '900', marginTop: 17 }, subtitle: { color: '#6F594A', marginTop: 5, marginBottom: 18 }, grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }, empty: { backgroundColor: '#FFF', borderRadius: 18, padding: 25, alignItems: 'center' }, emptyTitle: { color: '#4B2E23', fontWeight: '900', fontSize: 16 }, emptyText: { color: '#6F594A', textAlign: 'center', marginTop: 7 }, button: { marginTop: 20 } });

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';
import SiteCard from '../components/SiteCard';

const SEED_DATA = {
  "Tamil Nadu": ["Madurai", "Thanjavur", "Kancheepuram"],
  "Kerala": ["Thrissur", "Kozhikode", "Ernakulam"],
  "Karnataka": ["Mysuru", "Vijayanagara", "Dakshina Kannada"],
  "Maharashtra": ["Chhatrapati Sambhajinagar", "Pune", "Kolhapur"],
  "Andhra Pradesh": ["Anantapur", "Kurnool", "Visakhapatnam"]
};
const STATES = Object.keys(SEED_DATA);
const CATEGORIES = ['fort', 'palace', 'monument', 'temple', 'archaeological site', 'stone carving'];

export default function HomeScreen({ onOpenDetails }) {
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSites = React.useCallback(async () => {
    if (!selectedState || !selectedDistrict) return;
    setLoading(true);
    setError('');
    try {
      let url = `/heritage-sites?state=${selectedState}&district=${selectedDistrict}`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const response = await api.get(url);
      setSites(response.data.map(site => ({ ...site, id: site.siteId || site.id, title: site.title || site.name, image: site.image_url || site.image })));
    } catch (err) {
      setError('Failed to load heritage sites.');
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedCategory]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedDistrict(''); // Reset district
    setSites([]);
  };

  const chips = (items, selected, update, disabled = false) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {items.map(item => (
        <Pressable 
          key={item} 
          disabled={disabled}
          onPress={() => update(item === selected ? '' : item)} 
          style={[styles.chip, selected === item && styles.chipOn, disabled && styles.chipDisabled]}
        >
          <Text style={[styles.chipText, selected === item && styles.chipTextOn, disabled && styles.chipTextDisabled]}>
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const header = (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Location Browser</Text>
      <Text style={styles.subtitle}>Select a State</Text>
      {chips(STATES, selectedState, handleStateChange)}
      
      <Text style={[styles.subtitle, styles.marginTop10]}>Select a District</Text>
      {chips(
        selectedState ? SEED_DATA[selectedState] : [], 
        selectedDistrict, 
        setSelectedDistrict,
        !selectedState
      )}

      {selectedDistrict ? (
        <>
          <Text style={[styles.subtitle, styles.marginTop10]}>Filter by Category</Text>
          {chips(CATEGORIES, selectedCategory, setSelectedCategory)}
        </>
      ) : null}

      {!selectedState || !selectedDistrict ? (
        <View style={styles.prompt}>
          <Text style={styles.promptText}>Select a state and district to explore heritage sites.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sites}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={header}
        renderItem={({ item }) => <SiteCard site={item} onPress={onOpenDetails} />}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          selectedState && selectedDistrict && !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No sites found for this selection.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#B9572B" style={styles.footerLoader}/> : error ? <Text style={styles.error}>{error}</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7EFE6' },
  content: { padding: 16, paddingBottom: 28 },
  headerContainer: { marginBottom: 16 },
  title: { color: '#4B2E23', fontSize: 27, fontWeight: '900', marginBottom: 16 },
  subtitle: { color: '#8B4A24', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  marginTop10: { marginTop: 10 },
  chips: { paddingBottom: 8 },
  chip: { backgroundColor: '#FFF8F0', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 8, marginRight: 8 },
  chipOn: { backgroundColor: '#B9572B', borderColor: '#B9572B' },
  chipDisabled: { opacity: 0.5 },
  chipText: { color: '#6F594A', fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#FFF' },
  chipTextDisabled: { color: '#A0A0A0' },
  prompt: { marginTop: 40, alignItems: 'center' },
  promptText: { color: '#6F594A', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: 20, alignItems: 'center' },
  emptyText: { color: '#6F594A', fontSize: 14 },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
  footerLoader: { marginTop: 20 }
});

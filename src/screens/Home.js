import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';
import SiteCard from '../components/SiteCard';

const SEED_DATA = {
  "Tamil Nadu": [
    "Madurai",
    "Vellore",
    "Thanjavur",
    "Kancheepuram",
    "Coimbatore",
    "Ramanathapuram",
    "Thoothukudi",
    "Tiruchirappalli",
    "Kanyakumari",
    "Pudukkottai"
  ]
};
const STATES = Object.keys(SEED_DATA);

export default function HomeScreen({ onOpenDetails }) {
  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isDistrictDropdownOpen, setDistrictDropdownOpen] = useState(false);
  
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSites = React.useCallback(async () => {
    if (!selectedState || !selectedDistrict) return;
    setLoading(true);
    setError('');
    try {
      const url = `/heritage-sites?state=${selectedState}&district=${selectedDistrict}`;
      const response = await api.get(url);
      setSites(response.data.map(site => ({ ...site, id: site.siteId || site.id, title: site.title || site.name, image: site.image_url || site.image })));
    } catch (err) {
      setError('Failed to load heritage sites.');
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const header = (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Location Browser</Text>
      
      <Text style={[styles.subtitle, styles.marginTop10]}>Select a District (Tamil Nadu)</Text>
      <Pressable 
        style={styles.dropdownHeader} 
        onPress={() => setDistrictDropdownOpen(!isDistrictDropdownOpen)}
      >
        <Text style={styles.dropdownHeaderText}>{selectedDistrict || "Choose a District..."}</Text>
        <Text style={styles.dropdownIcon}>{isDistrictDropdownOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isDistrictDropdownOpen && (
        <View style={styles.dropdownList}>
          {SEED_DATA['Tamil Nadu'].map(dist => (
            <Pressable 
              key={dist} 
              style={[styles.dropdownItem, selectedDistrict === dist && styles.dropdownItemActive]}
              onPress={() => {
                setSelectedDistrict(dist);
                setDistrictDropdownOpen(false);
              }}
            >
              <Text style={[styles.dropdownItemText, selectedDistrict === dist && styles.dropdownItemTextActive]}>{dist}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {!selectedDistrict ? (
        <View style={styles.prompt}>
          <Text style={styles.promptText}>Select a district to explore heritage sites.</Text>
        </View>
      ) : null}
    </View>
  );

  const renderGroupedSites = () => {
    const grouped = sites.reduce((acc, site) => {
      const cat = site.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(site);
      return acc;
    }, {});

    return Object.entries(grouped).map(([category, catSites]) => (
      <View key={category} style={styles.categorySection}>
        <Text style={styles.categoryHeader}>{category}</Text>
        <View style={styles.gridRowWrap}>
          {catSites.map(site => (
            <SiteCard key={site.id} site={site} onPress={onOpenDetails} />
          ))}
        </View>
      </View>
    ));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {header}
      
      {loading ? (
        <ActivityIndicator size="large" color="#B9572B" style={styles.footerLoader}/>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : selectedState && selectedDistrict && sites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sites found for this selection.</Text>
        </View>
      ) : (
        renderGroupedSites()
      )}
    </ScrollView>
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
  dropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  dropdownHeaderText: { color: '#4B2E23', fontSize: 16, fontWeight: '600' },
  dropdownIcon: { color: '#8B4A24', fontSize: 14 },
  dropdownList: { backgroundColor: '#FFF', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7EFE6' },
  dropdownItemActive: { backgroundColor: '#B9572B' },
  dropdownItemText: { color: '#6F594A', fontSize: 15, fontWeight: '500' },
  dropdownItemTextActive: { color: '#FFF', fontWeight: '700' },
  prompt: { marginTop: 40, alignItems: 'center' },
  promptText: { color: '#6F594A', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  categorySection: { marginTop: 10, marginBottom: 10 },
  categoryHeader: { color: '#4B2E23', fontSize: 16, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  gridRowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: 20, alignItems: 'center' },
  emptyText: { color: '#6F594A', fontSize: 14 },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
  footerLoader: { marginTop: 20 }
});

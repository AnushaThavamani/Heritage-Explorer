import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';
import SiteCard from '../components/SiteCard';

const CATEGORIES = ['fort', 'palace', 'monument', 'temple', 'archaeological site', 'stone carving'];
const LIMIT = 10;

export default function ExploreScreen({ onOpenDetails }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchExploreSites = React.useCallback(async (isLoadMore = false) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      let url = `/heritage-sites/explore?limit=${LIMIT}`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      const response = await api.get(url);
      const newSites = response.data.map(site => ({ ...site, id: site.siteId || site.id, title: site.title || site.name, image: site.image_url || site.image }));
      
      if (isLoadMore) {
        setSites(prev => [...prev, ...newSites]);
      } else {
        setSites(newSites);
      }
    } catch (err) {
      setError('Failed to load discovery feed.');
    } finally {
      setLoading(false);
    }
  }, [loading, selectedCategory]);

  useEffect(() => {
    fetchExploreSites(false);
  }, [fetchExploreSites]);

  const handleLoadMore = () => {
    fetchExploreSites(true);
  };

  const chips = (items, selected, update) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {items.map(item => (
        <Pressable 
          key={item} 
          onPress={() => update(item === selected ? '' : item)} 
          style={[styles.chip, selected === item && styles.chipOn]}
        >
          <Text style={[styles.chipText, selected === item && styles.chipTextOn]}>
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const header = (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Global Explorer</Text>
      <Text style={styles.subtitle}>Discover heritage randomly from all around.</Text>
      <View style={styles.chipsContainer}>
        {chips(CATEGORIES, selectedCategory, setSelectedCategory)}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sites}
        keyExtractor={(item, index) => `${item.id}-${index}`} // random may return same item on infinite scroll
        numColumns={2}
        ListHeaderComponent={header}
        renderItem={({ item }) => <SiteCard site={item} onPress={onOpenDetails} />}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No sites found for this category.</Text>
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
  title: { color: '#4B2E23', fontSize: 27, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#6F594A', fontSize: 14, fontWeight: '600' },
  chipsContainer: { marginTop: 10 },
  chips: { paddingBottom: 8 },
  chip: { backgroundColor: '#FFF8F0', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 8, marginRight: 8 },
  chipOn: { backgroundColor: '#B9572B', borderColor: '#B9572B' },
  chipText: { color: '#6F594A', fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#FFF' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#6F594A', fontSize: 14 },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
  footerLoader: { marginVertical: 20 }
});

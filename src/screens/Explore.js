import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import api from '../services/api';
import SiteCard from '../components/SiteCard';
import { EXPLORE_CATEGORIES } from '../data/categories';

const LIMIT = 10;

export default function ExploreScreen({ onOpenDetails }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Race condition guard: ignore stale async responses
  const activeRequestId = useRef(0);

  const fetchExploreSites = useCallback(async (isLoadMore = false) => {
    const requestId = ++activeRequestId.current;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError('');
    }

    try {
      let url = `/heritage-sites/explore?limit=${LIMIT}`;
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const response = await api.get(url);

      if (requestId === activeRequestId.current) {
        const rawList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const newSites = rawList.map(site => ({
          ...site,
          id: site.siteId || site.id,
          title: site.title || site.name,
          image: site.image_url || site.image
        }));

        if (isLoadMore) {
          // Deduplicate by site ID
          setSites(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const uniqueIncoming = newSites.filter(s => !existingIds.has(s.id));
            return [...prev, ...uniqueIncoming];
          });
        } else {
          setSites(newSites);
        }
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        setError('Failed to load discovery feed. Tap retry below.');
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchExploreSites(false);
  }, [fetchExploreSites]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && sites.length >= LIMIT) {
      fetchExploreSites(true);
    }
  };

  const header = (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Heritage Discovery Feed</Text>
      <Text style={styles.subtitle}>Discover ancient monuments, rock-cut shrines, and archaeological wonders across Tamil Nadu.</Text>
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {EXPLORE_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id || 'all'}
                onPress={() => setSelectedCategory(isSelected ? '' : cat.id)}
                style={[styles.chip, isSelected && styles.chipOn]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextOn]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sites}
        keyExtractor={item => String(item.siteId || item.id)}
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
              {error ? (
                <>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable style={styles.retryButton} onPress={() => fetchExploreSites(false)}>
                    <Text style={styles.retryButtonText}>↻ Retry</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.emptyIcon}>🏛</Text>
                  <Text style={styles.emptyTitle}>No sites found for this category</Text>
                  <Text style={styles.emptySubtitle}>Try switching to another category or view all.</Text>
                  {selectedCategory ? (
                    <Pressable style={styles.clearButton} onPress={() => setSelectedCategory('')}>
                      <Text style={styles.clearButtonText}>View All</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoaderWrap}>
              <ActivityIndicator size="small" color="#B9572B" />
              <Text style={styles.footerLoaderText}>Loading more discoveries...</Text>
            </View>
          ) : loading && sites.length === 0 ? (
            <ActivityIndicator size="large" color="#B9572B" style={styles.footerLoader} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7EFE6' },
  content: { padding: 16, paddingBottom: 28 },
  headerContainer: { marginBottom: 16 },
  title: { color: '#4B2E23', fontSize: 27, fontWeight: '900', marginBottom: 4 },
  subtitle: { color: '#8A7161', fontSize: 13, fontWeight: '600' },
  chipsContainer: { marginTop: 12 },
  chips: { paddingBottom: 8 },
  chip: { backgroundColor: '#FFF', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 8, marginRight: 8 },
  chipOn: { backgroundColor: '#B9572B', borderColor: '#B9572B' },
  chipText: { color: '#6F594A', fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#FFF', fontWeight: '800' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: '#4B2E23', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  emptySubtitle: { color: '#8A7161', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  clearButton: { borderWidth: 1, borderColor: '#B9572B', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  clearButtonText: { color: '#B9572B', fontWeight: '700', fontSize: 12 },
  errorText: { color: '#B23B2B', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#B9572B', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  retryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  footerLoader: { marginVertical: 30 },
  footerLoaderWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  footerLoaderText: { color: '#8A7161', fontSize: 12, marginLeft: 8, fontWeight: '600' }
});

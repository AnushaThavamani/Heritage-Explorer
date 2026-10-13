import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TextInput,
  Platform
} from 'react-native';
import api from '../services/api';
import SiteCard from '../components/SiteCard';
import { TAMIL_NADU_DISTRICTS } from '../data/districts';
import { HERITAGE_CATEGORIES } from '../data/categories';
import { normalizeImageUrl } from '../utils/imageUtils';

const REGIONS = ['All', 'North', 'Central', 'West', 'South'];

export default function HomeScreen({ onOpenDetails, onOpenFavorites }) {
  const [selectedDistrict, setSelectedDistrict] = useState('Madurai');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [districtSearch, setDistrictSearch] = useState('');
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Race condition guard & abort tracking
  const activeRequestId = useRef(0);

  // Debounce search input by 300ms to eliminate UI stutter & request spam
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSites = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.append('state', 'Tamil Nadu');

      if (selectedDistrict) {
        params.append('district', selectedDistrict);
      }
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      if (debouncedSearch) {
        params.append('q', debouncedSearch);
      }

      const response = await api.get(`/heritage-sites?${params.toString()}`);

      if (requestId === activeRequestId.current) {
        const rawList = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const formatted = rawList.map(site => ({
          ...site,
          id: site.siteId || site.id,
          title: site.title || site.name,
          image_url: normalizeImageUrl(site.image_url || site.image),
          image: normalizeImageUrl(site.image_url || site.image),
        }));
        setSites(formatted);
      }
    } catch (err) {
      if (requestId === activeRequestId.current) {
        setError('Failed to load heritage sites. Check connection and retry.');
      }
    } finally {
      if (requestId === activeRequestId.current) {
        setLoading(false);
      }
    }
  }, [selectedDistrict, selectedCategory, debouncedSearch]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Filter districts based on region and search query
  const filteredDistricts = useMemo(() => {
    return TAMIL_NADU_DISTRICTS.filter(d => {
      const matchesRegion = selectedRegion === 'All' || d.region.toLowerCase() === selectedRegion.toLowerCase();
      const matchesSearch = !districtSearch.trim() || d.name.toLowerCase().includes(districtSearch.trim().toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, districtSearch]);

  const displayedDistricts = useMemo(() => {
    if (showAllDistricts || districtSearch.trim().length > 0) {
      return filteredDistricts;
    }
    return filteredDistricts.slice(0, 8);
  }, [filteredDistricts, showAllDistricts, districtSearch]);

  // Header component containing search, district grid, and category chips
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. App Identity & Header */}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Heritage Explorer</Text>
          <Text style={styles.tagline}>Discover the Heritage of Tamil Nadu</Text>
        </View>
        {onOpenFavorites ? (
          <Pressable style={styles.favBadge} onPress={onOpenFavorites} accessibilityRole="button" accessibilityLabel="Saved Favorites">
            <Text style={styles.favBadgeText}>♥ Saved</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.leadDescription}>
        Journey through ancient temples, forgotten caves, mighty forts, royal palaces, stone inscriptions, and archaeological wonders that preserve the stories of Tamil Nadu.
      </Text>

      {/* 2. Global Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search sites, monuments, temples, inscriptions..."
          placeholderTextColor="#8A7161"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <Pressable hitSlop={8} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 3. Searchable District Discovery Grid */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Explore Heritage Across Tamil Nadu</Text>
        <Text style={styles.districtCountBadge}>38 Districts</Text>
      </View>

      {/* Region Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionTabs}>
        {REGIONS.map(reg => {
          const isRegSelected = selectedRegion === reg;
          return (
            <Pressable
              key={reg}
              style={[styles.regionTab, isRegSelected && styles.regionTabActive]}
              onPress={() => setSelectedRegion(reg)}
            >
              <Text style={[styles.regionTabText, isRegSelected && styles.regionTabTextActive]}>
                {reg}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* District Quick Search Input */}
      <View style={styles.districtSearchBox}>
        <Text style={styles.districtSearchIcon}>⚐</Text>
        <TextInput
          style={styles.districtSearchInput}
          placeholder="Filter district by name (e.g. Madurai, Thanjavur)..."
          placeholderTextColor="#9A8272"
          value={districtSearch}
          onChangeText={setDistrictSearch}
        />
        {districtSearch ? (
          <Pressable hitSlop={8} onPress={() => setDistrictSearch('')}>
            <Text style={styles.clearIconSmall}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Active District Banner if one is selected */}
      {selectedDistrict ? (
        <View style={styles.selectedDistrictBanner}>
          <View style={styles.selectedDistrictInfo}>
            <Text style={styles.selectedDistrictIcon}>📍</Text>
            <Text style={styles.selectedDistrictText}>
              Viewing <Text style={styles.selectedDistrictBold}>{selectedDistrict}</Text> District
            </Text>
          </View>
          <Pressable style={styles.clearDistrictBtn} onPress={() => setSelectedDistrict('')}>
            <Text style={styles.clearDistrictBtnText}>Show All Districts ✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Searchable District Card Grid */}
      <View style={styles.districtGrid}>
        {displayedDistricts.map(dist => {
          const isDistActive = selectedDistrict === dist.name;
          return (
            <Pressable
              key={dist.id}
              style={[styles.districtCard, isDistActive && styles.districtCardActive]}
              onPress={() => setSelectedDistrict(isDistActive ? '' : dist.name)}
            >
              <View style={styles.districtCardTop}>
                <Text numberOfLines={1} style={[styles.districtName, isDistActive && styles.districtNameActive]}>
                  {dist.name}
                </Text>
                <Text style={[styles.districtRegion, isDistActive && styles.districtRegionActive]}>
                  {dist.region}
                </Text>
              </View>
              <View style={styles.districtCardBottom}>
                <Text style={[styles.districtSiteTag, isDistActive && styles.districtSiteTagActive]}>
                  {isDistActive ? '✓ Selected' : '6+ Sites'}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {filteredDistricts.length === 0 && (
          <View style={styles.noDistrictsFound}>
            <Text style={styles.noDistrictsText}>No district matching "{districtSearch}"</Text>
          </View>
        )}
      </View>

      {/* Toggle Expand / Collapse All 38 Districts */}
      {!districtSearch.trim() && (
        <Pressable
          style={styles.expandDistrictsBtn}
          onPress={() => setShowAllDistricts(!showAllDistricts)}
        >
          <Text style={styles.expandDistrictsText}>
            {showAllDistricts ? '▲ Show Fewer Districts' : `▼ View All ${filteredDistricts.length} Districts`}
          </Text>
        </Pressable>
      )}

      {/* 4. Category Filter Chips */}
      <Text style={[styles.sectionLabel, styles.marginTop16]}>Explore by Heritage Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {HERITAGE_CATEGORIES.map(cat => {
          const isCatSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id || 'all'}
              onPress={() => setSelectedCategory(isCatSelected ? '' : cat.id)}
              style={[styles.chip, isCatSelected && styles.chipOn]}
            >
              <Text style={[styles.chipText, isCatSelected && styles.chipTextOn]}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 5. Stories Etched in Stone section header */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.feedTitle}>Stories Etched in Stone</Text>
        <Text style={styles.feedCountBadge}>{sites.length} Sites</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={sites}
        keyExtractor={item => String(item.siteId || item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRowWrap}
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <SiteCard site={item} onPress={onOpenDetails} />
        )}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#B9572B" />
              <Text style={styles.loaderText}>Loading verified heritage sites...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={fetchSites}>
                <Text style={styles.retryButtonText}>↻ Retry</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏛</Text>
              <Text style={styles.emptyTitle}>
                {debouncedSearch
                  ? `No heritage sites matching "${debouncedSearch}"`
                  : selectedDistrict
                  ? `No sites found for ${selectedDistrict}`
                  : 'No matching heritage sites'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Try clearing your search terms or category filters to explore more of Tamil Nadu's rich archaeological heritage.
              </Text>
              {(selectedCategory || debouncedSearch || selectedDistrict) ? (
                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSelectedCategory('');
                    setSearchQuery('');
                    setSelectedDistrict('');
                  }}
                >
                  <Text style={styles.clearFiltersText}>Reset All Filters</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7EFE6' },
  content: { padding: 16, paddingBottom: 36 },
  headerContainer: { marginBottom: 8 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  titleBlock: { flex: 1, marginRight: 12 },
  title: { color: '#3A1F18', fontSize: 26, fontWeight: '900', letterSpacing: 0.3 },
  tagline: { color: '#B9572B', fontSize: 14, fontWeight: '800', marginTop: 2, letterSpacing: 0.2 },
  favBadge: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: '#E8D6C3', elevation: 1 },
  favBadgeText: { color: '#B9572B', fontWeight: '800', fontSize: 12 },

  leadDescription: { color: '#6F594A', fontSize: 13, lineHeight: 18, marginBottom: 14 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E8D6C3', paddingHorizontal: 14, height: 46, marginBottom: 16, elevation: 1 },
  searchIcon: { fontSize: 18, color: '#8A7161', marginRight: 10 },
  searchInput: { flex: 1, color: '#3A1F18', fontSize: 14, paddingVertical: 4 },
  clearIcon: { fontSize: 15, color: '#8A7161', padding: 4 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { color: '#8B4A24', fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  districtCountBadge: { color: '#8A7161', fontSize: 11, fontWeight: '700', backgroundColor: '#EDE0D2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  marginTop16: { marginTop: 16, marginBottom: 8 },

  regionTabs: { flexDirection: 'row', paddingVertical: 4, marginBottom: 10 },
  regionTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E8D6C3', marginRight: 8 },
  regionTabActive: { backgroundColor: '#3A1F18', borderColor: '#3A1F18' },
  regionTabText: { color: '#6F594A', fontSize: 12, fontWeight: '700' },
  regionTabTextActive: { color: '#FFF', fontWeight: '800' },

  districtSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8D6C3', paddingHorizontal: 12, height: 38, marginBottom: 10 },
  districtSearchIcon: { fontSize: 13, color: '#8A7161', marginRight: 8 },
  districtSearchInput: { flex: 1, color: '#3A1F18', fontSize: 12, paddingVertical: 2 },
  clearIconSmall: { fontSize: 12, color: '#8A7161', padding: 4 },

  selectedDistrictBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAD7C5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  selectedDistrictInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  selectedDistrictIcon: { fontSize: 14, marginRight: 6 },
  selectedDistrictText: { color: '#4B2E23', fontSize: 12, fontWeight: '600' },
  selectedDistrictBold: { fontWeight: '800', color: '#B9572B' },
  clearDistrictBtn: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#D3BDAA' },
  clearDistrictBtnText: { color: '#8B4A24', fontSize: 11, fontWeight: '700' },

  districtGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 6 },
  districtCard: { width: '48.5%', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8D6C3', padding: 10, marginBottom: 8, elevation: 1 },
  districtCardActive: { backgroundColor: '#B9572B', borderColor: '#B9572B' },
  districtCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  districtName: { color: '#3A1F18', fontSize: 13, fontWeight: '800', flex: 1, marginRight: 4 },
  districtNameActive: { color: '#FFF' },
  districtRegion: { color: '#8A7161', fontSize: 10, fontWeight: '600', backgroundColor: '#F5ECE3', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  districtRegionActive: { color: '#FFEBD9', backgroundColor: 'rgba(0,0,0,0.18)' },
  districtCardBottom: { marginTop: 2 },
  districtSiteTag: { color: '#8B4A24', fontSize: 11, fontWeight: '700' },
  districtSiteTagActive: { color: '#FFF', fontWeight: '800' },

  noDistrictsFound: { width: '100%', paddingVertical: 16, alignItems: 'center' },
  noDistrictsText: { color: '#8A7161', fontSize: 12, fontStyle: 'italic' },

  expandDistrictsBtn: { alignItems: 'center', paddingVertical: 8, backgroundColor: '#EDE0D2', borderRadius: 10, marginBottom: 4 },
  expandDistrictsText: { color: '#8B4A24', fontSize: 12, fontWeight: '800' },

  chips: { paddingVertical: 4 },
  chip: { backgroundColor: '#FFF', borderColor: '#E8D6C3', borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7, marginRight: 8 },
  chipOn: { backgroundColor: '#B9572B', borderColor: '#B9572B' },
  chipText: { color: '#6F594A', fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#FFF' },

  feedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12, borderTopWidth: 1, borderTopColor: '#E8D6C3', paddingTop: 14 },
  feedTitle: { color: '#3A1F18', fontSize: 17, fontWeight: '900', letterSpacing: 0.4 },
  feedCountBadge: { color: '#8B4A24', fontSize: 12, fontWeight: '800', backgroundColor: '#EDE0D2', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },

  gridRowWrap: { flexDirection: 'row', justifyContent: 'space-between' },

  loaderContainer: { alignItems: 'center', paddingVertical: 40 },
  loaderText: { color: '#8A7161', fontSize: 13, marginTop: 10, fontWeight: '600' },

  errorContainer: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 12 },
  errorText: { color: '#B23B2B', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#B9572B', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  retryButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  emptyContainer: { alignItems: 'center', paddingVertical: 35, paddingHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, marginTop: 12 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: '#3A1F18', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  emptySubtitle: { color: '#8A7161', fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 14 },
  clearFiltersButton: { borderWidth: 1, borderColor: '#B9572B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFF' },
  clearFiltersText: { color: '#B9572B', fontWeight: '800', fontSize: 12 }
});

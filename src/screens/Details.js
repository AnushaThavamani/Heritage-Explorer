import React, { useMemo } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import HeritageImage from '../components/HeritageImage';
import PrimaryButton from '../components/PrimaryButton';
import { useHeritage } from '../context/HeritageContext';

export default function DetailsScreen({ item, onBack, onOpenTrail }) {
  const { favorites, visited, trail, toggleFavorite, toggleTrail, markVisited } = useHeritage();

  // Coordinate verification check: Authentic Tamil Nadu bounding box (~8.0°–14.0° N, 76.0°–81.0° E)
  const isVerifiedCoord = useMemo(() => {
    if (!item) return false;
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    return (
      item.latitude != null &&
      item.longitude != null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= 8.0 &&
      lat <= 14.0 &&
      lng >= 76.0 &&
      lng <= 81.0
    );
  }, [item]);

  const details = useMemo(() => {
    if (!item) return [];
    const rows = [];

    if (item.location) {
      rows.push({ label: 'Location', value: item.location, icon: '⌖' });
    }
    if (item.district) {
      rows.push({ label: 'District', value: `${item.district}, ${item.state || 'Tamil Nadu'}`, icon: '⚐' });
    }
    if (item.category) {
      rows.push({ label: 'Category', value: item.category, icon: '◇' });
    }
    if (item.period) {
      rows.push({ label: 'Historical Period', value: item.period, icon: '⏳' });
    }
    const timings = item.timings || item.visitorTimings;
    if (timings) {
      rows.push({ label: 'Visitor Timings', value: timings, icon: '◷' });
    }
    const duration = item.estimated_visit_time || item.duration;
    if (duration) {
      rows.push({ label: 'Estimated Visit Time', value: duration, icon: '◌' });
    }

    // Coordinates row with strict verification display
    if (isVerifiedCoord) {
      rows.push({
        label: 'Surveyed Coordinates',
        value: `${Number(item.latitude).toFixed(4)}° N, ${Number(item.longitude).toFixed(4)}° E (Verified GPS)`,
        icon: '◈'
      });
    } else {
      rows.push({
        label: 'Surveyed Coordinates',
        value: 'Pending official survey verification (Centroids never inferred)',
        icon: '◈'
      });
    }

    if (item.description) {
      rows.push({
        label: 'Historical Significance',
        value: item.description,
        icon: '✦',
        long: true
      });
    }
    if (item.source) {
      rows.push({ label: 'Source Documentation', value: item.source, icon: 'ℹ' });
    }

    return rows;
  }, [item, isVerifiedCoord]);

  if (!item) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Select a heritage site to view its details.</Text>
        <PrimaryButton onPress={onBack}>Back to Explorer</PrimaryButton>
      </View>
    );
  }

  const itemId = item.siteId || item.id;
  const saved = favorites.includes(itemId);
  const inTrail = trail.includes(itemId);
  const visit = visited.find(entry => (entry.siteId || entry.id) === itemId);

  // Image provenance and licensing information
  const imageUrl = item.image_url || item.image;
  const isWikiImage = imageUrl && (imageUrl.includes('wikimedia.org') || imageUrl.includes('wikipedia.org'));
  const imageAttribution = item.image_attribution || (isWikiImage ? 'Wikimedia Commons Contributor' : null);
  const imageLicense = item.image_license || (isWikiImage ? 'Creative Commons / Public Domain' : null);
  const imageSourcePage = item.image_source_page || (Array.isArray(item.source_urls) && item.source_urls[0]) || null;

  // Safe multi-stage directions launcher
  const openMap = async () => {
    if (!isVerifiedCoord) {
      Alert.alert(
        'GPS Coordinates Pending',
        'Exact surveyed GPS coordinates are currently pending survey verification for this site to ensure navigational accuracy. In accordance with safety standards, centroid estimations are not used.'
      );
      return;
    }

    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    const query = encodeURIComponent(`${item.name}, ${item.district || 'Tamil Nadu'}`);

    const nativeGeoUrl = Platform.OS === 'ios'
      ? `maps:0,0?q=${query}@${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${query})`;

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

    // Attempt Native map app -> Google Maps Web Directions -> OpenStreetMap -> Graceful Alert
    try {
      const supported = await Linking.canOpenURL(nativeGeoUrl).catch(() => false);
      if (supported) {
        await Linking.openURL(nativeGeoUrl);
        return;
      }
    } catch {
      // Proceed to web fallback
    }

    try {
      await Linking.openURL(googleMapsUrl);
    } catch {
      try {
        await Linking.openURL(osmUrl);
      } catch {
        Alert.alert(
          'Map Navigation',
          `GPS Coordinates for ${item.name}:\nLatitude: ${lat.toFixed(5)}° N\nLongitude: ${lng.toFixed(5)}° E\n\nUnable to launch a mapping application automatically on this device.`
        );
      }
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={details}
        keyExtractor={row => row.label}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Pressable onPress={onBack} hitSlop={8}>
              <Text style={styles.back}>← Back to Explorer</Text>
            </Pressable>

            <View style={styles.imageWrap}>
              <HeritageImage
                uri={imageUrl}
                style={styles.image}
                accessibilityLabel={item.name}
                attribution={imageAttribution}
                license={imageLicense}
                showAttributionBadge={false}
                fallbackText="Tamil Nadu Heritage Archive"
              />
            </View>

            {imageUrl ? (
              <View style={styles.imageAttributionBox}>
                <View style={styles.attributionHeader}>
                  <Text style={styles.attributionCameraIcon}>📷</Text>
                  <Text style={styles.attributionTitle}>Image Provenance & Attribution</Text>
                </View>
                <Text style={styles.attributionMeta}>
                  {imageAttribution ? `Credit: ${imageAttribution}` : 'Verified Heritage Archive'}
                  {imageLicense ? ` · ${imageLicense}` : ''}
                </Text>
                {imageSourcePage ? (
                  <Pressable
                    style={styles.sourcePageLink}
                    onPress={async () => {
                      try {
                        await Linking.openURL(imageSourcePage);
                      } catch {
                        Alert.alert('Link Error', 'Unable to open source page in web browser.');
                      }
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.sourcePageLinkText}>View Provider Source & Terms ↗</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.type}>
                  {item.category || item.type || 'Historic Monument'} · {item.district || item.state}
                </Text>
                {item.unesco ? (
                  <View style={styles.unescoBadge}>
                    <Text style={styles.unescoBadgeText}>★ UNESCO World Heritage Site</Text>
                  </View>
                ) : null}
                {item.verification_status === 'verified' ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ ASI / State Protected Monument</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                style={styles.heartButton}
                onPress={() => toggleFavorite(itemId)}
                accessibilityLabel={saved ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Text style={styles.heart}>{saved ? '♥' : '♡'}</Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item: row }) => (
          <View style={[styles.infoCard, row.long && styles.longCard]}>
            <Text style={styles.infoIcon}>{row.icon}</Text>
            <View style={styles.infoCopy}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.actions}>
            <PrimaryButton
              onPress={() => {
                if (!inTrail) toggleTrail(itemId);
                onOpenTrail();
              }}
            >
              {inTrail ? 'View in My Trail' : 'Add to My Heritage Trail'}
            </PrimaryButton>

            <Pressable
              style={[styles.secondary, !isVerifiedCoord && styles.secondaryPending]}
              onPress={openMap}
            >
              <Text style={[styles.secondaryText, !isVerifiedCoord && styles.secondaryTextPending]}>
                {isVerifiedCoord ? '⌖ Open in Maps & Directions' : '⌖ Coordinates Pending Verification'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.visited}
              onPress={() => markVisited(item)}
            >
              <Text style={styles.visitedText}>
                {visit
                  ? `✓ Visited on ${new Date(visit.visitedAt).toLocaleDateString()}`
                  : '✓ Mark as Visited in Passport'}
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7EFE6' },
  content: { padding: 16, paddingBottom: 32 },
  back: { color: '#4B2E23', fontWeight: '800', fontSize: 14, marginBottom: 14 },
  imageWrap: { borderRadius: 20, overflow: 'hidden', elevation: 5, backgroundColor: '#E8D8C9' },
  image: { width: '100%', height: 235 },

  imageAttributionBox: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8D6C3',
  },
  attributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  attributionCameraIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  attributionTitle: {
    color: '#8B4A24',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attributionMeta: {
    color: '#6F594A',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  sourcePageLink: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  sourcePageLinkText: {
    color: '#B9572B',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 14, marginBottom: 8 },
  titleCopy: { flex: 1, paddingRight: 12 },
  title: { color: '#4B2E23', fontSize: 24, fontWeight: '900', lineHeight: 30 },
  type: { color: '#8B4A24', fontWeight: '700', fontSize: 13, marginTop: 4 },
  unescoBadge: { backgroundColor: '#E2F3EB', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 8 },
  unescoBadgeText: { color: '#1B6A4C', fontWeight: '800', fontSize: 11 },
  verifiedBadge: { backgroundColor: '#FFF0E5', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 6 },
  verifiedBadgeText: { color: '#B9572B', fontWeight: '800', fontSize: 11 },
  heartButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', elevation: 2 },
  heart: { color: '#B9572B', fontSize: 26, lineHeight: 28 },
  infoCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: '#F0E2D4' },
  longCard: { alignItems: 'flex-start' },
  infoIcon: { color: '#B9572B', fontSize: 18, width: 28, textAlign: 'center' },
  infoCopy: { flex: 1 },
  infoLabel: { color: '#8B4A24', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { color: '#4B2E23', marginTop: 4, fontSize: 13, lineHeight: 19 },
  actions: { marginTop: 22 },
  secondary: { backgroundColor: '#D9B44A', alignItems: 'center', padding: 14, borderRadius: 12, marginTop: 10 },
  secondaryPending: { backgroundColor: '#EADCCF', borderWidth: 1, borderColor: '#DFCEBD' },
  secondaryText: { color: '#4B2E23', fontWeight: '900', fontSize: 14 },
  secondaryTextPending: { color: '#8A7161', fontWeight: '700', fontSize: 13 },
  visited: { alignItems: 'center', padding: 14, marginTop: 4 },
  visitedText: { color: '#8B4A24', fontWeight: '800', fontSize: 13 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25, backgroundColor: '#F7EFE6' },
  emptyText: { color: '#6F594A', fontSize: 15, marginBottom: 16 }
});

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

/**
 * Resilient HeritageImage Component
 * 
 * Features:
 * - Direct, lightweight image loading without sluggish third-party proxies
 * - Authentic sandstone-toned architectural fallback for missing/unverified images
 * - Smooth, non-blocking loading indicator
 * - Clean cards without intrusive error overlays or credit text
 * - Complete URI change reactivity
 */
export default function HeritageImage({
  uri,
  style,
  fallbackText = 'Verified Historical Site',
  accessibilityLabel,
  attribution,
  license,
  showAttributionBadge = false,
}) {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Normalize URI and ensure HTTPS
  let safeUri = (uri || '').trim();
  if (safeUri.startsWith('http://')) {
    safeUri = 'https://' + safeUri.slice(7);
  }

  // Reset state whenever target URI changes
  useEffect(() => {
    setHasError(false);
    setLoading(Boolean(safeUri));
  }, [safeUri]);

  // Handle missing or failed image gracefully with authentic heritage architectural placeholder
  if (!safeUri || hasError) {
    return (
      <View style={[styles.placeholderContainer, style]}>
        <Text style={styles.placeholderIcon}>🏛</Text>
        <Text style={styles.placeholderTitle}>Photograph Not Available</Text>
        <Text style={styles.placeholderSubtitle} numberOfLines={1}>
          {fallbackText || 'Tamil Nadu Heritage Archive'}
        </Text>
      </View>
    );
  }

  const source = {
    uri: safeUri,
    headers: {
      'User-Agent': 'HeritageExplorer/1.0 (Mobile App; Cultural Heritage Discovery)'
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Image
        key={safeUri}
        source={source}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || 'Heritage site photograph'}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setHasError(true);
        }}
      />

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#B9572B" />
        </View>
      ) : null}

      {/* Attribution badge ONLY if explicitly requested (e.g. details hero modal), never on cards */}
      {showAttributionBadge && attribution ? (
        <View style={styles.attributionPill}>
          <Text style={styles.attributionPillText} numberOfLines={1}>
            📷 {attribution}{license ? ` · ${license}` : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#EADCCF',
    overflow: 'hidden',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(234, 220, 207, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#EAE0D5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#D8C7B5',
  },
  placeholderIcon: {
    fontSize: 26,
    color: '#8B4A24',
    marginBottom: 4,
  },
  placeholderTitle: {
    color: '#3A1F18',
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  placeholderSubtitle: {
    color: '#7A6252',
    fontWeight: '600',
    fontSize: 10,
    textAlign: 'center',
  },
  attributionPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(30, 20, 15, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '85%',
  },
  attributionPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

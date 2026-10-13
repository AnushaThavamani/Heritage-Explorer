import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { normalizeImageUrl, buildProxyUrl } from '../utils/imageUtils';

/**
 * Resilient HeritageImage Component
 *
 * Features:
 * - Normalises Wikimedia thumb URLs → direct upload URLs (eliminates UTM/CORS issues)
 * - Two-stage loading: direct URL first, backend proxy fallback on failure
 * - Authentic sandstone-toned architectural placeholder for unavailable images
 * - Smooth, non-blocking loading indicator
 * - Full URI change reactivity with proper state reset
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
  // Stage 0 = direct URL, Stage 1 = proxy URL, Stage 2 = placeholder
  const [stage, setStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevUri = useRef(null);

  // Normalise the raw URI: convert wiki thumb → upload URL, strip UTM params, force HTTPS
  const directUri = normalizeImageUrl(uri);
  const proxyUri = directUri ? buildProxyUrl(directUri) : null;

  // Reset stage whenever the source URI changes
  useEffect(() => {
    if (prevUri.current !== (uri || '')) {
      prevUri.current = uri || '';
      setStage(0);
      setLoading(Boolean(directUri));
    }
  }, [uri, directUri]);

  // Determine whether to use proxy first (Wikimedia requires compliant backend User-Agent)
  const isWikimedia = Boolean(
    directUri && (directUri.includes('wikimedia.org') || directUri.includes('wikipedia.org'))
  );

  // Stage 0: preferred URL (proxy for wikimedia, direct otherwise)
  // Stage 1: fallback URL (direct for wikimedia, proxy otherwise)
  // Stage 2: placeholder
  const primaryUri = isWikimedia && proxyUri ? proxyUri : directUri;
  const secondaryUri = isWikimedia ? directUri : proxyUri;

  const effectiveUri = stage === 0 ? primaryUri : stage === 1 ? secondaryUri : null;

  // Handle unavailable image: show architectural placeholder
  if (!effectiveUri || stage >= 2) {
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

  const handleError = () => {
    setLoading(false);
    if (stage === 0 && secondaryUri && secondaryUri !== primaryUri) {
      // Retry with alternative URL
      setStage(1);
      setLoading(true);
    } else {
      // Both failed → show placeholder
      setStage(2);
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <Image
        key={effectiveUri}
        source={{ uri: effectiveUri }}
        style={[StyleSheet.absoluteFillObject, styles.imageFull]}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel || 'Heritage site photograph'}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={handleError}
      />

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#B9572B" />
        </View>
      ) : null}

      {/* Attribution badge ONLY if explicitly requested (e.g. details hero), never on cards */}
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
  imageFull: {
    width: '100%',
    height: '100%',
  },
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

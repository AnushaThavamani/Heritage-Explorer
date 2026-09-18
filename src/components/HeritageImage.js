import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';

function normalizeUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return '';
  }

  return encodeURI(uri.trim());
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80';

export default function HeritageImage({ uri, style, fallbackText = 'Image unavailable', accessibilityLabel }) {
  const [hasError, setHasError] = useState(false);
  const [sourceUri, setSourceUri] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const safeUri = useMemo(() => normalizeUri(uri), [uri]);

  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);
    setSourceUri(safeUri);
  }, [safeUri]);

  if (hasError || !sourceUri) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode="cover"
      accessibilityLabel={accessibilityLabel || fallbackText}
      onError={() => {
        if (usingFallback) setHasError(true);
        else { setUsingFallback(true); setSourceUri(FALLBACK_IMAGE); }
      }}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D8C9',
  },
  fallbackText: {
    color: '#6F594A',
    fontWeight: '700',
  },
});

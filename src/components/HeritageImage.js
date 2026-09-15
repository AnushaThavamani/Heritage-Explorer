import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';

function normalizeUri(uri) {
  if (!uri || typeof uri !== 'string') {
    return '';
  }

  return encodeURI(uri.trim());
}

export default function HeritageImage({ uri, style, fallbackText = 'Image unavailable', accessibilityLabel }) {
  const [hasError, setHasError] = useState(false);
  const [sourceUri, setSourceUri] = useState('');
  const safeUri = useMemo(() => normalizeUri(uri), [uri]);

  useEffect(() => {
    setHasError(false);
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
      onError={() => setHasError(true)}
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

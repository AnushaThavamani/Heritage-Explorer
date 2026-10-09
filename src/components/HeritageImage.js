import React, { useState } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { API_URL } from '../config/api';

export default function HeritageImage({ uri, style, fallbackText = 'Image unavailable', accessibilityLabel }) {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);

  const safeUri = (uri || '').trim();
  const isWiki = safeUri.includes('wikimedia.org') || safeUri.includes('wikipedia.org');
  
  let finalUri = safeUri;
  if (isWiki) {
    try {
      const decoded = decodeURIComponent(safeUri);
      finalUri = `https://wsrv.nl/?url=${encodeURIComponent(decoded)}&w=600&output=webp`;
    } catch {
      finalUri = `https://wsrv.nl/?url=${encodeURIComponent(safeUri)}&w=600&output=webp`;
    }
  } else if (safeUri) {
    finalUri = safeUri.includes('?') ? `${safeUri}&cb=6` : `${safeUri}?cb=6`;
  }
  
  const source = { 
    uri: finalUri,
    headers: {
      'User-Agent': 'HeritageExplorer/1.0'
    }
  };

  if (hasError || !safeUri) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      accessibilityLabel={accessibilityLabel || fallbackText}
      onLoadStart={() => {
        setLoading(true);
        console.log('IMAGE LOAD START:', safeUri);
      }}
      onLoad={() => {
        setLoading(false);
        console.log('IMAGE LOAD SUCCESS:', safeUri);
      }}
      onError={(e) => {
        setLoading(false);
        setHasError(true);
        console.log('IMAGE LOAD ERROR:', e.nativeEvent.error);
        console.log('FAILED URL:', safeUri);
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

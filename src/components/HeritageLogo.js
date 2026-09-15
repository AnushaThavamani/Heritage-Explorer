import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HeritageLogo({ size = 72, compact = false }) {
  const iconSize = compact ? size * 0.72 : size;

  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <View style={[styles.badge, { width: iconSize, height: iconSize, borderRadius: iconSize / 2 }]}>
        <View style={styles.innerGlow} />
        <View style={styles.archBase} />
        <View style={styles.archRoof} />
        <View style={styles.archLeftPillar} />
        <View style={styles.archRightPillar} />
        <View style={styles.archSteps} />
        <Text style={styles.monogram}>HE</Text>
      </View>

      {!compact ? (
        <View style={styles.wordmarkBlock}>
          <Text style={styles.wordmark}>Heritage Explorer</Text>
          <Text style={styles.tagline}>Culture • Travel • Discovery</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactWrap: {
    flexDirection: 'column',
  },
  badge: {
    backgroundColor: '#4B2E23',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
  },
  innerGlow: {
    position: 'absolute',
    top: -10,
    right: -6,
    width: '80%',
    height: '80%',
    borderRadius: 999,
    backgroundColor: 'rgba(217, 180, 74, 0.18)',
  },
  archBase: {
    position: 'absolute',
    bottom: 12,
    width: '66%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#D9B44A',
  },
  archRoof: {
    position: 'absolute',
    top: 14,
    width: '54%',
    height: '54%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 2,
    borderColor: '#E6D1BB',
    borderBottomWidth: 0,
  },
  archLeftPillar: {
    position: 'absolute',
    left: '28%',
    bottom: 18,
    width: 8,
    height: '34%',
    borderRadius: 999,
    backgroundColor: '#E6D1BB',
  },
  archRightPillar: {
    position: 'absolute',
    right: '28%',
    bottom: 18,
    width: 8,
    height: '34%',
    borderRadius: 999,
    backgroundColor: '#E6D1BB',
  },
  archSteps: {
    position: 'absolute',
    bottom: 8,
    width: '42%',
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  monogram: {
    color: '#FFF8F0',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
  },
  wordmarkBlock: {
    alignItems: 'center',
    marginTop: 12,
  },
  wordmark: {
    color: '#4B2E23',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 4,
    color: '#8B4A24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
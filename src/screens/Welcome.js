import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import HeritageLogo from '../components/HeritageLogo';

export default function WelcomeScreen({ onStart }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={styles.welcomeTop}>
        <View style={styles.logoShell}>
          <HeritageLogo size={92} />
        </View>

        <Text style={styles.appTitle}>Heritage Explorer</Text>
        <Text style={styles.tagline}>Discover India's Timeless Heritage</Text>

        <Text style={styles.welcomeMessage}>
          Explore historic monuments, discover fascinating stories, and create your own heritage journey.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>06</Text>
            <Text style={styles.statLabel}>Sites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>04</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>01</Text>
            <Text style={styles.statLabel}>Trail</Text>
          </View>
        </View>

        <PrimaryButton onPress={onStart} style={{ marginTop: 22 }}>
          Get Started
        </PrimaryButton>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Explore • Discover • Remember</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 20,
    backgroundColor: '#F7EFE6',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(185, 87, 43, 0.08)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: 60,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(217, 180, 74, 0.12)',
  },
  welcomeTop: {
    alignItems: 'center',
    width: '100%',
  },
  logoShell: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 28,
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#E8D6C3',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#4b2e23',
    marginTop: 6,
  },
  tagline: {
    color: '#B9572B',
    fontSize: 17,
    marginTop: 8,
    fontWeight: '600',
  },
  welcomeMessage: {
    color: '#5f4a42',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 6,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E2D4',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  statValue: {
    color: '#4b2e23',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#8B4A24',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footer: {
    marginTop: 24,
  },
  footerText: {
    color: '#6F594A',
    fontSize: 14,
  },
});

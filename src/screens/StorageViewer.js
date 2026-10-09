import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrimaryButton from '../components/PrimaryButton';

export default function StorageViewer({ onBack }) {
  const [storageData, setStorageData] = useState([]);

  const loadStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      setStorageData(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  const clearStorage = async () => {
    await AsyncStorage.clear();
    setStorageData([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <PrimaryButton onPress={onBack} style={styles.backButton}>Back</PrimaryButton>
        <Text style={styles.title}>Async Storage</Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Reload Data" onPress={loadStorage} />
        <View style={{ width: 10 }} />
        <Button title="Clear Storage" color="red" onPress={clearStorage} />
      </View>
      
      <View style={styles.dataContainer}>
        {storageData.length === 0 && <Text style={styles.empty}>Storage is empty.</Text>}
        {storageData.map(([key, value]) => (
          <View key={key} style={styles.card}>
            <Text style={styles.keyText}>Key: {key}</Text>
            <Text style={styles.valueText}>Value: {value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 16, backgroundColor: '#F7EFE6' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 80, paddingVertical: 8 },
  title: { color: '#4B2E23', fontSize: 24, fontWeight: '900', marginLeft: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  dataContainer: { backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  empty: { color: '#6F594A', textAlign: 'center', fontStyle: 'italic' },
  card: { marginBottom: 15, padding: 12, backgroundColor: '#FFF8F0', borderRadius: 8, borderColor: '#E8D6C3', borderWidth: 1 },
  keyText: { fontWeight: '900', color: '#4B2E23', marginBottom: 4 },
  valueText: { color: '#6F594A', fontSize: 13 }
});

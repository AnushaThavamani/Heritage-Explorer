import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useHeritage } from '../context/HeritageContext';

const blank = { siteId: '', name: '', description: '', location: '', state: '', category: '', latitude: '', longitude: '', image: '' };
export default function AdminSitesScreen({ onBack }) {
  const { sites, isLoadingSites, createSite, updateSite, deleteSite } = useHeritage();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const startEdit = site => { setEditing(site.id); setForm({ siteId: site.id, name: site.name || '', description: site.description || '', location: site.location || '', state: site.state || '', category: site.category || '', latitude: String(site.latitude ?? ''), longitude: String(site.longitude ?? ''), image: site.image || '' }); };
  const save = async () => {
    if (!form.siteId || !form.name || !form.description || !form.location || !form.category || form.latitude === '' || form.longitude === '') return Alert.alert('Required fields', 'Complete the ID, name, description, location, category, latitude and longitude.');
    setSaving(true);
    const payload = { ...form, district: form.location, latitude: Number(form.latitude), longitude: Number(form.longitude), images: form.image ? [form.image] : [] };
    const result = editing ? await updateSite(editing, payload) : await createSite(payload);
    setSaving(false);
    if (result) { Alert.alert(editing ? 'Site updated' : 'Site created', 'The heritage-site list has been refreshed.'); setEditing(null); setForm(blank); }
  };
  const remove = site => Alert.alert('Delete heritage site?', `Delete “${site.name}”? This cannot be undone.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteSite(site.id) }]);
  const field = (key, label, multiline = false) => <View><Text style={styles.label}>{label}</Text><TextInput value={form[key]} onChangeText={value => set(key, value)} style={[styles.input, multiline && styles.multiline]} multiline={multiline} placeholder={label} autoCapitalize={key === 'siteId' ? 'none' : 'sentences'} keyboardType={key === 'latitude' || key === 'longitude' ? 'decimal-pad' : 'default'} /></View>;
  return <ScrollView contentContainerStyle={styles.screen}><Pressable onPress={onBack}><Text style={styles.back}>← Back to profile</Text></Pressable><Text style={styles.title}>Manage heritage sites</Text><Text style={styles.subtitle}>Admin-only MongoDB management</Text><View style={styles.form}>{field('siteId', 'Stable site ID (for example taj-mahal)')}{field('name', 'Name')}{field('description', 'Description', true)}{field('location', 'Location')}{field('state', 'State')}{field('category', 'Category')}{field('latitude', 'Latitude')}{field('longitude', 'Longitude')}{field('image', 'Image URL (optional)')}<PrimaryButton onPress={save} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update heritage site' : 'Add heritage site'}</PrimaryButton>{editing ? <Pressable onPress={() => { setEditing(null); setForm(blank); }}><Text style={styles.cancel}>Cancel edit</Text></Pressable> : null}</View><Text style={styles.section}>All sites {isLoadingSites ? <ActivityIndicator size="small" color="#B9572B" /> : null}</Text>{sites.map(site => <View key={site.id} style={styles.site}><View style={styles.siteCopy}><Text style={styles.siteName}>{site.name}</Text><Text style={styles.meta}>{site.location} · {site.category}</Text></View><Pressable onPress={() => startEdit(site)}><Text style={styles.edit}>Edit</Text></Pressable><Pressable onPress={() => remove(site)}><Text style={styles.delete}>Delete</Text></Pressable></View>)}</ScrollView>;
}
const styles = StyleSheet.create({ screen: { flexGrow: 1, padding: 16, paddingBottom: 30, backgroundColor: '#F7EFE6' }, back: { color: '#4B2E23', fontWeight: '800' }, title: { color: '#4B2E23', fontSize: 25, fontWeight: '900', marginTop: 16 }, subtitle: { color: '#8B4A24', marginTop: 4, fontWeight: '700' }, form: { backgroundColor: '#FFF', padding: 16, borderRadius: 18, marginTop: 16 }, label: { color: '#8B4A24', fontWeight: '900', fontSize: 10, letterSpacing: .5, marginTop: 8, marginBottom: 5 }, input: { borderWidth: 1, borderColor: '#E8D6C3', borderRadius: 10, padding: 10, color: '#4B2E23' }, multiline: { minHeight: 78, textAlignVertical: 'top' }, cancel: { color: '#B9572B', fontWeight: '800', textAlign: 'center', marginTop: 12 }, section: { color: '#4B2E23', fontSize: 18, fontWeight: '900', marginTop: 22, marginBottom: 8 }, site: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 13, padding: 12, marginBottom: 8 }, siteCopy: { flex: 1 }, siteName: { color: '#4B2E23', fontWeight: '900' }, meta: { color: '#6F594A', fontSize: 11, marginTop: 4 }, edit: { color: '#8B4A24', fontWeight: '900', marginLeft: 10 }, delete: { color: '#B23B2B', fontWeight: '900', marginLeft: 10 } });

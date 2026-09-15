import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ onBack, onRegistered }) {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const submit = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!emailPattern.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(form.mobile)) next.mobile = 'Enter a valid 10-digit mobile number.';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length) return;
    Alert.alert('Registration successful', 'Your Heritage Explorer account is ready.', [{ text: 'Go to Login', onPress: () => onRegistered(form) }]);
  };
  const field = (key, placeholder, props = {}) => <View><InputField placeholder={placeholder} value={form[key]} onChangeText={value => update(key, value)} {...props} />{errors[key] ? <Text style={styles.error}>{errors[key]}</Text> : null}</View>;
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Create your account</Text><Text style={styles.subtitle}>Begin a more personal journey through India’s heritage.</Text>{field('name', 'Full name')}{field('email', 'Email address', { keyboardType: 'email-address', autoCapitalize: 'none' })}{field('mobile', 'Mobile number', { keyboardType: 'phone-pad' })}{field('password', 'Password', { secure: true })}{field('confirm', 'Confirm password', { secure: true })}<PrimaryButton onPress={submit} style={styles.button}>Register</PrimaryButton><Text style={styles.back} onPress={onBack}>Already registered? Login</Text></ScrollView></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ flex: { flex: 1 }, screen: { flexGrow: 1, justifyContent: 'center', padding: 22, backgroundColor: '#F7EFE6' }, title: { color: '#4B2E23', fontSize: 28, fontWeight: '900' }, subtitle: { color: '#6F594A', lineHeight: 20, marginTop: 7, marginBottom: 20 }, error: { color: '#B23B2B', fontSize: 12, marginTop: -8, marginBottom: 8 }, button: { marginTop: 8 }, back: { color: '#B9572B', fontWeight: '800', textAlign: 'center', marginTop: 18 } });

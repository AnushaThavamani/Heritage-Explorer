import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HeritageLogo from '../components/HeritageLogo';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useHeritage } from '../context/HeritageContext';
import { useAuth } from '../context/AuthContext';
import { apiMessage } from '../services/api';

export default function LoginScreen({ onLogin, onBack, onSignUp }) {
  const [email, setEmail] = useState('traveller@heritage.in');
  const [password, setPassword] = useState('');
  const { login } = useHeritage();
  const { login: authenticate } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    if (!email.includes('@') || password.length < 4) return Alert.alert('Check your details', 'Enter a valid email and a password with at least four characters.');
    setIsSubmitting(true);
    try { const user = await authenticate({ email: email.trim(), password }); login(user); onLogin(); } catch (error) { Alert.alert('Login failed', apiMessage(error)); } finally { setIsSubmitting(false); }
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled"><View style={styles.orb} /><View style={styles.top}><View style={styles.logo}><HeritageLogo size={64} compact /></View><Text style={styles.title}>Welcome Back</Text><Text style={styles.subtitle}>Continue your journey through India’s heritage</Text><View style={styles.card}><Text style={styles.cardTitle}>Login to explore</Text><InputField placeholder="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} /><InputField placeholder="Password" secure value={password} onChangeText={setPassword} /><Pressable onPress={() => Alert.alert('Forgot password', 'A reset link would be sent to your registered email.')}><Text style={styles.link}>Forgot Password?</Text></Pressable><PrimaryButton onPress={submit} disabled={isSubmitting} style={styles.button}>{isSubmitting ? 'Logging in...' : 'Login'}</PrimaryButton><View style={styles.signup}><Text style={styles.muted}>New to Heritage Explorer? </Text><Pressable onPress={onSignUp}><Text style={styles.link}>Sign Up</Text></Pressable></View></View><Pressable onPress={onBack}><Text style={styles.back}>← Back to welcome</Text></Pressable></View></ScrollView></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ flex: { flex: 1 }, screen: { flexGrow: 1, justifyContent: 'center', padding: 22, backgroundColor: '#F7EFE6' }, orb: { position: 'absolute', top: -60, right: -30, height: 190, width: 190, borderRadius: 95, backgroundColor: '#F2DEC9' }, top: { alignItems: 'center' }, logo: { padding: 12, backgroundColor: '#FFF8F0', borderRadius: 24, elevation: 4 }, title: { color: '#4B2E23', fontSize: 27, fontWeight: '900', marginTop: 17 }, subtitle: { color: '#6F594A', textAlign: 'center', marginTop: 8, lineHeight: 21 }, card: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginTop: 22, elevation: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, cardTitle: { fontSize: 17, color: '#4B2E23', fontWeight: '800' }, link: { color: '#B9572B', fontWeight: '800' }, button: { marginTop: 18 }, signup: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }, muted: { color: '#6F594A' }, back: { color: '#4B2E23', fontWeight: '700', marginTop: 22 } });

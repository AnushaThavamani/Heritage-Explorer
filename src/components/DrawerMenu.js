import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useHeritage } from '../context/HeritageContext';

const menuItems = [
  { key: 'favorites', label: 'Favourite Sites', icon: '♥' },
  { key: 'visited', label: 'Visited Sites', icon: '✓' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
  { key: 'about', label: 'About Heritage Explorer', icon: 'ⓘ' },
  { key: 'help', label: 'Help & Support', icon: '?' },
];

export default function DrawerMenu({ visible, onClose, onNavigate }) {
  const { user, favorites, logout } = useHeritage();
  const choose = key => {
    if (key === 'logout') logout();
    onNavigate(key === 'logout' ? 'login' : key);
  };
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.drawer}>
          <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{user.name.charAt(0)}</Text></View><Text style={styles.name}>{user.name}</Text><Text style={styles.email}>{user.email}</Text></View>
          {menuItems.map(item => <Pressable key={item.key} style={styles.item} onPress={() => choose(item.key)}><Text style={styles.itemIcon}>{item.icon}</Text><Text style={styles.itemText}>{item.label}</Text>{item.key === 'favorites' ? <Text style={styles.count}>{favorites.length}</Text> : null}</Pressable>)}
          <View style={styles.line} />
          <Pressable style={styles.item} onPress={() => choose('logout')}><Text style={styles.itemIcon}>⇥</Text><Text style={[styles.itemText, styles.logout]}>Logout</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(38, 24, 18, 0.35)' }, dismiss: { flex: 1 },
  drawer: { width: '82%', maxWidth: 330, backgroundColor: '#FFFDF9', paddingTop: 30, elevation: 20 },
  profile: { backgroundColor: '#4B2E23', padding: 20, paddingBottom: 24 }, avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D9B44A', alignItems: 'center', justifyContent: 'center' }, avatarText: { fontWeight: '900', fontSize: 22, color: '#4B2E23' }, name: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 10 }, email: { color: '#E6D1BB', marginTop: 3, fontSize: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 }, itemIcon: { width: 30, color: '#B9572B', fontSize: 19, textAlign: 'center' }, itemText: { color: '#4B2E23', fontWeight: '700', marginLeft: 12, flex: 1 }, count: { backgroundColor: '#F5E8DC', color: '#8B4A24', minWidth: 24, textAlign: 'center', paddingVertical: 3, borderRadius: 10, fontWeight: '800' }, line: { height: 1, backgroundColor: '#EFE1D6', marginVertical: 8 }, logout: { color: '#B9572B' },
});

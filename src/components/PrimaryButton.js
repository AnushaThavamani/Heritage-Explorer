import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

const palette = {
  terracotta: '#B9572B',
};

export default function PrimaryButton({ children, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.terracotta,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
  text: {
    color: '#FFFDF9',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});

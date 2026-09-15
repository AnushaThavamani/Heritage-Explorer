import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

export default function InputField({ placeholder, secure, keyboardType, value, onChangeText, style }) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor="#A0897A"
      secureTextEntry={secure}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EFE1D6',
    fontSize: 15,
    color: '#2e1f18',
  },
});

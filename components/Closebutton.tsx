// components/CloseButton.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { FishingTheme } from '../constants/FishingTheme';

interface CloseButtonProps {
  onPress: () => void;
  style?: any;
  iconColor?: string;
  iconSize?: number;
  iconName?: 'chevron-down' | 'close' | 'chevron-up';
}

export function CloseButton({ 
  onPress, 
  style, 
  iconColor = FishingTheme.colors.darkGreen,
  iconSize = 18,
  iconName = 'chevron-down'
}: CloseButtonProps) {
  return (
    <Pressable 
      onPress={onPress} 
      style={[styles.closeBtn, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={iconName} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeBtn: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: FishingTheme.colors.card, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
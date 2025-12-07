// components/ModalCloseButton.tsx
// Alternative component with multiple icon style options

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FishingTheme } from '../constants/FishingTheme';

export type CloseIconType = 'chevron-down' | 'close' | 'chevron-up' | 'chevron-back' | 'arrow-down';

interface ModalCloseButtonProps {
  onPress: () => void;
  style?: any;
  iconType?: CloseIconType;
  variant?: 'default' | 'minimal' | 'circular';
}

export function ModalCloseButton({ 
  onPress, 
  style,
  iconType = 'chevron-down',
  variant = 'default'
}: ModalCloseButtonProps) {
  const buttonStyle = variant === 'minimal' 
    ? styles.minimalBtn 
    : variant === 'circular'
    ? styles.circularBtn
    : styles.defaultBtn;

  const iconColor = variant === 'minimal' 
    ? FishingTheme.colors.text.secondary
    : FishingTheme.colors.darkGreen;

  const iconSize = variant === 'minimal' ? 16 : 18;

  return (
    <Pressable 
      onPress={onPress} 
      style={[buttonStyle, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={iconType} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

// You can also create a specialized minimize button for modals
export function ModalMinimizeButton({ onPress, style }: { onPress: () => void; style?: any }) {
  return (
    <View style={[styles.minimizeContainer, style]}>
      <Pressable 
        onPress={onPress} 
        style={styles.minimizeBtn}
        hitSlop={{ top: 15, bottom: 15, left: 20, right: 20 }}
      >
        <View style={styles.minimizeBar} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  defaultBtn: { 
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
  minimalBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Alternative minimize button styles
  minimizeContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  minimizeBtn: {
    padding: 8,
  },
  minimizeBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: FishingTheme.colors.border,
  },
});
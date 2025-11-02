import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>MAP VIEW</Text>
      <Text style={styles.subtitle}>Interactive map of fishing spots and buddies</Text>
      <View style={styles.comingSoonBox}>
        <Text style={styles.comingSoonText}>COMING SOON</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: FishingTheme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  comingSoonBox: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    ...FishingTheme.shadows.md,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 1.5,
  },
});
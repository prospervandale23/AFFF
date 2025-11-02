import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../constants/FishingTheme';
import { supabase } from '../lib/supabase';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingUser();
  }, []);

  async function checkExistingUser() {
    try {
      const fishingType = await AsyncStorage.getItem('fishingType');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (fishingType && session) {
        router.replace('/(tabs)/feeds');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectFishingType(type: 'freshwater' | 'saltwater') {
    await AsyncStorage.setItem('fishingType', type);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await supabase.from('profiles').update({
        fishing_type: type,
        updated_at: new Date().toISOString()
      }).eq('id', session.user.id);
      
      router.replace('/(tabs)/feeds');
    } else {
      router.push('/(tabs)/profile');
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={FishingTheme.colors.darkGreen} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>FB</Text>
        </View>
        <Text style={styles.title}>FISHING BUDDY</Text>
        <Text style={styles.subtitle}>Connect with anglers near you</Text>
      </View>

      <View style={styles.selectionContainer}>
        <Text style={styles.question}>WHAT TYPE OF FISHING DO YOU PREFER?</Text>
        
        <Pressable 
          style={styles.optionCard}
          onPress={() => selectFishingType('freshwater')}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>FRESHWATER</Text>
          </View>
          <Text style={styles.optionDesc}>Lakes, rivers, ponds</Text>
          <View style={styles.speciesContainer}>
            <Text style={styles.speciesText}>Bass • Trout • Pike • Walleye</Text>
          </View>
        </Pressable>

        <Pressable 
          style={styles.optionCard}
          onPress={() => selectFishingType('saltwater')}
        >
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>SALTWATER</Text>
          </View>
          <Text style={styles.optionDesc}>Ocean, bays, coastal</Text>
          <View style={styles.speciesContainer}>
            <Text style={styles.speciesText}>Stripers • Tuna • Fluke • Blues</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: FishingTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...FishingTheme.shadows.lg,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: FishingTheme.colors.cream,
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: FishingTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  selectionContainer: {
    gap: 16,
  },
  question: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  optionCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    alignItems: 'center',
    ...FishingTheme.shadows.md,
  },
  optionHeader: {
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 1,
  },
  optionDesc: {
    fontSize: 16,
    color: FishingTheme.colors.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  speciesContainer: {
    backgroundColor: FishingTheme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  speciesText: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
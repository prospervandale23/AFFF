import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function WelcomeScreen() {
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
      router.push('/(tabs)/profile'); // Send to profile tab to sign in
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#72E5A2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🎣</Text>
        <Text style={styles.title}>Fishing Buddy</Text>
        <Text style={styles.subtitle}>Connect with anglers near you</Text>
      </View>

      <View style={styles.selectionContainer}>
        <Text style={styles.question}>What type of fishing do you prefer?</Text>
        
        <Pressable 
          style={styles.optionCard}
          onPress={() => selectFishingType('freshwater')}
        >
          <Text style={styles.optionEmoji}>🏞️</Text>
          <Text style={styles.optionTitle}>Freshwater</Text>
          <Text style={styles.optionDesc}>Lakes, rivers, ponds</Text>
          <View style={styles.speciesRow}>
            <Text style={styles.speciesText}>Bass • Trout • Pike • Walleye</Text>
          </View>
        </Pressable>

        <Pressable 
          style={styles.optionCard}
          onPress={() => selectFishingType('saltwater')}
        >
          <Text style={styles.optionEmoji}>🌊</Text>
          <Text style={styles.optionTitle}>Saltwater</Text>
          <Text style={styles.optionDesc}>Ocean, bays, coastal</Text>
          <View style={styles.speciesRow}>
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
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#E8ECF1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BB0CC',
  },
  selectionContainer: {
    gap: 20,
  },
  question: {
    fontSize: 18,
    color: '#E8ECF1',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  optionCard: {
    backgroundColor: '#121A2B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#1E2A44',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#72E5A2',
    marginBottom: 8,
  },
  optionDesc: {
    fontSize: 16,
    color: '#AFC3E1',
    marginBottom: 12,
  },
  speciesRow: {
    backgroundColor: '#0B1220',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  speciesText: {
    fontSize: 14,
    color: '#9BB0CC',
  },
});
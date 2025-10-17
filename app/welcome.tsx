import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function WelcomeLanding() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if user already selected type
    checkExistingUser();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Float animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wave animations
    Animated.loop(
      Animated.timing(wave1, {
        toValue: -width,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(wave2, {
        toValue: width,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
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

  return (
    <View style={styles.container}>
      {/* Animated Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.Text
          style={[styles.logo, { transform: [{ translateY: floatAnim }] }]}
        >
          🎣
        </Animated.Text>
        <Text style={styles.appName}>Fishing Buddy</Text>
        <Text style={styles.tagline}>Connect with local anglers</Text>

        <View style={styles.divider} />

        <Text style={styles.question}>What type of fishing do you prefer?</Text>

        {/* Freshwater Button */}
        <Pressable
          style={({ pressed }) => [
            styles.typeButton,
            styles.freshwaterButton,
            pressed && styles.buttonPressed
          ]}
          onPress={() => selectFishingType('freshwater')}
        >
          <Text style={styles.buttonEmoji}>🏞️</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Freshwater</Text>
            <Text style={styles.buttonSubtitle}>Lakes • Rivers • Ponds</Text>
            <View style={styles.speciesRow}>
              <Text style={styles.speciesText}>Bass • Trout • Pike • Walleye</Text>
            </View>
          </View>
        </Pressable>

        {/* Saltwater Button */}
        <Pressable
          style={({ pressed }) => [
            styles.typeButton,
            styles.saltwaterButton,
            pressed && styles.buttonPressed
          ]}
          onPress={() => selectFishingType('saltwater')}
        >
          <Text style={styles.buttonEmoji}>🌊</Text>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonTitle}>Saltwater</Text>
            <Text style={styles.buttonSubtitle}>Ocean • Bays • Coastal</Text>
            <View style={styles.speciesRow}>
              <Text style={styles.speciesText}>Stripers • Tuna • Fluke • Blues</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Animated Waves at Bottom */}
      <View style={styles.waveContainer}>
        <Animated.View
          style={[
            styles.wave,
            { transform: [{ translateX: wave1 }], opacity: 0.3 }
          ]}
        >
          <WavePath color="#72E5A2" />
        </Animated.View>

        <Animated.View
          style={[
            styles.wave,
            { transform: [{ translateX: wave2 }], opacity: 0.4, bottom: 10 }
          ]}
        >
          <WavePath color="#4A9FD8" />
        </Animated.View>
      </View>
    </View>
  );
}

function WavePath({ color }: { color: string }) {
  return (
    <View style={[styles.waveSvg, { backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#E8ECF1',
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#9BB0CC',
    fontWeight: '500',
    marginBottom: 40,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#72E5A2',
    borderRadius: 2,
    marginBottom: 32,
  },
  question: {
    fontSize: 20,
    color: '#E8ECF1',
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  typeButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#121A2B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#1E2A44',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  freshwaterButton: {
    borderColor: '#72E5A2',
  },
  saltwaterButton: {
    borderColor: '#4A9FD8',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonEmoji: {
    fontSize: 48,
    marginRight: 20,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E8ECF1',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#9BB0CC',
    marginBottom: 12,
    fontWeight: '500',
  },
  speciesRow: {
    backgroundColor: 'rgba(114, 229, 162, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  speciesText: {
    fontSize: 12,
    color: '#72E5A2',
    fontWeight: '600',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width * 2,
    height: 150,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    width: width * 2,
    height: 80,
  },
  waveSvg: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
  },
});
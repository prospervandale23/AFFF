import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Test with remote URL first - if this works, then it's a local file path issue
const videoSource = { uri: './assets/videos/splash.mp4' };

// Once the above works, try your local file:
// const videoSource = require('./assets/videos/splash.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Create video player with looping
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#72E5A2" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Video Background */}
        <VideoView
          style={styles.backgroundVideo}
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
        />
        
        {/* Content on top of video */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎣</Text>
            <Text style={styles.title}>AFF</Text>
            <Text style={styles.subtitle}>Connect with anglers near you</Text>
          </View>

          <View style={styles.selectionContainer}>
            <Pressable 
              style={styles.glassCard}
              onPress={() => selectFishingType('freshwater')}
            >
              <Text style={styles.optionTitle}>Freshwater</Text>
              <Text style={styles.optionDesc}>Lakes, rivers, ponds</Text>
              <View style={styles.speciesRow}>
                <Text style={styles.speciesText}>Bass • Trout • Pike • Walleye</Text>
              </View>
            </Pressable>

            <Pressable 
              style={styles.glassCard}
              onPress={() => selectFishingType('saltwater')}
            >
              <Text style={styles.optionTitle}>Saltwater</Text>
              <Text style={styles.optionDesc}>Ocean, bays, coastal</Text>
              <View style={styles.speciesRow}>
                <Text style={styles.speciesText}>Stripers • Tuna • Fluke • Blues</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    fontWeight: '500',
  },
  selectionContainer: {
    gap: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  optionTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: -0.3,
  },
  optionDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.2,
  },
  speciesRow: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  speciesText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
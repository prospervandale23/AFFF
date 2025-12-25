import { Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FishingProvider } from '../contexts/FishingContext';

const splashVideo = require('../assets/videos/splash.mp4');

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  const player = useVideoPlayer(splashVideo, player => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    // Fallback timer in case video doesn't trigger completion
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Listen for video completion
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playToEnd', () => {
      setShowSplash(false);
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
        />
        <View style={styles.logoOverlay}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>CC</Text>
          </View>
          <Text style={styles.appName}>CATCH CONNECT</Text>
        </View>
      </View>
    );
  }

  return (
    <FishingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="conversation/[id]" 
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="terms" />
      </Stack>
    </FishingProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#E8DCC4',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 69, 56, 0.25)',
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: '#2F4538',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#D4C4A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F5EFE0',
    letterSpacing: 3,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5EFE0',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
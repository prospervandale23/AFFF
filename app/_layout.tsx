import { ResizeMode, Video } from 'expo-av';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FishingProvider } from '../contexts/FishingContext';

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#E8DCC4',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
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

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Video
          source={require('../assets/videos/splash.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              setShowSplash(false);
            }
          }}
        />
        <View style={styles.logoOverlay}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>AFF</Text>
          </View>
          <Text style={styles.appName}>ANGLER FRIEND FINDER</Text>
        </View>
      </View>
    );
  }

  return (
    <FishingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FishingProvider>
  );
}
// app/_layout.tsx
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FishingProvider } from '../contexts/FishingContext';
import { NotificationProvider } from '../contexts/NotificationContext';

const splashVideo = require('../assets/videos/splash.mp4');

// Configures how notifications are handled while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false, // Required for TS
    shouldShowList: false,   // Required for TS
  }),
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  // 1. Request Permission to update the App Icon Badge
  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
    requestPermissions();
  }, []);

  // 2. Splash Video Logic
  const player = useVideoPlayer(splashVideo, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!player) return;
    const subscription = player.addListener('playToEnd', () => {
      setShowSplash(false);
    });
    return () => subscription?.remove();
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
    <NotificationProvider>
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
    </NotificationProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#E8DCC4' },
  video: { ...StyleSheet.absoluteFillObject },
  logoOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 69, 56, 0.25)',
  },
  logoBox: {
    width: 100, height: 100,
    backgroundColor: '#2F4538',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#D4C4A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
  },
  logoText: { fontSize: 40, fontWeight: '800', color: '#F5EFE0' },
  appName: { fontSize: 28, fontWeight: '800', color: '#F5EFE0' },
});
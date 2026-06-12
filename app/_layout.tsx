// app/_layout.tsx
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEventListener, useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FishingProvider } from '../contexts/FishingContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabase';

const splashVideo = require('../assets/videos/splash.mp4');

// Configures how notifications are handled while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  // ── Handle password-reset deep links (finnz://reset-password) ─────────────
  useEffect(() => {
    async function handleUrl(url: string) {
      if (!url.includes('reset-password')) return;
      try {
        // Primary: direct email template link with token_hash
        const tokenHash = url.match(/[?&]token_hash=([^&#]+)/)?.[1];
        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: decodeURIComponent(tokenHash),
            type: 'recovery',
          });
          if (!error) router.push('/auth/reset-password');
          return;
        }
        // Fallback: PKCE flow with ?code=...
        const code = url.match(/[?&]code=([^&#]+)/)?.[1];
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) router.push('/auth/reset-password');
          return;
        }
        // Fallback: implicit flow with #access_token=...
        const accessToken = url.match(/[#&]access_token=([^&]+)/)?.[1];
        const refreshToken = url.match(/[#&]refresh_token=([^&]+)/)?.[1];
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          });
          if (!error) router.push('/auth/reset-password');
        }
      } catch (e) {
        console.warn('Deep link error:', e);
      }
    }

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

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

  useEventListener(player, 'playToEnd', () => {
    setShowSplash(false);
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={styles.logoOverlay}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FZ</Text>
          </View>
          <Text style={styles.appName}>Finnz</Text>
        </View>
      </View>
    );
  }

  return (
    <NotificationProvider>
      <FishingProvider>
        <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen
    name="conversation/[id]"
    options={{
      presentation: 'card',
      animation: 'slide_from_right',
    }}
  />
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
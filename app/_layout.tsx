// app/_layout.tsx
import { FishingProvider } from '@/contexts/FishingContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  // Are we currently inside the (tabs) group?
  const inTabs = useMemo(() => segments[0] === '(tabs)', [segments]);

  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Initial check (runs once)
  useEffect(() => {
    (async () => {
      try {
        console.log('🔍 Checking initial route...');
        const type = await AsyncStorage.getItem('fishingType');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        console.log('🎣 Fishing type:', type);
        console.log('👤 Session exists:', !!session);
        if (error) console.warn('Session check error:', error);
      } catch (e) {
        console.error('💥 Error checking initial route:', e);
      } finally {
        setIsReady(true);
        setIsChecking(false);
      }
    })();
  }, []);

  // Routing logic (runs when state ready or path/group changes)
  useEffect(() => {
    if (!isReady || isChecking) return;
    void handleRouting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isChecking, pathname, inTabs]);

  async function handleRouting() {
    try {
      const fishingType = await AsyncStorage.getItem('fishingType');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Decide target:
      // - No fishing type → /welcome
      // - Has type + signed in → feeds
      // - Has type + not signed in → profile
      let target: Href | null = null;

      if (!fishingType) {
        console.log('➡️ No type → welcome');
        target = '/welcome';
      } else if (session) {
        console.log('➡️ Type + session → feeds');
        target = inTabs ? '/feeds' : '/(tabs)/feeds';
      } else {
        console.log('➡️ Type + NO session → profile');
        target = inTabs ? '/profile' : '/(tabs)/profile';
      }

      if (!target || pathname === target) return;

      // If we need to go to /welcome but we’re currently inside tabs,
      // bounce through root so the navigator tree can change cleanly.
      if (target === '/welcome' && inTabs) {
        router.replace('/');
        setTimeout(() => router.replace('/welcome'), 0);
        return;
      }

      router.replace(target);
    } catch (error) {
      console.error('💥 Error in handleRouting:', error);
    }
  }

  // Auth state listener (e.g., after login)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        const type = await AsyncStorage.getItem('fishingType');
        if (type) {
          // Go to feeds, using the right path form for current tree
          router.replace(inTabs ? '/feeds' : '/(tabs)/feeds');
        }
      }
    });

    return () => {
      try {
        subscription?.unsubscribe?.();
      } catch {}
    };
  }, [inTabs, router]);

  // Don’t render until we know where to route
  if (!isReady || isChecking) return null;

  return (
    <FishingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0B1220' },
        }}
      >
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </FishingProvider>
  );
}

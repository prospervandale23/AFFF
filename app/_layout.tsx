// app/_layout.tsx
import { FishingProvider } from '@/contexts/FishingContext';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  const inTabs = useMemo(() => segments[0] === '(tabs)', [segments]);

  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  useEffect(() => {
    if (!isReady || isChecking) return;
    void handleRouting();
  }, [isReady, isChecking, pathname, inTabs]);

  async function handleRouting() {
    try {
      const fishingType = await AsyncStorage.getItem('fishingType');
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If we're not in tabs and have no fishing type, don't do anything
      // Let index.tsx handle the redirect to welcome
      if (!fishingType && !inTabs) {
        console.log('➡️ No type, not in tabs → let index.tsx handle it');
        return;
      }
      
      // If in tabs and have type, navigate appropriately
      if (inTabs && fishingType) {
        if (session) {
          console.log('➡️ In tabs, has type + session → feeds');
          if (pathname !== '/feeds' && pathname !== '/(tabs)/feeds') {
            router.replace('/feeds');
          }
        } else {
          console.log('➡️ In tabs, has type, no session → profile');
          if (pathname !== '/profile' && pathname !== '/(tabs)/profile') {
            router.replace('/profile');
          }
        }
      }
      
      // If we're in tabs but no fishing type, something's wrong - go back to welcome
      if (inTabs && !fishingType) {
        console.log('➡️ In tabs but no type → back to welcome');
        router.replace('/welcome');
      }
      
    } catch (error) {
      console.error('💥 Error in handleRouting:', error);
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (event === 'SIGNED_IN' && session) {
        const type = await AsyncStorage.getItem('fishingType');
        if (type) {
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
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </FishingProvider>
  );
}
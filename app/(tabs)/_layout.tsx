import { supabase } from '@/lib/supabase'; // FIXED: Use @/ alias instead of ../
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkInitialRoute();
  }, []);

  useEffect(() => {
    // Handle routing after initial check is complete
    if (isReady && !isChecking) {
      handleRouting();
    }
  }, [isReady, isChecking, pathname]);

  async function checkInitialRoute() {
    try {
      console.log('🔍 Checking initial route...');
      console.log('📍 Current pathname:', pathname);
      
      // Check if user has selected fishing type
      const fishingType = await AsyncStorage.getItem('fishingType');
      console.log('🎣 Stored fishing type:', fishingType);
      
      // Check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('👤 Session exists:', !!session);
      
      if (error) {
        console.error('❌ Session check error:', error);
      }
      
      setIsReady(true);
      setIsChecking(false);
      
    } catch (error) {
      console.error('💥 Error checking initial route:', error);
      setIsReady(true);
      setIsChecking(false);
    }
  }

  async function handleRouting() {
    try {
      const fishingType = await AsyncStorage.getItem('fishingType');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Don't redirect if already on the correct page
      if (pathname === '/welcome' && !fishingType) {
        return; // Already where we need to be
      }
      
      if (pathname.includes('(tabs)') && fishingType && session) {
        return; // Already in the app with everything set up
      }
      
      // Perform redirects
      if (!fishingType) {
        console.log('➡️ No fishing type selected, going to welcome');
        router.replace('/welcome');
      } else if (fishingType && session) {
        console.log('➡️ User authenticated with fishing type, going to app');
        if (!pathname.includes('(tabs)')) {
          router.replace('/(tabs)/feeds');
        }
      } else if (fishingType && !session) {
        console.log('➡️ Has fishing type but no session, going to profile to sign in');
        if (!pathname.includes('(tabs)')) {
          router.replace('/(tabs)/profile');
        }
      }
    } catch (error) {
      console.error('💥 Error in handleRouting:', error);
    }
  }

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          const fishingType = await AsyncStorage.getItem('fishingType');
          if (fishingType && pathname === '/welcome') {
            router.replace('/(tabs)/feeds');
          }
        } else if (event === 'SIGNED_OUT') {
          // Optionally clear fishing type on sign out
          // await AsyncStorage.removeItem('fishingType');
          // router.replace('/welcome');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname]);

  // Don't render anything until we know where to route
  if (!isReady || isChecking) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0B1220' }
      }}
    >
      <Stack.Screen 
        name="welcome" 
        options={{ 
          headerShown: false,
          animation: 'fade'
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }} 
      />
    </Stack>
  );
}
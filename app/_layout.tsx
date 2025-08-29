import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkInitialRoute();
  }, []);

  useEffect(() => {
    // Only navigate once we know where to go and the router is ready
    if (isReady && initialRoute && segments[0] === undefined) {
      router.replace(initialRoute as any);
    }
  }, [isReady, initialRoute, segments]);

  async function checkInitialRoute() {
    try {
      console.log('🔍 Checking initial route...');
      
      // Check if user has selected fishing type
      const fishingType = await AsyncStorage.getItem('fishingType');
      console.log('🎣 Fishing type:', fishingType);
      
      // Check if user is authenticated
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('👤 Session exists:', !!session);
      
      if (error) {
        console.error('❌ Session check error:', error);
      }
      
      // Determine where to route the user
      if (!fishingType) {
        // New user - needs to select fishing type
        console.log('➡️ Routing to: welcome (no fishing type)');
        setInitialRoute('/welcome');
      } else if (fishingType && session?.user) {
        // Returning user with session
        console.log('➡️ Routing to: tabs (authenticated)');
        setInitialRoute('/(tabs)');
      } else {
        // Has fishing type but no session - go to welcome to re-auth
        console.log('➡️ Routing to: welcome (needs auth)');
        setInitialRoute('/welcome');
      }
    } catch (error) {
      console.error('💥 Error checking initial route:', error);
      // Default to welcome on error
      setInitialRoute('/welcome');
    } finally {
      setIsReady(true);
    }
  }

  // Don't render anything until we know where to route
  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
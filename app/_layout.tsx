import { FishingProvider } from '@/contexts/FishingContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FishingProvider>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FishingProvider>
    </SafeAreaProvider>
  );
}
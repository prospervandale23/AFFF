import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [fishingType, setFishingType] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    checkFishingType();
  }, []);

  async function checkFishingType() {
    const type = await AsyncStorage.getItem('fishingType');
    setFishingType(type);
  }

  if (fishingType === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B1220' }}>
        <ActivityIndicator size="large" color="#72E5A2" />
      </View>
    );
  }

  if (!fishingType) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)/feeds" />;
}
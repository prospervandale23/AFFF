import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type FishingType = 'freshwater' | 'saltwater' | null;

interface FishingContextType {
  fishingType: FishingType;
  setFishingType: (type: FishingType) => Promise<void>;
  species: string[];
  tackleCategories: string[];
}

const FishingContext = createContext<FishingContextType | undefined>(undefined);

export function FishingProvider({ children }: { children: React.ReactNode }) {
  const [fishingType, setFishingTypeState] = useState<FishingType>(null);

  useEffect(() => {
    loadFishingType();
  }, []);

  async function loadFishingType() {
    const saved = await AsyncStorage.getItem('fishingType') as FishingType;
    setFishingTypeState(saved);
  }

  async function setFishingType(type: FishingType) {
    if (type) {
      await AsyncStorage.setItem('fishingType', type);
    }
    setFishingTypeState(type);
  }

  const species = fishingType === 'freshwater' 
    ? ['Bass', 'Trout', 'Pike', 'Walleye', 'Crappie', 'Catfish', 'Perch']
    : ['Striped Bass', 'Bluefish', 'Fluke', 'Tuna', 'Mahi', 'Tautog', 'Sea Bass'];

  const tackleCategories = fishingType === 'freshwater'
    ? ['Light Spinning', 'Medium Spinning', 'Baitcasting', 'Fly', 'Ice Fishing']
    : ['Light Spinning', 'Medium Spinning', 'Heavy Spinning', 'Jigging', 'Surf Casting', 'Trolling'];

  return (
    <FishingContext.Provider value={{ fishingType, setFishingType, species, tackleCategories }}>
      {children}
    </FishingContext.Provider>
  );
}

export const useFishing = () => {
  const context = useContext(FishingContext);
  if (!context) throw new Error('useFishing must be used within FishingProvider');
  return context;
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type FishingType = 'freshwater' | 'saltwater' | null;

interface FishingContextType {
  fishingType: FishingType;
  setFishingType: (type: FishingType) => Promise<void>;
  species: string[]; // This was missing in the implementation
  tackleCategories: string[]; // This was missing in the implementation
}

const FishingContext = createContext<FishingContextType | undefined>(undefined);

// --- Define your data constants here or fetch them from a DB ---
const FRESHWATER_SPECIES = ['Largemouth Bass', 'Smallmouth Bass', 'Trout', 'Catfish', 'Walleye', 'Crappie'];
const SALTWATER_SPECIES = ['Striped Bass', 'Bluefish', 'Tuna', 'Fluke', 'Sea Bass', 'Tautog'];

const FRESHWATER_TACKLE = ['Soft Plastics', 'Spinners', 'Topwater', 'Jigs', 'Live Bait'];
const SALTWATER_TACKLE = ['Plugs', 'Metal Jigs', 'Eels', 'Trolling Lures', 'Bottom Rigs'];

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

  // --- Logic to determine which lists to show ---
  const species = fishingType === 'saltwater' ? SALTWATER_SPECIES : FRESHWATER_SPECIES;
  const tackleCategories = fishingType === 'saltwater' ? SALTWATER_TACKLE : FRESHWATER_TACKLE;

  return (
    // Now these variables exist and can be passed into the provider!
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
import { useFishing } from '@/contexts/FishingContext';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface SpeciesInfo {
  id: string;
  name: string;
  slotSize: string;
  description: string;
  habitat: string;
  feedingTimes: string[];
  baitfish: string[];
  lures: LureInfo[];
  seasonality: string;
  bestTimes: string;
}

interface LureInfo {
  name: string;
  type: string;
  priceRange: string;
  effectiveness: 'High' | 'Medium' | 'Low';
  description: string;
  tips:string; // Optional tips for use
  comments?: string; // Optional user comments
  affiliateUrl?: string; // For future revenue
}

// Sample species data - would come from your database
const freshwaterSpecies: SpeciesInfo[] = [
  {
    id: 'largemouth-bass',
    name: 'Largemouth Bass',
    slotSize: '12" minimum',
    description: 'The most popular freshwater game fish in North America. Known for aggressive strikes and acrobatic fights.',
    habitat: 'Structure-oriented, prefers cover like logs, vegetation, and rocky areas',
    feedingTimes: ['Dawn', 'Dusk', 'Overcast days'],
    baitfish: ['Shad', 'Bluegill', 'Crawfish', 'Worms'],
    seasonality: 'Most active spring through fall, slower in winter',
    bestTimes: 'Early morning and late evening during warm months',
    lures: [
      {
        name: 'Senko Worm',
        type: 'Soft Plastic',
        priceRange: '$8-12',
        effectiveness: 'High',
        description: 'Versatile wacky rig bait, works year-round',
        tips: 'Use a slow, twitching retrieve for best results.',
        comments: 'A favorite among tournament anglers.'
      },
      {
        name: 'Spinnerbait',
        type: 'Blade Bait',
        priceRange: '$6-15',
        effectiveness: 'High',
        description: 'Great for covering water, works around structure',
        tips: 'Use in murky water for flash and vibration.',
        comments: 'Effective in spring and fall.'
      },
      {
        name: 'Crankbait',
        type: 'Hard Bait',
        priceRange: '$8-20',
        effectiveness: 'Medium',
        description: 'Diving lures that mimic baitfish',
        tips: 'Use a steady retrieve and vary the depth.',
        comments: 'Best in cooler months when fish are deeper.'
      }
    ]
  },
  {
    id: 'northern-pike',
    name: 'Northern Pike',
    slotSize: '24" minimum',
    description: 'Aggressive predator with razor-sharp teeth. Known for explosive strikes and powerful runs.',
    habitat: 'Weedy areas, drop-offs, and ambush points near vegetation',
    feedingTimes: ['Early morning', 'Late afternoon', 'Low light'],
    baitfish: ['Perch', 'Suckers', 'Small pike', 'Frogs'],
    seasonality: 'Active year-round, peak activity in spring and fall',
    bestTimes: 'Cooler water periods, overcast days',
    lures: [
      {
        name: 'Spoon',
        type: 'Metal Lure',
        priceRange: '$4-10',
        effectiveness: 'High',
        description: 'Classic pike lure, flashy and erratic action',
        tips: 'Use a jerking retrieve to mimic injured baitfish.',
        comments: 'Effective in weedy areas and around structure.'
      },
      {
        name: 'Large Spinnerbait',
        type: 'Blade Bait',
        priceRange: '$8-18',
        effectiveness: 'High',
        description: 'Big profile bait for aggressive pike',
        tips: 'Use in shallow water during warmer months.',
        comments: 'Effective for targeting pike in warmer conditions.'
      },
      {
        name: 'Jerkbait',
        type: 'Hard Bait',
        priceRange: '$12-25',
        effectiveness: 'Medium',
        description: 'Suspending lures with erratic action',
        tips: 'Use a twitching retrieve to trigger strikes.',
        comments: 'Great for clear water conditions.'
      }
    ]
  }
];

const saltwaterSpecies: SpeciesInfo[] = [
  {
    id: 'striped-bass',
    name: 'Striped Bass',
    slotSize: 'Slot: 28"-31"',
    description: 'Premier game fish of the Atlantic coast. Strong fighters that provide excellent table fare.',
    habitat: 'Coastal waters, estuaries, rocky shores, and structure',
    feedingTimes: ['Dawn', 'Dusk', 'Moving tides', 'Low light'],
    baitfish: ['Bunker', 'Herring', 'Eels', 'Sandworms'],
    seasonality: 'Spring through fall migration, winter in deeper water',
    bestTimes: 'Moving water during tide changes',
    lures: [
      {
        name: 'Hogy Heavy Minnow Jig',
        type: 'Jig',
        priceRange: '$9-15',
        effectiveness: 'High',
        description: 'Small metal jig that imitates rainbait',
        tips: 'Fish near structure and vary retrieve speed.',
        comments: 'Great when fish are blitzing on small baitfish and passing up larger offerings'
      },
      {
        name: 'SP Minnow',
        type: 'Lipped Swimmer',
        priceRange: '$8-15',
        effectiveness: 'High',
        description: 'Realistic baitfish imitation',
        tips: 'Use a steady retrieve with occasional twitches.',
        comments: 'Effective in clear water and during warmer months.'
      },
      {
        name: 'Doc Spook',
        type: 'Surface Lure',
        priceRange: '$22-30',
        effectiveness: 'High',
        description: 'Exciting surface action during feeding frenzies',
        tips: 'Use during low light conditions over shallow structurefor best results.',
        comments: 'Great for early morning or late evening topwater action.'
      }
    ]
  },
  {
    id: 'fluke',
    name: 'Summer Flounder (Fluke)',
    slotSize: '19" minimum',
    description: 'Popular flatfish known for excellent table fare and challenging bottom fishing.',
    habitat: 'Sandy bottoms, drop-offs, channels, and structure edges',
    feedingTimes: ['Moving tides', 'Early morning', 'Late afternoon'],
    baitfish: ['Spearing', 'Squid', 'Crabs', 'Killifish'],
    seasonality: 'Late spring through early fall in shallow water',
    bestTimes: 'Incoming tide over sandy flats',
    lures: [
      {
        name: 'Bucktail with Gulp',
        type: 'Jig Combo',
        priceRange: '$5-10',
        effectiveness: 'High',
        description: 'Bucktail jig tipped with Gulp! soft bait',
        tips: 'Very Bucktail and gulp color',
        comments: 'Really targets fluke for some reason.'
      },
      {
        name: 'Bucktail with Squid',
        type: 'Jig Combo',
        priceRange: '$4-8',
        effectiveness: 'High',
        description: 'Bucktail jig tipped with strip of squid',
        tips: 'Tip a pink or white bucktail with a whole squid head',
        comments: 'A tried-and-true method for fluke fishing.'
      },
      {
        name: 'Hogy Sandeel Jig',
        type: 'Jig',
        priceRange: '$8-15',
        effectiveness: 'High',
        description: 'classic Hogy sandeel jig... It works!',
        tips: 'Jig in an area where the bottom is sandy and leave if Sea Robins start to bite.',
        comments: 'prone to bycatch, and can snag easily',
      }
    ]
  }
];

export default function SpeciesScreen() {
  const { fishingType } = useFishing();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const speciesList = fishingType === 'freshwater' ? freshwaterSpecies : saltwaterSpecies;

  const openSpeciesDetail = (species: SpeciesInfo) => {
    setSelectedSpecies(species);
    setModalVisible(true);
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'High': return '#72E5A2';
      case 'Medium': return '#FFD93D';
      case 'Low': return '#FF8A8A';
      default: return '#9BB0CC';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {fishingType === 'freshwater' ? '🏞️ Freshwater' : '🌊 Saltwater'} Species Guide
        </Text>
        <Text style={styles.subtitle}>
          Local regulations, feeding habits, and proven lures
        </Text>
      </View>

      <FlatList
        data={speciesList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <Pressable
            style={styles.speciesCard}
            onPress={() => openSpeciesDetail(item)}
          >
            <View style={styles.speciesHeader}>
              <Text style={styles.speciesName}>{item.name}</Text>
              <Text style={styles.slotSize}>{item.slotSize}</Text>
            </View>
            <Text style={styles.speciesDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.speciesFooter}>
              <Text style={styles.feedingTime}>
                🕐 {item.feedingTimes.slice(0, 2).join(' • ')}
              </Text>
              <Text style={styles.tapHint}>Tap for details →</Text>
            </View>
          </Pressable>
        )}
      />

      {/* Species Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedSpecies && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSpecies.name}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.regulationSection}>
                <Text style={styles.sectionTitle}>Legal Size</Text>
                <Text style={styles.slotSizeLarge}>{selectedSpecies.slotSize}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Habitat & Behavior</Text>
                <Text style={styles.infoText}>{selectedSpecies.description}</Text>
                <Text style={styles.infoText}>{selectedSpecies.habitat}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Feeding Times</Text>
                <View style={styles.chipContainer}>
                  {selectedSpecies.feedingTimes.map((time) => (
                    <View key={time} style={styles.timeChip}>
                      <Text style={styles.timeChipText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Natural Bait</Text>
                <View style={styles.chipContainer}>
                  {selectedSpecies.baitfish.map((bait) => (
                    <View key={bait} style={styles.baitChip}>
                      <Text style={styles.baitChipText}>{bait}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Recommended Lures</Text>
                {selectedSpecies.lures.map((lure, index) => (
                  <View key={index} style={styles.lureCard}>
                    <View style={styles.lureHeader}>
                      <Text style={styles.lureName}>{lure.name}</Text>
                      <View style={styles.lureRating}>
                        <View
                          style={[
                            styles.effectivenessBadge,
                            { backgroundColor: getEffectivenessColor(lure.effectiveness) }
                          ]}
                        >
                          <Text style={styles.effectivenessText}>
                            {lure.effectiveness}
                          </Text>
                        </View>
                        <Text style={styles.priceText}>{lure.priceRange}</Text>
                      </View>
                    </View>
                    <Text style={styles.lureType}>{lure.type}</Text>
                    <Text style={styles.lureDescription}>{lure.description}</Text>
                    
                    {/* Future affiliate link button */}
                    <Pressable style={styles.buyButton}>
                      <Text style={styles.buyButtonText}>🛒 Available Soon!</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Best Times & Conditions</Text>
                <Text style={styles.infoText}>{selectedSpecies.bestTimes}</Text>
                <Text style={styles.infoText}>{selectedSpecies.seasonality}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A44',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E8ECF1',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9BB0CC',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  speciesCard: {
    backgroundColor: '#121A2B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2A44',
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8ECF1',
    flex: 1,
  },
  slotSize: {
    fontSize: 12,
    color: '#9BB0CC',
    fontWeight: '600',
  },
  speciesDescription: {
    fontSize: 14,
    color: '#AFC3E1',
    lineHeight: 20,
    marginBottom: 12,
  },
  speciesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedingTime: {
    fontSize: 12,
    color: '#72E5A2',
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 12,
    color: '#7E8BA0',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A44',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E8ECF1',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1A2440',
  },
  closeButtonText: {
    color: '#E8ECF1',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  regulationSection: {
    backgroundColor: '#1A2440',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  slotSizeLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD93D',
  },
  infoSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8ECF1',
  },
  infoText: {
    fontSize: 14,
    color: '#AFC3E1',
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: '#72E5A2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeChipText: {
    color: '#0B1220',
    fontSize: 12,
    fontWeight: '600',
  },
  baitChip: {
    backgroundColor: '#1A2440',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  baitChipText: {
    color: '#E8ECF1',
    fontSize: 12,
    fontWeight: '600',
  },
  lureCard: {
    backgroundColor: '#1A2440',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3A63',
    marginBottom: 12,
  },
  lureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lureName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8ECF1',
    flex: 1,
  },
  lureRating: {
    alignItems: 'flex-end',
    gap: 4,
  },
  effectivenessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  effectivenessText: {
    color: '#0B1220',
    fontSize: 10,
    fontWeight: '700',
  },
  priceText: {
    color: '#9BB0CC',
    fontSize: 12,
    fontWeight: '600',
  },
  lureType: {
    fontSize: 12,
    color: '#72E5A2',
    fontWeight: '600',
    marginBottom: 6,
  },
  lureDescription: {
    fontSize: 13,
    color: '#AFC3E1',
    lineHeight: 18,
    marginBottom: 12,
  },
  buyButton: {
    backgroundColor: '#72E5A2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buyButtonText: {
    color: '#0B1220',
    fontSize: 12,
    fontWeight: '700',
  },
});
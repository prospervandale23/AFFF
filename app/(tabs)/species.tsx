import { FishingTheme } from '@/constants/FishingTheme';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  tips: string;
  comments?: string;
  affiliateUrl?: string;
}

// Sample species data
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
    name: 'Striped Bass (Striper)',
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
        tips: 'Use during low light conditions over shallow structure for best results.',
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
        tips: 'Vary bucktail and gulp color',
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
        description: 'Classic Hogy sandeel jig... It works!',
        tips: 'Jig in an area where the bottom is sandy and leave if Sea Robins start to bite.',
        comments: 'Prone to bycatch, and can snag easily',
      }
    ]
  },
    {
    id: 'tautog',
    name: 'Tautog (Blackfish)',
    slotSize: '16" minimum',
    description: 'Hard-fighting bottom fish known for their strength and skill in stealing bait.',
    habitat: 'Reefs, Wrecks, Jetties and Rock Piles',
    feedingTimes: ['Slack tide', 'Mid-Day', 'Late afternoon'],
    baitfish: ['Crabs', 'Mussels', 'Lobsters', 'Peanut-Bunker'],
    seasonality: 'Early spring and late fall in shallow water',
    bestTimes: 'Slack tide around rocky structure',
    lures: [
      {
        name: 'Tautog Jig with half crab',
        type: 'Jig Combo',
        priceRange: '$5-10',
        effectiveness: 'High',
        description: 'A crab cut in half and put over the hook of a tautog jig',
        tips: 'Vary jig color and weight based on current, depth, and water clarity',
        comments: 'Use scissors to cut the crab in half, remove legs, and hook through the leg holes for best bait retention.'
      }
    ]
  },
    {
    id: 'Scup',
    name: 'Porgy (Scup)',
    slotSize: '9" minimum',
    description: 'Abundant fish easily targeted from shore.',
    habitat: 'Sandy bottoms, drop-offs, channels, and structure edges',
    feedingTimes: ['Moving tides', 'Early morning', 'Late afternoon'],
    baitfish: ['Sand Worms', 'Squid', 'Clams', 'Killifish'],
    seasonality: 'Late spring through early fall in shallow water, especially around sandy bottoms',
    bestTimes: 'Moving tides in the middle of the day',
    lures: [
      {
        name: 'Hi-Lo Rig with sandworm',
        type: 'Bait Rig',
        priceRange: '$2-5',
        effectiveness: 'High',
        description: 'Sinker tied below two j-hooks tipped with sandworms',
        tips: 'Try to get bait onto a sandy patch near the edge of a reef or by some pilings.',
        comments: 'Scup have hard small mouths, so use smaller hooks and let them eat the bait.'
      },
      {
        name: 'Bucktail with Squid',
        type: 'Jig Combo',
        priceRange: '$4-8',
        effectiveness: 'High',
        description: 'Bucktail jig tipped with strip of squid',
        tips: 'Tip a pink or white bucktail with a whole squid head',
        comments: 'A tried-and-true method for fluke fishing.'
      }
    ]
  }
];

export default function SpeciesScreen() {
  const insets = useSafeAreaInsets();
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
      case 'High': return FishingTheme.colors.status.excellent;
      case 'Medium': return FishingTheme.colors.status.good;
      case 'Low': return FishingTheme.colors.status.fair;
      default: return FishingTheme.colors.text.muted;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {fishingType === 'freshwater' ? 'FRESHWATER' : 'SALTWATER'} SPECIES GUIDE
        </Text>
        <Text style={styles.subtitle}>
          Local regulations, feeding habits, and proven lures
        </Text>
      </View>

      <FlatList
        data={speciesList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={styles.speciesCard}
            onPress={() => openSpeciesDetail(item)}
          >
            <View style={styles.speciesHeader}>
              <Text style={styles.speciesName}>{item.name}</Text>
              <View style={styles.slotBadge}>
                <Text style={styles.slotSize}>{item.slotSize}</Text>
              </View>
            </View>
            <Text style={styles.speciesDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.speciesFooter}>
              <View style={styles.feedingTimeContainer}>
                <Text style={styles.feedingLabel}>BEST TIMES:</Text>
                <Text style={styles.feedingTime}>
                  {item.feedingTimes.slice(0, 2).join(' • ')}
                </Text>
              </View>
              <Text style={styles.tapHint}>TAP FOR DETAILS →</Text>
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
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSpecies.name.toUpperCase()}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.regulationSection}>
                <Text style={styles.regulationLabel}>LEGAL SIZE</Text>
                <Text style={styles.slotSizeLarge}>{selectedSpecies.slotSize}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>HABITAT & BEHAVIOR</Text>
                <Text style={styles.infoText}>{selectedSpecies.description}</Text>
                <Text style={styles.infoText}>{selectedSpecies.habitat}</Text>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>FEEDING TIMES</Text>
                <View style={styles.chipContainer}>
                  {selectedSpecies.feedingTimes.map((time) => (
                    <View key={time} style={styles.timeChip}>
                      <Text style={styles.timeChipText}>{time}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>NATURAL BAIT</Text>
                <View style={styles.chipContainer}>
                  {selectedSpecies.baitfish.map((bait) => (
                    <View key={bait} style={styles.baitChip}>
                      <Text style={styles.baitChipText}>{bait}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>RECOMMENDED LURES</Text>
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
                            {lure.effectiveness.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.priceText}>{lure.priceRange}</Text>
                      </View>
                    </View>
                    <Text style={styles.lureType}>{lure.type}</Text>
                    <Text style={styles.lureDescription}>{lure.description}</Text>
                    
                    {lure.tips && (
                      <View style={styles.tipsContainer}>
                        <Text style={styles.tipsLabel}>TIP:</Text>
                        <Text style={styles.tipsText}>{lure.tips}</Text>
                      </View>
                    )}
                    
                    {lure.comments && (
                      <View style={styles.commentsContainer}>
                        <Text style={styles.commentsText}>"{lure.comments}"</Text>
                      </View>
                    )}
                    
                    <Pressable style={styles.buyButton}>
                      <Text style={styles.buyButtonText}>AVAILABLE SOON</Text>
                    </Pressable>
                  </View>
                ))}
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>BEST TIMES & CONDITIONS</Text>
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
    backgroundColor: FishingTheme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: FishingTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  speciesCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    ...FishingTheme.shadows.sm,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 18,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    flex: 1,
    letterSpacing: 0.3,
  },
  slotBadge: {
    backgroundColor: FishingTheme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  slotSize: {
    fontSize: 11,
    color: FishingTheme.colors.text.secondary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  speciesDescription: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  speciesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedingTimeContainer: {
    flex: 1,
  },
  feedingLabel: {
    fontSize: 10,
    color: FishingTheme.colors.text.tertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  feedingTime: {
    fontSize: 12,
    color: FishingTheme.colors.darkGreen,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 11,
    color: FishingTheme.colors.text.muted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    flex: 1,
    letterSpacing: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: FishingTheme.colors.darkGreen,
    fontSize: 20,
    fontWeight: '400',
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  regulationSection: {
    backgroundColor: FishingTheme.colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FishingTheme.colors.darkGreen,
    borderLeftWidth: 6,
  },
  regulationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: FishingTheme.colors.text.tertiary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  slotSizeLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 0.5,
  },
  infoSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 0.8,
  },
  infoText: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  timeChipText: {
    color: FishingTheme.colors.cream,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  baitChip: {
    backgroundColor: FishingTheme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  baitChipText: {
    color: FishingTheme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  lureCard: {
    backgroundColor: FishingTheme.colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    marginBottom: 12,
  },
  lureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lureName: {
    fontSize: 16,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    flex: 1,
    letterSpacing: 0.3,
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
    color: FishingTheme.colors.cream,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceText: {
    color: FishingTheme.colors.text.tertiary,
    fontSize: 12,
    fontWeight: '700',
  },
  lureType: {
    fontSize: 12,
    color: FishingTheme.colors.darkGreen,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  lureDescription: {
    fontSize: 13,
    color: FishingTheme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  tipsContainer: {
    backgroundColor: FishingTheme.colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  tipsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: FishingTheme.colors.text.tertiary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tipsText: {
    fontSize: 12,
    color: FishingTheme.colors.text.primary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  commentsContainer: {
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: FishingTheme.colors.darkGreen,
    marginBottom: 12,
  },
  commentsText: {
    fontSize: 12,
    color: FishingTheme.colors.text.secondary,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  buyButton: {
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  buyButtonText: {
    color: FishingTheme.colors.cream,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
import { FishingTheme } from '@/constants/FishingTheme';
import { useFishing } from '@/contexts/FishingContext';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '../../components/Closebutton';
import {
  Lure,
  LureWithCount,
  createLureWithPhoto,
  getLuresForFishingType,
  getSpeciesLures,
  recommendLure,
} from '../../lib/lures';
import { supabase } from '../../lib/supabase';

interface SpeciesInfo {
  id: string;
  name: string;
  slotSize: string;
  description: string;
  habitat: string;
  feedingTimes: string[];
  baitfish: string[];
  seasonality: string;
  bestTimes: string;
}

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
  },
];

const saltwaterSpecies: SpeciesInfo[] = [
  {
    id: 'striped-bass',
    name: 'Striped Bass (Striper)',
    slotSize: 'Slot: 28"-31"',
    description: 'Premier game fish of the Atlantic coast. Please release these beautiful beasts.',
    habitat: 'Coastal waters, estuaries, rocky shores, and structure',
    feedingTimes: ['Dawn', 'Dusk', 'Moving tides', 'Low light'],
    baitfish: ['Bunker', 'Herring', 'Eels', 'Sandworms'],
    seasonality: 'Spring through fall migration, winter in deeper water',
    bestTimes: 'Moving water during tide changes',
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
  },
  {
    id: 'Scup',
    name: 'Porgy (Scup)',
    slotSize: '9" minimum',
    description: 'Abundant bottom fish easily targeted from shore.',
    habitat: 'Sandy bottoms, drop-offs, channels, and structure edges',
    feedingTimes: ['Moving tides', 'Early morning', 'Late afternoon'],
    baitfish: ['Sand Worms', 'Squid', 'Clams', 'Killifish'],
    seasonality: 'Late spring through early fall in shallow water, especially around sandy bottoms',
    bestTimes: 'Moving tides in the middle of the day',
  },
];

function LureThumbnail({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={styles.lureThumbnail}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <View style={styles.lureThumbnailPlaceholder}>
      <Text style={styles.lureThumbnailIcon}>🎣</Text>
    </View>
  );
}

export default function SpeciesScreen() {
  const insets = useSafeAreaInsets();
  const { fishingType, setFishingType } = useFishing();
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Auth
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Community lures
  const [speciesLures, setSpeciesLures] = useState<LureWithCount[]>([]);
  const [allLures, setAllLures] = useState<Lure[]>([]);
  const [loadingLures, setLoadingLures] = useState(false);
  const [recommending, setRecommending] = useState(false);

  // Recommend dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // New lure modal
  const [newLureModalOpen, setNewLureModalOpen] = useState(false);
  const [newLureName, setNewLureName] = useState('');
  const [newLurePrice, setNewLurePrice] = useState('');
  const [newLurePhotoUri, setNewLurePhotoUri] = useState<string | null>(null);
  const [submittingLure, setSubmittingLure] = useState(false);

  const speciesList = fishingType === 'freshwater' ? freshwaterSpecies : saltwaterSpecies;
  const isFresh = fishingType === 'freshwater';
  const activeFishingType: 'freshwater' | 'saltwater' = fishingType === 'freshwater' ? 'freshwater' : 'saltwater';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (modalVisible && selectedSpecies && currentUserId) {
      loadLures();
    }
    if (!modalVisible) {
      setSpeciesLures([]);
      setAllLures([]);
      setDropdownOpen(false);
      setNewLureModalOpen(false);
      setNewLureName('');
      setNewLurePrice('');
      setNewLurePhotoUri(null);
    }
  }, [modalVisible, selectedSpecies?.id, currentUserId]);

  async function loadLures() {
    if (!selectedSpecies || !currentUserId) return;
    setLoadingLures(true);
    try {
      const [sl, al] = await Promise.all([
        getSpeciesLures(selectedSpecies.id, currentUserId),
        getLuresForFishingType(activeFishingType),
      ]);
      setSpeciesLures(sl);
      setAllLures(al);
    } catch {
      // silently fail — empty state handles it
    } finally {
      setLoadingLures(false);
    }
  }

  async function handleRecommendExisting(lureId: string) {
    if (!currentUserId || !selectedSpecies || recommending) return;
    setRecommending(true);
    try {
      await recommendLure(lureId, selectedSpecies.id, currentUserId);
      await loadLures();
      setDropdownOpen(false);
    } catch (err: any) {
      if (err?.code !== '23505') {
        Alert.alert('Error', 'Could not add recommendation. Please try again.');
      }
    } finally {
      setRecommending(false);
    }
  }

  function pickLurePhoto() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) takeLurePhoto();
          else if (buttonIndex === 2) chooseLureFromLibrary();
        }
      );
    } else {
      Alert.alert('Lure Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takeLurePhoto },
        { text: 'Choose from Library', onPress: chooseLureFromLibrary },
      ]);
    }
  }

  async function takeLurePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setNewLurePhotoUri(result.assets[0].uri);
  }

  async function chooseLureFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setNewLurePhotoUri(result.assets[0].uri);
  }

  async function handleCreateAndRecommend() {
    if (!newLureName.trim()) {
      Alert.alert('Missing Info', 'Please enter a lure name.');
      return;
    }
    if (!currentUserId || !selectedSpecies) return;
    setSubmittingLure(true);
    try {
      const lure = await createLureWithPhoto(
        newLureName,
        activeFishingType,
        newLurePrice,
        newLurePhotoUri,
        currentUserId
      );
      await recommendLure(lure.id, selectedSpecies.id, currentUserId);
      setNewLureModalOpen(false);
      setNewLureName('');
      setNewLurePrice('');
      setNewLurePhotoUri(null);
      await loadLures();
    } catch (err: any) {
      if (err?.code === '23505') {
        Alert.alert(
          'Lure Already Exists',
          'A lure with that name already exists for this fishing type. Find it in the dropdown to recommend it.'
        );
      } else {
        Alert.alert('Error', err?.message || err?.error_description || JSON.stringify(err));
      }
    } finally {
      setSubmittingLure(false);
    }
  }

  const openSpeciesDetail = (species: SpeciesInfo) => {
    setSelectedSpecies(species);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>
            {isFresh ? 'FRESHWATER' : 'SALTWATER'} SPECIES GUIDE
          </Text>
          <View style={styles.toggleChips}>
            <Pressable
              style={[styles.chip, isFresh && styles.chipActive]}
              onPress={() => setFishingType('freshwater')}
            >
              <Text style={[styles.chipText, isFresh && styles.chipTextActive]}>Fresh</Text>
            </Pressable>
            <Pressable
              style={[styles.chip, !isFresh && styles.chipActive]}
              onPress={() => setFishingType('saltwater')}
            >
              <Text style={[styles.chipText, !isFresh && styles.chipTextActive]}>Salt</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtitle}>
          Local regulations, feeding habits, and proven lures
        </Text>
      </View>

      <FlatList
        data={speciesList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <Pressable style={styles.speciesCard} onPress={() => openSpeciesDetail(item)}>
            <View style={styles.speciesHeader}>
              <Text style={styles.speciesName}>{item.name}</Text>
              <View style={styles.slotBadge}>
                <Text style={styles.slotSize}>{item.slotSize}</Text>
              </View>
            </View>
            <Text style={styles.speciesDescription} numberOfLines={2}>{item.description}</Text>
            <View style={styles.speciesFooter}>
              <View style={styles.feedingTimeContainer}>
                <Text style={styles.feedingLabel}>BEST TIMES:</Text>
                <Text style={styles.feedingTime}>{item.feedingTimes.slice(0, 2).join(' • ')}</Text>
              </View>
              <Text style={styles.tapHint}>TAP FOR DETAILS →</Text>
            </View>
          </Pressable>
        )}
      />

      {/* ── Species Detail Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedSpecies && (
          <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            {/* ── New Lure overlay (inside pageSheet to avoid nested-Modal iOS bug) ── */}
            {newLureModalOpen && (
              <KeyboardAvoidingView
                style={StyleSheet.absoluteFillObject}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                pointerEvents="box-none"
              >
                <Pressable
                  style={styles.newLureBackdrop}
                  onPress={() => setNewLureModalOpen(false)}
                >
                  <Pressable style={styles.newLureCard} onPress={() => {}}>
                    <View style={styles.newLureHeader}>
                      <Text style={styles.newLureTitle}>RECOMMEND NEW LURE</Text>
                      <CloseButton onPress={() => setNewLureModalOpen(false)} iconName="chevron-down" />
                    </View>

                    <ScrollView contentContainerStyle={styles.newLureContent} keyboardShouldPersistTaps="handled">
                      <Pressable style={styles.photoPickerBtn} onPress={pickLurePhoto}>
                        {newLurePhotoUri ? (
                          <Image source={{ uri: newLurePhotoUri }} style={styles.photoPickerPreview} />
                        ) : (
                          <Text style={styles.photoPickerLabel}>+ ADD PHOTO{'\n'}(optional)</Text>
                        )}
                      </Pressable>

                      <Text style={styles.newLureLabel}>LURE NAME *</Text>
                      <TextInput
                        style={styles.newLureInput}
                        value={newLureName}
                        onChangeText={setNewLureName}
                        placeholder="e.g. Hogy Heavy Minnow"
                        placeholderTextColor={FishingTheme.colors.text.muted}
                      />

                      <Text style={styles.newLureLabel}>PRICE RANGE</Text>
                      <TextInput
                        style={styles.newLureInput}
                        value={newLurePrice}
                        onChangeText={setNewLurePrice}
                        placeholder="e.g. $8-12"
                        placeholderTextColor={FishingTheme.colors.text.muted}
                      />

                      <Pressable
                        style={[styles.newLureSubmitBtn, submittingLure && styles.newLureSubmitBtnDisabled]}
                        onPress={handleCreateAndRecommend}
                        disabled={submittingLure}
                      >
                        {submittingLure ? (
                          <ActivityIndicator color={FishingTheme.colors.darkGreen} />
                        ) : (
                          <Text style={styles.newLureSubmitText}>ADD & RECOMMEND</Text>
                        )}
                      </Pressable>
                    </ScrollView>
                  </Pressable>
                </Pressable>
              </KeyboardAvoidingView>
            )}

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSpecies.name.toUpperCase()}</Text>
              <CloseButton onPress={() => setModalVisible(false)} iconName="chevron-down" />
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

              {/* ── RECOMMENDED LURES ──────────────────────────────────────── */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>RECOMMENDED LURES</Text>

                {/* Recommend a Lure toggle */}
                <Pressable
                  style={styles.recommendBtn}
                  onPress={() => setDropdownOpen(v => !v)}
                >
                  <Text style={styles.recommendBtnText}>RECOMMEND A LURE</Text>
                  <Text style={styles.recommendBtnArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
                </Pressable>

                {/* Dropdown */}
                {dropdownOpen && (
                  <View style={styles.dropdown}>
                    {/* Recommend New Lure — always first */}
                    <Pressable
                      style={styles.dropdownNewItem}
                      onPress={() => {
                        setDropdownOpen(false);
                        setNewLureModalOpen(true);
                      }}
                    >
                      <Text style={styles.dropdownNewItemText}>+ Recommend New Lure</Text>
                    </Pressable>

                    {allLures.length > 0 && <View style={styles.dropdownDivider} />}

                    {allLures.map((lure) => {
                      const alreadyRec = speciesLures.find(sl => sl.id === lure.id)?.user_has_recommended ?? false;
                      return (
                        <Pressable
                          key={lure.id}
                          style={[styles.dropdownItem, alreadyRec && styles.dropdownItemDone]}
                          onPress={() => !alreadyRec && handleRecommendExisting(lure.id)}
                          disabled={alreadyRec || recommending}
                        >
                          <Text style={[styles.dropdownItemText, alreadyRec && styles.dropdownItemTextDone]}>
                            {lure.name}
                          </Text>
                          {alreadyRec && <Text style={styles.dropdownCheck}>✓</Text>}
                        </Pressable>
                      );
                    })}

                    {allLures.length === 0 && (
                      <Text style={styles.dropdownEmpty}>
                        No lures in the pool yet — be the first to add one!
                      </Text>
                    )}
                  </View>
                )}

                {/* Sorted lure cards */}
                {loadingLures ? (
                  <ActivityIndicator
                    color={FishingTheme.colors.darkGreen}
                    style={{ marginTop: 16 }}
                  />
                ) : speciesLures.length === 0 ? (
                  <View style={styles.noLuresBox}>
                    <Text style={styles.noLuresText}>No lures recommended yet.</Text>
                    <Text style={styles.noLuresSubtext}>Tap "Recommend a Lure" to be the first!</Text>
                  </View>
                ) : (
                  speciesLures.map((lure) => (
                    <View key={lure.id} style={styles.lureCommunityCard}>
                      <LureThumbnail uri={lure.photo_url} />
                      <View style={styles.lureInfo}>
                        <Text style={styles.lureName}>{lure.name}</Text>
                        {lure.price_range ? (
                          <Text style={styles.lurePrice}>{lure.price_range}</Text>
                        ) : null}
                        <Text style={styles.lureCount}>
                          {lure.recommendation_count}{' '}
                          {lure.recommendation_count === 1 ? 'recommendation' : 'recommendations'}
                        </Text>
                      </View>
                      {lure.user_has_recommended && (
                        <View style={styles.myRecBadge}>
                          <Text style={styles.myRecBadgeText}>✓</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
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
  container: { flex: 1, backgroundColor: FishingTheme.colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: FishingTheme.colors.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 1, flex: 1, marginRight: 10 },
  subtitle: { fontSize: 13, color: FishingTheme.colors.text.tertiary, fontWeight: '500' },

  toggleChips: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 2, borderColor: FishingTheme.colors.border, backgroundColor: FishingTheme.colors.card },
  chipActive: { backgroundColor: FishingTheme.colors.darkGreen, borderColor: FishingTheme.colors.darkGreen },
  chipText: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.text.secondary },
  chipTextActive: { color: FishingTheme.colors.cream, fontWeight: '800' },

  listContainer: { padding: 20, gap: 12 },
  speciesCard: { backgroundColor: FishingTheme.colors.card, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: FishingTheme.colors.border, ...FishingTheme.shadows.sm },
  speciesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  speciesName: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen, flex: 1, letterSpacing: 0.3 },
  slotBadge: { backgroundColor: FishingTheme.colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: FishingTheme.colors.border },
  slotSize: { fontSize: 11, color: FishingTheme.colors.text.secondary, fontWeight: '700', letterSpacing: 0.3 },
  speciesDescription: { fontSize: 14, color: FishingTheme.colors.text.secondary, lineHeight: 20, marginBottom: 12 },
  speciesFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedingTimeContainer: { flex: 1 },
  feedingLabel: { fontSize: 10, color: FishingTheme.colors.text.tertiary, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  feedingTime: { fontSize: 12, color: FishingTheme.colors.darkGreen, fontWeight: '600' },
  tapHint: { fontSize: 11, color: FishingTheme.colors.text.muted, fontWeight: '600', letterSpacing: 0.3 },

  // Species detail modal
  modalContainer: { flex: 1, backgroundColor: FishingTheme.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: FishingTheme.colors.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: FishingTheme.colors.darkGreen, flex: 1, letterSpacing: 1 },
  modalContent: { padding: 20, gap: 20 },
  regulationSection: { backgroundColor: FishingTheme.colors.card, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: FishingTheme.colors.darkGreen, borderLeftWidth: 6 },
  regulationLabel: { fontSize: 11, fontWeight: '800', color: FishingTheme.colors.text.tertiary, marginBottom: 4, letterSpacing: 1 },
  slotSizeLarge: { fontSize: 20, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 0.5 },
  infoSection: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 0.8 },
  infoText: { fontSize: 14, color: FishingTheme.colors.text.secondary, lineHeight: 20 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { backgroundColor: FishingTheme.colors.darkGreen, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 2, borderColor: FishingTheme.colors.forestGreen },
  timeChipText: { color: FishingTheme.colors.cream, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  baitChip: { backgroundColor: FishingTheme.colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 2, borderColor: FishingTheme.colors.border },
  baitChipText: { color: FishingTheme.colors.text.primary, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  // Recommend a Lure button
  recommendBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: FishingTheme.colors.darkGreen, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 2, borderColor: FishingTheme.colors.forestGreen },
  recommendBtnText: { color: FishingTheme.colors.cream, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  recommendBtnArrow: { color: FishingTheme.colors.cream, fontSize: 12, fontWeight: '700' },

  // Dropdown
  dropdown: { backgroundColor: FishingTheme.colors.card, borderRadius: 10, borderWidth: 2, borderColor: FishingTheme.colors.border, overflow: 'hidden' },
  dropdownNewItem: { paddingHorizontal: 14, paddingVertical: 13, backgroundColor: FishingTheme.colors.background },
  dropdownNewItemText: { fontSize: 14, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 0.3 },
  dropdownDivider: { height: 1, backgroundColor: FishingTheme.colors.border },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: FishingTheme.colors.border },
  dropdownItemDone: { backgroundColor: 'rgba(114,229,162,0.08)' },
  dropdownItemText: { fontSize: 14, fontWeight: '600', color: FishingTheme.colors.text.primary },
  dropdownItemTextDone: { color: FishingTheme.colors.text.muted },
  dropdownCheck: { fontSize: 14, fontWeight: '800', color: FishingTheme.colors.darkGreen },
  dropdownEmpty: { paddingHorizontal: 14, paddingVertical: 13, fontSize: 13, color: FishingTheme.colors.text.muted, fontStyle: 'italic' },

  // Community lure cards
  noLuresBox: { paddingVertical: 20, alignItems: 'center', gap: 6 },
  noLuresText: { fontSize: 14, fontWeight: '700', color: FishingTheme.colors.text.secondary },
  noLuresSubtext: { fontSize: 12, color: FishingTheme.colors.text.muted },
  lureCommunityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: FishingTheme.colors.card, borderRadius: 12, borderWidth: 2, borderColor: FishingTheme.colors.border, padding: 12, gap: 12 },
  lureThumbnail: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: FishingTheme.colors.border },
  lureThumbnailPlaceholder: { width: 56, height: 56, borderRadius: 8, backgroundColor: FishingTheme.colors.background, borderWidth: 1, borderColor: FishingTheme.colors.border, justifyContent: 'center', alignItems: 'center' },
  lureThumbnailIcon: { fontSize: 24 },
  lureInfo: { flex: 1, gap: 2 },
  lureName: { fontSize: 15, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 0.2 },
  lurePrice: { fontSize: 12, fontWeight: '600', color: FishingTheme.colors.text.tertiary },
  lureCount: { fontSize: 12, fontWeight: '600', color: FishingTheme.colors.text.secondary },
  myRecBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: FishingTheme.colors.darkGreen, justifyContent: 'center', alignItems: 'center' },
  myRecBadgeText: { color: FishingTheme.colors.cream, fontSize: 13, fontWeight: '800' },

  // New lure modal
  newLureBackdrop: { flex: 1, backgroundColor: FishingTheme.colors.overlay, justifyContent: 'center', padding: 16, zIndex: 10 },
  newLureCard: { backgroundColor: FishingTheme.colors.cream, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: FishingTheme.colors.darkGreen, maxHeight: '80%' },
  newLureHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: FishingTheme.colors.border },
  newLureTitle: { color: FishingTheme.colors.darkGreen, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  newLureContent: { padding: 16, gap: 10 },
  photoPickerBtn: { alignSelf: 'center', width: 100, height: 100, borderRadius: 12, backgroundColor: FishingTheme.colors.card, borderWidth: 2, borderColor: FishingTheme.colors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  photoPickerPreview: { width: 100, height: 100, borderRadius: 12 },
  photoPickerLabel: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.text.muted, textAlign: 'center', letterSpacing: 0.3, lineHeight: 18 },
  newLureLabel: { color: FishingTheme.colors.text.tertiary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
  newLureInput: { backgroundColor: FishingTheme.colors.card, color: FishingTheme.colors.text.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 2, borderColor: FishingTheme.colors.border, fontSize: 15 },
  newLureSubmitBtn: { backgroundColor: '#72E5A2', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 2, borderColor: FishingTheme.colors.darkGreen },
  newLureSubmitBtnDisabled: { opacity: 0.6 },
  newLureSubmitText: { fontSize: 15, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 0.5 },
});

import { useFishing } from '@/contexts/FishingContext';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { getPotentialMatches, saveUserLocation, startConversation, UserProfile } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXPERIENCE_OPTIONS = ['all', 'Beginner', 'Intermediate', 'Advanced'] as const;
type ExperienceFilter = typeof EXPERIENCE_OPTIONS[number];

const FISHING_TYPE_OPTIONS = ['all', 'freshwater', 'saltwater'] as const;
type FishingTypeFilter = typeof FISHING_TYPE_OPTIONS[number];

// ── Slider ────────────────────────────────────────────────────────────────────
const SLIDER_MIN = 1;
const SLIDER_MAX = 100;
const SLIDER_TRACK_PADDING = 20;

function DistanceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackWidth = SCREEN_WIDTH - 80 - SLIDER_TRACK_PADDING * 2;
  const valueToX = (v: number) => ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * trackWidth;
  const xToValue = (x: number) => {
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    return Math.round(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN));
  };
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => onChange(xToValue(e.nativeEvent.locationX - SLIDER_TRACK_PADDING)),
    onPanResponderMove: (e) => onChange(xToValue(e.nativeEvent.locationX - SLIDER_TRACK_PADDING)),
  });
  const thumbX = valueToX(value);
  const label = value >= SLIDER_MAX ? '100+ mi' : `${value} mi`;
  return (
    <View style={sliderStyles.container} {...panResponder.panHandlers}>
      <View style={[sliderStyles.track, { width: trackWidth + SLIDER_TRACK_PADDING * 2 }]}>
        <View style={[sliderStyles.filled, { width: thumbX + SLIDER_TRACK_PADDING }]} />
        <View style={[sliderStyles.thumb, { left: thumbX + SLIDER_TRACK_PADDING - 12 }]}>
          <Text style={sliderStyles.thumbLabel}>{label}</Text>
        </View>
      </View>
      <View style={sliderStyles.labels}>
        <Text style={sliderStyles.labelText}>1 mi</Text>
        <Text style={sliderStyles.labelText}>100+ mi</Text>
      </View>
    </View>
  );
}

// ── Swipeable card ────────────────────────────────────────────────────────────
function SwipeableCard({
  onSwipeLeft,
  onSwipeRight,
  children,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => translateX.setValue(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 220, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            onSwipeLeft();
          });
        } else if (gs.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: SCREEN_WIDTH, duration: 220, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            onSwipeRight();
          });
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FeedsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fishingType } = useFishing();

  const [buddies, setBuddies] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Location state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterDistance, setFilterDistance] = useState(SLIDER_MAX);
  const [filterHasBoat, setFilterHasBoat] = useState(false);
  const [filterExperience, setFilterExperience] = useState<ExperienceFilter>('all');
  const [filterFishingType, setFilterFishingType] = useState<FishingTypeFilter>('all');

  useEffect(() => { loadInitialData(); }, [fishingType]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      setCurrentUserId(session.user.id);

      // ── Acquire user location ─────────────────────────────────────────
      let coords = userCoords;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            setUserCoords(coords);
            setLocationDenied(false);
            // Persist to Supabase so other users can find us
            await saveUserLocation(session.user.id, coords.lat, coords.lng);
          } catch (locErr) {
            console.warn('Could not get position:', locErr);
          }
        } else {
          setLocationDenied(true);
        }
      }

      // ── No location → show prompt ─────────────────────────────────────
      if (!coords) {
        setBuddies([]);
        setCurrentIndex(0);
        setLoading(false);
        return;
      }

      // ── Fetch nearby profiles via PostGIS RPC ─────────────────────────
      try {
        const matches = await getPotentialMatches(
          session.user.id,
          coords.lat,
          coords.lng,
          {
            fishingType: filterFishingType !== 'all' ? filterFishingType : undefined,
            maxDistance: filterDistance < SLIDER_MAX ? filterDistance : undefined,
            hasBoat: filterHasBoat || undefined,
            experienceLevel: filterExperience !== 'all' ? filterExperience : undefined,
          }
        );
        setBuddies(matches || []);
      } catch (e) {
        console.warn('API Error:', e);
        setBuddies([]);
      }
      setCurrentIndex(0);
    } catch (e) {
      console.error('Session Error:', e);
    } finally {
      setLoading(false);
    }
  }

  function handleLocationSettingsPrompt() {
    Alert.alert(
      'Location Required',
      'Catch Connect needs your location to find nearby fishing buddies. Please enable location access in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  const handleApplyFilters = () => { setIsModalVisible(false); loadInitialData(); };

  const handleStartChat = async (buddy: UserProfile) => {
    if (!currentUserId) return;
    try {
      const conv = await startConversation(currentUserId, buddy.id);
      router.push({ pathname: '/conversation/[id]', params: { id: conv.id, name: buddy.display_name || 'Fisherman', photo: buddy.profile_photo_url || '' } });
    } catch {
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  const goToNext = () => { if (currentIndex < buddies.length) setCurrentIndex(p => p + 1); };
  const goToPrev = () => { if (currentIndex > 0) setCurrentIndex(p => p - 1); };

  const activeFilterSummary = [
    filterDistance < SLIDER_MAX ? `${filterDistance}mi` : '100+mi',
    filterFishingType !== 'all' ? (filterFishingType === 'freshwater' ? 'Fresh' : 'Salt') : null,
    filterExperience !== 'all' ? filterExperience : null,
    filterHasBoat ? 'Has boat' : null,
  ].filter(Boolean).join(' • ') || 'None';

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={FishingTheme.colors.darkGreen} />
    </View>
  );

  const currentBuddy = buddies[currentIndex];

  // ── Location denied state ───────────────────────────────────────────────────
  if (locationDenied && !userCoords) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>FISHING BUDDIES</Text>
              <Text style={styles.headerSubtitle}>Location required</Text>
            </View>
          </View>
        </View>
        <View style={styles.locationPrompt}>
          <View style={styles.locationPromptIcon}>
            <Ionicons name="location-outline" size={48} color={FishingTheme.colors.darkGreen} />
          </View>
          <Text style={styles.locationPromptTitle}>Enable Location</Text>
          <Text style={styles.locationPromptText}>
            Catch Connect uses your location to find fishing buddies near you. Without it, we can't show you nearby anglers.
          </Text>
          <Pressable style={styles.locationPromptBtn} onPress={handleLocationSettingsPrompt}>
            <Ionicons name="settings-outline" size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.locationPromptBtnText}>OPEN SETTINGS</Text>
          </Pressable>
          <Pressable style={styles.locationRetryBtn} onPress={loadInitialData}>
            <Text style={styles.locationRetryBtnText}>RETRY</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>FISHING BUDDIES</Text>
            <Text style={styles.headerSubtitle}>{buddies.length} nearby anglers</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.filterBtnText}>FILTERS</Text>
          </Pressable>
        </View>
      </View>

      {/* Feed */}
      <View style={styles.main}>
        {buddies.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No buddies found.</Text>
            <Text style={styles.emptySubtext}>Try broadening your filters.</Text>
          </View>
        ) : currentBuddy ? (
          <SwipeableCard onSwipeLeft={goToNext} onSwipeRight={goToPrev}>
            <View style={styles.card}>

              {/* Photo */}
              <View style={styles.photoContainer}>
                {currentBuddy.profile_photo_url ? (
                  <Image source={{ uri: currentBuddy.profile_photo_url }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>NO PHOTO</Text>
                  </View>
                )}

                {/* Name + location — no shade bar, drop shadow only */}
                <View style={styles.photoTextBlock}>
                  <Text style={styles.overlayName}>
                    {currentBuddy.display_name || 'Anonymous'}
                  </Text>
                  {currentBuddy.home_port ? (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={13} color="white" style={styles.pinIcon} />
                      <Text style={styles.overlayLocation}>{currentBuddy.home_port}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Progress dots */}
                {buddies.length > 1 && (
                  <View style={styles.dotsRow}>
                    {buddies.map((_, i) => (
                      <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
                    ))}
                  </View>
                )}
              </View>

              {/* Tan details — bio first, location removed */}
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <View style={styles.details}>
                  {/* ── Bio ── */}
                  <Text style={styles.attributeLabel}>BIO</Text>
                  {currentBuddy.bio
                    ? <Text style={styles.bio}>{currentBuddy.bio}</Text>
                    : <Text style={styles.bioEmpty}>No bio yet. Ready to fish!</Text>
                  }
                  {currentBuddy.experience_level && (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>EXPERIENCE LEVEL</Text>
                      <Text style={styles.attributeValue}>{currentBuddy.experience_level}</Text>
                    </View>
                  )}
                  {currentBuddy.fishing_type && (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>PREFERRED ENVIRONMENT</Text>
                      <Text style={styles.attributeValue}>{currentBuddy.fishing_type}</Text>
                    </View>
                  )}
                  {currentBuddy['has_boat'] && (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>BOAT ACCESS</Text>
                      <Text style={styles.attributeValue}>Has Boat</Text>
                    </View>
                  )}
                  {currentBuddy['boat_type'] ? (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>BOAT TYPE</Text>
                      <Text style={styles.attributeValue}>{currentBuddy['boat_type']}</Text>
                    </View>
                  ) : null}
                  {currentBuddy['boat_length'] ? (
                    <View style={styles.attributeRow}>
                      <Text style={styles.attributeLabel}>BOAT LENGTH</Text>
                      <Text style={styles.attributeValue}>{currentBuddy['boat_length']} ft</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              {/* Message */}
              <View style={styles.footer}>
                <Pressable
                  style={[styles.navBtn, currentIndex === 0 && styles.disabled]}
                  onPress={goToPrev}
                  disabled={currentIndex === 0}
                >
                  <Text style={styles.navBtnText}>‹</Text>
                </Pressable>
                <Pressable style={styles.chatBtn} onPress={() => handleStartChat(currentBuddy)}>
                  <Text style={styles.chatBtnText}>MESSAGE</Text>
                </Pressable>
                <Pressable
                  style={[styles.navBtn, currentIndex >= buddies.length && styles.disabled]}
                  onPress={goToNext}
                  disabled={currentIndex >= buddies.length}
                >
                  <Text style={styles.navBtnText}>›</Text>
                </Pressable>
              </View>

            </View>
          </SwipeableCard>
        ) : (
          /* End of deck — swipe right or tap to go back */
          <SwipeableCard onSwipeLeft={() => {}} onSwipeRight={goToPrev}>
            <View style={styles.card}>
              <View style={styles.endDeck}>
                <Text style={styles.endDeckEmoji}>🎣</Text>
                <Text style={styles.endDeckTitle}>You've seen everyone!</Text>
                <Text style={styles.endDeckSub}>Swipe right or tap below to go back.</Text>
                <Pressable style={styles.rewindBtn} onPress={goToPrev}>
                  <Ionicons name="arrow-undo-outline" size={18} color={FishingTheme.colors.darkGreen} />
                  <Text style={styles.rewindBtnText}>REWIND</Text>
                </Pressable>
              </View>
            </View>
          </SwipeableCard>
        )}
      </View>

      {/* Filter modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>FILTERS</Text>

            <Text style={styles.filterLabel}>Distance</Text>
            <DistanceSlider value={filterDistance} onChange={setFilterDistance} />

            <Text style={styles.filterLabel}>Experience Level</Text>
            <View style={styles.segmentRow}>
              {EXPERIENCE_OPTIONS.map(exp => (
                <Pressable key={exp} onPress={() => setFilterExperience(exp)}
                  style={[styles.segBtn, filterExperience === exp && styles.segBtnActive]}>
                  <Text style={[styles.segBtnText, filterExperience === exp && styles.segBtnTextActive]}>
                    {exp === 'all' ? 'All' : exp}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Fishing Type</Text>
            <View style={styles.segmentRow}>
              {FISHING_TYPE_OPTIONS.map(ft => (
                <Pressable key={ft} onPress={() => setFilterFishingType(ft)}
                  style={[styles.segBtn, filterFishingType === ft && styles.segBtnActive]}>
                  <Text style={[styles.segBtnText, filterFishingType === ft && styles.segBtnTextActive]}>
                    {ft === 'all' ? 'All' : ft === 'freshwater' ? 'Fresh' : 'Salt'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Boat</Text>
            <Pressable style={[styles.segBtn, { alignSelf: 'flex-start', paddingHorizontal: 16 }, filterHasBoat && styles.segBtnActive]}
              onPress={() => setFilterHasBoat(p => !p)}>
              <Text style={[styles.segBtnText, filterHasBoat && styles.segBtnTextActive]}>Has Boat</Text>
            </Pressable>

            <View style={styles.activeFilters}>
              <Text style={styles.activeFiltersLabel}>Active filters:</Text>
              <Text style={styles.activeFiltersText}>{activeFilterSummary}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={handleApplyFilters}>
                <Text style={styles.applyBtnText}>APPLY</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const sliderStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  track: { height: 6, backgroundColor: FishingTheme.colors.border, borderRadius: 3, marginHorizontal: SLIDER_TRACK_PADDING, position: 'relative', marginTop: 28, marginBottom: 4 },
  filled: { position: 'absolute', left: 0, top: 0, height: 6, backgroundColor: FishingTheme.colors.darkGreen, borderRadius: 3 },
  thumb: { position: 'absolute', top: -10, width: 24, height: 24, borderRadius: 12, backgroundColor: FishingTheme.colors.darkGreen, borderWidth: 3, borderColor: FishingTheme.colors.cream, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  thumbLabel: { position: 'absolute', top: -22, fontSize: 10, fontWeight: '800', color: FishingTheme.colors.darkGreen, width: 60, textAlign: 'center', left: -18 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: SLIDER_TRACK_PADDING, marginTop: 4 },
  labelText: { fontSize: 10, color: FishingTheme.colors.text.muted, fontWeight: '600' },
});

// Drop shadow applied to text via textShadow (no background/overlay)
const SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.65)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FishingTheme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: FishingTheme.colors.border },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: FishingTheme.colors.darkGreen },
  headerSubtitle: { fontSize: 13, color: FishingTheme.colors.text.tertiary, marginTop: 4 },
  filterBtn: { backgroundColor: FishingTheme.colors.tan, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: FishingTheme.colors.border },
  filterBtnText: { fontSize: 11, fontWeight: '800', color: FishingTheme.colors.darkGreen },

  main: { flex: 1, padding: 16 },

  card: { flex: 1, backgroundColor: FishingTheme.colors.card, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: FishingTheme.colors.border },

  // Photo — full bleed
  photoContainer: { width: '100%', height: 370, position: 'relative' },
  photo: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: FishingTheme.colors.sageGreen, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: 'white', fontWeight: '800' },

  // Name + location anchored bottom-left, NO background/shade bar
  photoTextBlock: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
  },
  overlayName: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 3,
    ...SHADOW,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 3,
  },
  overlayLocation: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
    ...SHADOW,
  },

  // Swipe progress dots at top of photo
  dotsRow: { position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: 'white', width: 18, borderRadius: 3 },

  // Tan details section
  details: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  bio: { fontSize: 15, color: FishingTheme.colors.text.primary, marginBottom: 16, lineHeight: 22 },
  bioEmpty: { fontSize: 15, color: FishingTheme.colors.text.muted, marginBottom: 16, fontStyle: 'italic' },
  attributeRow: { marginBottom: 14 },
  attributeLabel: { fontSize: 10, fontWeight: '700', color: FishingTheme.colors.text.tertiary, letterSpacing: 0.9, marginBottom: 3 },
  attributeValue: { fontSize: 15, fontWeight: '600', color: FishingTheme.colors.text.primary, textTransform: 'capitalize' },

  footer: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: FishingTheme.colors.background, alignItems: 'center' },
  navBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: FishingTheme.colors.tan, borderWidth: 1, borderColor: FishingTheme.colors.border, alignItems: 'center', justifyContent: 'center' },
  navBtnText: { fontSize: 22, fontWeight: '300', color: FishingTheme.colors.darkGreen, lineHeight: 26 },
  chatBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: FishingTheme.colors.darkGreen, alignItems: 'center' },
  chatBtnText: { fontWeight: '900', color: 'white', fontSize: 14, letterSpacing: 0.5 },
  disabled: { opacity: 0.25 },

  emptyText: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen },
  emptySubtext: { fontSize: 14, color: FishingTheme.colors.text.secondary, marginTop: 8 },

  endDeck: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  endDeckEmoji: { fontSize: 52, marginBottom: 8 },
  endDeckTitle: { fontSize: 20, fontWeight: '900', color: FishingTheme.colors.darkGreen, textAlign: 'center' },
  endDeckSub: { fontSize: 14, color: FishingTheme.colors.text.secondary, textAlign: 'center', marginBottom: 8 },
  rewindBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: FishingTheme.colors.tan, borderWidth: 1, borderColor: FishingTheme.colors.border },
  rewindBtnText: { fontSize: 13, fontWeight: '800', color: FishingTheme.colors.darkGreen },

  // Location permission denied prompt
  locationPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  locationPromptIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationPromptTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: FishingTheme.colors.darkGreen,
    textAlign: 'center',
  },
  locationPromptText: {
    fontSize: 15,
    color: FishingTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    maxWidth: 300,
  },
  locationPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  locationPromptBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  locationRetryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    marginTop: 4,
  },
  locationRetryBtnText: {
    color: FishingTheme.colors.darkGreen,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: FishingTheme.colors.darkGreen, marginBottom: 20 },
  filterLabel: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.text.tertiary, marginBottom: 10, marginTop: 12 },
  segmentRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  segBtn: { flex: 1, paddingVertical: 7, paddingHorizontal: 2, borderRadius: 8, borderWidth: 1, borderColor: FishingTheme.colors.border, alignItems: 'center' },
  segBtnActive: { backgroundColor: FishingTheme.colors.darkGreen, borderColor: FishingTheme.colors.darkGreen },
  segBtnText: { fontWeight: '700', fontSize: 11, color: FishingTheme.colors.text.secondary },
  segBtnTextActive: { color: 'white' },
  activeFilters: { backgroundColor: FishingTheme.colors.background, padding: 12, borderRadius: 10, marginBottom: 20, marginTop: 16 },
  activeFiltersLabel: { fontSize: 11, fontWeight: '600', color: FishingTheme.colors.text.tertiary, marginBottom: 4 },
  activeFiltersText: { fontSize: 13, fontWeight: '700', color: FishingTheme.colors.darkGreen },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: FishingTheme.colors.text.tertiary },
  applyBtn: { flex: 2, backgroundColor: FishingTheme.colors.darkGreen, padding: 15, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { color: 'white', fontWeight: '900' },
});
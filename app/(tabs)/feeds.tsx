// app/(tabs)/feeds.tsx
import { useFishing } from '@/contexts/FishingContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated, Dimensions, Image,
  Modal,
  PanResponder, Pressable, StyleSheet, Text,
  TextInput,
  View,
} from 'react-native';
import { startConversation } from '../../lib/api';

interface FishingBuddy {
  id: string;
  display_name: string;
  age: number;
  location: string;
  tackle_categories: string[];
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  profile_photo_url?: string | null;
  last_active: string;
  has_boat: boolean;
  favorite_species: string[];
  home_port: string;
  fishing_type: 'freshwater' | 'saltwater' | null;
}

interface Filters {
  maxDistance: number;
  experienceLevel: 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
  hasBoat: 'All' | 'Yes' | 'No';
  tackleCategories: string[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function FeedsScreen() {
  const router = useRouter();
  const { fishingType, species, tackleCategories } = useFishing();

  const [buddies, setBuddies] = useState<FishingBuddy[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<FishingBuddy | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    maxDistance: 50,
    experienceLevel: 'All',
    hasBoat: 'All',
    tackleCategories: [],
  });

  useEffect(() => {
    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 FEEDS - Auth state changed:', event, session?.user?.id);
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setLoading(false);
      } else {
        setCurrentUserId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load buddies whenever filters or fishingType change (even if signed out)
  useEffect(() => {
    void loadPotentialBuddies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters, fishingType]);

  async function initializeUser() {
    try {
      console.log('🔍 FEEDS - Checking for user session...');
      const { data: { session } } = await supabase.auth.getSession();

      console.log('🔍 FEEDS - Session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        isAnonymous: session?.user?.is_anonymous,
      });

      if (session?.user) {
        setCurrentUserId(session.user.id);
        console.log('✅ FEEDS - User ID set:', session.user.id);
      } else {
        console.log('❌ FEEDS - No user session found');
      }
    } catch (error) {
      console.error('💥 FEEDS - Error getting user session:', error);
    } finally {
      setLoading(false);
    }
  }

  const loadPotentialBuddies = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading potential buddies with filters:', {
        ...filters,
        fishingType,
        currentUserId,
      });

      // Select only columns we know exist in your current schema
      let query = supabase
        .from('profiles')
        .select('id, display_name, profile_photo_url, fishing_type, last_active, bio')
        .order('last_active', { ascending: false });

      // Exclude yourself only if signed in
      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      // Filter by water type if set
      if (fishingType) {
        query = query.eq('fishing_type', fishingType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const transformed: FishingBuddy[] = (data ?? []).map((row: any) => ({
        id: row.id,
        display_name: row.display_name || 'Anonymous Angler',
        age: 25, // default until you add this to schema
        location: 'Unknown', // default
        tackle_categories: [], // default
        experience_level: 'Beginner', // default
        bio: row.bio ?? '',
        profile_photo_url: row.profile_photo_url ?? null,
        last_active: row.last_active ?? new Date().toISOString(),
        has_boat: false, // default
        favorite_species: [], // default
        home_port: '', // default
        fishing_type: row.fishing_type ?? fishingType ?? null,
      }));

      setBuddies(transformed);
      setCurrentIndex(0);
      console.log(`✅ Found ${transformed.length} potential buddies`);
    } catch (error) {
      console.error('Error loading buddies:', error);
      Alert.alert('Error', 'Could not load fishing buddies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, filters, fishingType]);

  const goToNext = () => {
    if (currentIndex < buddies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(buddies.length - 1);
    }
  };

  const openMessageModal = (buddy: FishingBuddy) => {
    if (!currentUserId) {
      // Signed-out users get nudged to Profile to create account
      router.replace('/(tabs)/profile');
      return;
    }
    setSelectedBuddy(buddy);
    setMessageModalOpen(true);
    const waterType = fishingType === 'freshwater' ? 'lake' : 'ocean';
    setMessageText(
      `Hey ${buddy.display_name}! I saw your profile and would love to go ${fishingType ?? 'some'} fishing together. Know any good spots on the ${waterType}?`
    );
  };

  const sendMessage = async () => {
    if (!selectedBuddy || !currentUserId || !messageText.trim()) return;

    try {
      setSending(true);
      console.log(`💬 Starting conversation with ${selectedBuddy.display_name}`);

      const conversation = await startConversation(currentUserId, selectedBuddy.id);
      console.log('✅ Conversation created:', conversation.id);

      Alert.alert(
        'Message Sent!',
        `Your message to ${selectedBuddy.display_name} has been sent. Check your conversations to continue chatting.`,
        [{ text: 'OK', onPress: () => setMessageModalOpen(false) }]
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContent, styles.centered]}>
        <Text style={styles.loadingText}>
          Finding {fishingType ?? 'good'} fishing buddies...
        </Text>
      </View>
    );
  }

  // NOTE: No early return blocking signed-out users anymore.

  const currentBuddy = buddies[currentIndex];

  return (
    <View style={styles.screenContent}>
      {/* Non-blocking sign-in prompt */}
      {!currentUserId && (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <View style={{
            backgroundColor: '#11192C',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            padding: 12
          }}>
            <Text style={{ color: '#E8ECF1', fontWeight: '700', marginBottom: 6 }}>
              Welcome to Fishing Buddy!
            </Text>
            <Text style={{ color: '#A7B0C0', marginBottom: 10 }}>
              Create your account to match with nearby anglers and chat.
            </Text>
            <Pressable
              onPress={() => router.replace('/(tabs)/profile')}
              style={{ backgroundColor: '#72E5A2', paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', paddingHorizontal: 12 }}
            >
              <Text style={{ color: '#0B1220', fontWeight: '700' }}>Create account →</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {fishingType === 'freshwater' ? '🏞️' : '🌊'}{' '}
          {fishingType === 'freshwater' ? 'Freshwater' : 'Saltwater'} Buddies
        </Text>
        <View style={styles.headerRow}>
          <Text style={styles.feedSubtitle}>
            {buddies.length} nearby • {Math.min(currentIndex + 1, Math.max(buddies.length, 1))} of {Math.max(buddies.length, 1)}
          </Text>
          <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.filterButtonText}>Filters</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardStack}>
        {buddies.length > 0 ? (
          <SwipeableCard
            buddy={currentBuddy}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onMessage={() => openMessageModal(currentBuddy)}
          />
        ) : (
          <View style={[styles.centered, { paddingTop: 40 }]}>
            <Text style={styles.emptyStateText}>
              No {fishingType ?? ''} fishing buddies found
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters or check back later!
            </Text>
            <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
              <Text style={styles.filterButtonText}>Adjust Filters</Text>
            </Pressable>
          </View>
        )}
      </View>

      {buddies.length > 0 && (
        <View style={styles.navigationButtons}>
          <Pressable style={styles.navButton} onPress={goToPrevious}>
            <Text style={styles.navButtonText}>← Previous</Text>
          </Pressable>
          <Pressable style={styles.messageButton} onPress={() => openMessageModal(currentBuddy!)}>
            <Text style={styles.messageButtonText}>💬 Message</Text>
          </Pressable>
          <Pressable style={styles.navButton} onPress={goToNext}>
            <Text style={styles.navButtonText}>Next →</Text>
          </Pressable>
        </View>
      )}

      {/* Filters Modal (UI-only until you add these fields in DB) */}
      <FiltersModal
        visible={filtersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={() => {
          setFiltersOpen(false);
          void loadPotentialBuddies();
        }}
        tackleCategories={tackleCategories}
        fishingType={fishingType}
      />

      {/* Message Modal */}
      <MessageModal
        visible={messageModalOpen}
        buddy={selectedBuddy}
        message={messageText}
        onMessageChange={setMessageText}
        onSend={sendMessage}
        onClose={() => setMessageModalOpen(false)}
        sending={sending}
      />
    </View>
  );
}

/* ---------- Swipeable card ---------- */
function SwipeableCard({
  buddy,
  onNext,
  onPrevious,
  onMessage,
}: {
  buddy: FishingBuddy;
  onNext: () => void;
  onPrevious: () => void;
  onMessage: () => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (_evt, gestureState) => {
      if (gestureState.dx > 100) {
        Animated.timing(pan, { toValue: { x: SCREEN_WIDTH, y: 0 }, duration: 200, useNativeDriver: false }).start(
          () => {
            pan.setValue({ x: 0, y: 0 });
            onPrevious();
          }
        );
      } else if (gestureState.dx < -100) {
        Animated.timing(pan, { toValue: { x: -SCREEN_WIDTH, y: 0 }, duration: 200, useNativeDriver: false }).start(
          () => {
            pan.setValue({ x: 0, y: 0 });
            onNext();
          }
        );
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
  });

  return (
    <Animated.View
      style={[styles.swipeCard, { transform: [{ translateX: pan.x }] }]}
      {...panResponder.panHandlers}
    >
      <BuddyCard buddy={buddy} onMessage={onMessage} />
    </Animated.View>
  );
}

/* ---------- Buddy card ---------- */
function BuddyCard({ buddy, onMessage }: { buddy: FishingBuddy; onMessage: () => void }) {
  const getLastActiveText = (lastActive: string) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    return `Active ${diffDays}d ago`;
  };

  return (
    <View style={styles.buddyCard}>
      <View style={styles.photoContainer}>
        {buddy.profile_photo_url ? (
          <Image source={{ uri: buddy.profile_photo_url }} style={styles.buddyPhoto} />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>🎣</Text>
            <Text style={styles.placeholderName}>{buddy.display_name}</Text>
          </View>
        )}
        <View style={styles.photoOverlay}>
          <View style={styles.buddyInfo}>
            <Text style={styles.buddyName}>
              {buddy.display_name}
              {Number.isFinite(buddy.age) ? `, ${buddy.age}` : ''}
            </Text>
            <Text style={styles.buddyLocation}>📍 {buddy.location}</Text>
            {buddy.home_port ? <Text style={styles.buddyHomePort}>⚓ {buddy.home_port}</Text> : null}
            <Text style={styles.buddyActivity}>🟢 {getLastActiveText(buddy.last_active)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.buddyDetails}>
        {buddy.bio ? <Text style={styles.buddyBio}>{buddy.bio}</Text> : null}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Experience:</Text>
          <Text style={styles.detailValue}>{buddy.experience_level}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Has Boat:</Text>
          <Text style={styles.detailValue}>{buddy.has_boat ? 'Yes 🚤' : 'No'}</Text>
        </View>

        {buddy.tackle_categories.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Tackle:</Text>
            <View style={styles.tackleRow}>
              {buddy.tackle_categories.map((t) => (
                <View key={t} style={styles.miniChip}>
                  <Text style={styles.miniChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {buddy.favorite_species.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Targets:</Text>
            <Text style={styles.detailValue}>{buddy.favorite_species.join(', ')}</Text>
          </View>
        )}

        <Pressable style={styles.messageCardButton} onPress={onMessage}>
          <Text style={styles.messageCardButtonText}>💬 Send Message</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- Filters modal ---------- */
function FiltersModal({
  visible,
  filters,
  onFiltersChange,
  onClose,
  onApply,
  tackleCategories,
  fishingType,
}: {
  visible: boolean;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClose: () => void;
  onApply: () => void;
  tackleCategories: string[];
  fishingType: 'freshwater' | 'saltwater' | null;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>
              Filter {fishingType === 'freshwater' ? 'Freshwater' : 'Saltwater'} Buddies
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* UI-only filters for now */}
          <View style={styles.filtersContent}>
            <Text style={styles.filterLabel}>Max Distance: {filters.maxDistance} miles</Text>
            <View style={styles.distanceButtons}>
              {[10, 25, 50, 100].map((distance) => (
                <Pressable
                  key={distance}
                  style={[styles.distanceBtn, filters.maxDistance === distance && styles.distanceBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, maxDistance: distance })}
                >
                  <Text
                    style={[
                      styles.distanceBtnText,
                      filters.maxDistance === distance && styles.distanceBtnTextActive,
                    ]}
                  >
                    {distance}mi
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Experience Level</Text>
            <View style={styles.experienceButtons}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <Pressable
                  key={level}
                  style={[styles.filterBtn, filters.experienceLevel === level && styles.filterBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, experienceLevel: level as any })}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filters.experienceLevel === level && styles.filterBtnTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Has Boat</Text>
            <View style={styles.boatButtons}>
              {['All', 'Yes', 'No'].map((option) => (
                <Pressable
                  key={option}
                  style={[styles.filterBtn, filters.hasBoat === option && styles.filterBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, hasBoat: option as any })}
                >
                  <Text
                    style={[
                      styles.filterBtnText,
                      filters.hasBoat === option && styles.filterBtnTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filtersFooter}>
            <Pressable style={styles.applyBtn} onPress={onApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Message modal ---------- */
function MessageModal({
  visible,
  buddy,
  message,
  onMessageChange,
  onSend,
  onClose,
  sending,
}: {
  visible: boolean;
  buddy: FishingBuddy | null;
  message: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  onClose: () => void;
  sending: boolean;
}) {
  if (!buddy) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle}>Message {buddy.display_name}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.messageContent}>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={6}
              placeholder="Write your message..."
              placeholderTextColor="#7E8BA0"
              value={message}
              onChangeText={onMessageChange}
            />
          </View>

          <View style={styles.messageFooter}>
            <Pressable
              style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
              onPress={onSend}
              disabled={sending || !message.trim()}
            >
              <Text style={styles.sendBtnText}>{sending ? 'Sending...' : '💬 Send Message'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, backgroundColor: '#0B1220' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  feedHeader: { paddingHorizontal: 20, paddingVertical: 16 },
  feedTitle: { fontSize: 24, fontWeight: '700', color: '#E8ECF1', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedSubtitle: { fontSize: 16, color: '#9BB0CC' },

  filterButton: {
    backgroundColor: '#1A2440',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  filterButtonText: { color: '#E9F2FF', fontSize: 12, fontWeight: '600' },

  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#121A2B',
    borderWidth: 1,
    borderColor: '#1E2A44',
    overflow: 'hidden',
  },

  buddyCard: { flex: 1 },
  photoContainer: { flex: 1, position: 'relative' },
  buddyPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A2440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 48, marginBottom: 8 },
  placeholderName: { fontSize: 18, color: '#E8ECF1', fontWeight: '600' },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  buddyInfo: { gap: 4 },
  buddyName: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  buddyLocation: { fontSize: 16, color: '#E0E0E0' },
  buddyHomePort: { fontSize: 14, color: '#C0C0C0' },
  buddyActivity: { fontSize: 14, color: '#72E5A2' },

  buddyDetails: { padding: 20, gap: 12 },
  buddyBio: { fontSize: 16, color: '#E8ECF1', lineHeight: 22, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailSection: { gap: 6 },
  detailLabel: { fontSize: 14, color: '#AFC3E1', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#E8ECF1' },
  tackleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { backgroundColor: '#1A2440', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  miniChipText: { fontSize: 12, color: '#C8D2E0', fontWeight: '600' },

  messageCardButton: {
    backgroundColor: '#72E5A2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  messageCardButtonText: { color: '#0B1220', fontWeight: '700', textAlign: 'center' },

  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    backgroundColor: '#1A2440',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  navButtonText: { color: '#E9F2FF', fontWeight: '600' },
  messageButton: { backgroundColor: '#72E5A2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  messageButtonText: { color: '#0B1220', fontWeight: '700' },

  loadingText: { color: '#E8ECF1', fontSize: 16 },
  emptyStateText: { fontSize: 20, fontWeight: '600', color: '#E8ECF1', marginBottom: 8, textAlign: 'center' },
  emptyStateSubtext: { fontSize: 16, color: '#9BB0CC', textAlign: 'center', marginBottom: 20 },

  // Modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6,10,18,0.8)', justifyContent: 'center', padding: 20 },

  // Filters modal
  filtersCard: { backgroundColor: '#0F1627', borderRadius: 18, borderWidth: 1, borderColor: '#22304D' },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A44',
  },
  filtersTitle: { color: '#E8ECF1', fontSize: 18, fontWeight: '700' },
  filtersContent: { padding: 16, gap: 16 },
  filterLabel: { color: '#AFC3E1', fontSize: 14, fontWeight: '600', marginBottom: 8 },

  distanceButtons: { flexDirection: 'row', gap: 8 },
  distanceBtn: {
    flex: 1,
    backgroundColor: '#121A2B',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#233355',
  },
  distanceBtnActive: { backgroundColor: '#72E5A2', borderColor: '#72E5A2' },
  distanceBtnText: { color: '#E6F0FF', textAlign: 'center', fontWeight: '600' },
  distanceBtnTextActive: { color: '#0B1220' },

  experienceButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  boatButtons: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    backgroundColor: '#121A2B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#233355',
  },
  filterBtnActive: { backgroundColor: '#72E5A2', borderColor: '#72E5A2' },
  filterBtnText: { color: '#E6F0FF', fontWeight: '600', fontSize: 12 },
  filterBtnTextActive: { color: '#0B1220' },

  filtersFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#1E2A44' },
  applyBtn: { backgroundColor: '#72E5A2', paddingVertical: 12, borderRadius: 12 },
  applyBtnText: { color: '#0B1220', fontWeight: '700', textAlign: 'center' },

  // Message modal
  messageCard: { backgroundColor: '#0F1627', borderRadius: 18, borderWidth: 1, borderColor: '#22304D' },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2A44',
  },
  messageTitle: { color: '#E8ECF1', fontSize: 18, fontWeight: '700' },
  messageContent: { padding: 16 },
  messageInput: {
    backgroundColor: '#121A2B',
    color: '#E6F0FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#233355',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  messageFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#1E2A44' },
  sendBtn: { backgroundColor: '#72E5A2', paddingVertical: 12, borderRadius: 12 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: '#0B1220', fontWeight: '700', textAlign: 'center' },

  closeBtn: { padding: 8, borderRadius: 8, backgroundColor: '#121A2B', borderWidth: 1, borderColor: '#24324D' },
  closeBtnText: { color: '#BFD2EE', fontSize: 13 },
});

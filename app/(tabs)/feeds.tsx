import { useFishing } from '@/contexts/FishingContext';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { getPotentialMatches, startConversation } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface FishingBuddy {
  id: string;
  display_name: string;
  age: number;
  location: string;
  tackle_categories: string[];
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  profile_photo_url?: string;
  last_active: string;
  has_boat: boolean;
  favorite_species: string[];
  home_port: string;
  fishing_type: 'freshwater' | 'saltwater';
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
  const insets = useSafeAreaInsets();
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
    tackleCategories: []
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

  useEffect(() => {
    if (currentUserId && fishingType) {
      loadPotentialBuddies();
    }
  }, [currentUserId, filters, fishingType]);

  async function initializeUser() {
    try {
      console.log('🔍 FEEDS - Checking for user session...');
      const { data: { session } } = await supabase.auth.getSession();
      
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

  async function loadPotentialBuddies() {
    if (!currentUserId || !fishingType) return;
    
    try {
      setLoading(true);
      console.log('🔍 Loading potential buddies with filters:', { ...filters, fishingType });
      
      const apiFilters = {
        maxDistance: filters.maxDistance,
        fishingType: fishingType,
        experienceLevel: filters.experienceLevel !== 'All' ? filters.experienceLevel : undefined,
        hasBoat: filters.hasBoat === 'Yes' ? true : filters.hasBoat === 'No' ? false : undefined,
        tackleCategories: filters.tackleCategories.length > 0 ? filters.tackleCategories : undefined
      };

      const matches = await getPotentialMatches(currentUserId, apiFilters);
      console.log(`✅ Found ${matches.length} ${fishingType} fishing buddies`);
      
      const transformedBuddies: FishingBuddy[] = matches.map(match => ({
        id: match.id,
        display_name: match.display_name || 'Anonymous Angler',
        age: match.age || 25,
        location: match.location || 'Unknown',
        tackle_categories: match.tackle_categories || [],
        experience_level: match.experience_level || 'Beginner',
        bio: match.bio || `Love ${fishingType} fishing!`,
        profile_photo_url: match.profile_photo_url,
        last_active: match.last_active || new Date().toISOString(),
        has_boat: match.has_boat || false,
        favorite_species: match.favorite_species || [],
        home_port: match.home_port || '',
        fishing_type: match.fishing_type || fishingType
      }));

      setBuddies(transformedBuddies);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error loading buddies:', error);
      Alert.alert('Error', 'Could not load fishing buddies. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
    setSelectedBuddy(buddy);
    setMessageModalOpen(true);
    const waterType = fishingType === 'freshwater' ? 'lake' : 'ocean';
    setMessageText(`Hey ${buddy.display_name}! I saw your profile and would love to go ${fishingType} fishing together. Know any good spots on the ${waterType}?`);
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
        <Text style={styles.loadingText}>Finding {fishingType} fishing buddies...</Text>
      </View>
    );
  }

  if (!currentUserId) {
    return (
      <View style={[styles.screenContent, styles.centered]}>
        <Text style={styles.emptyStateText}>Please sign in first</Text>
        <Text style={styles.emptyStateSubtext}>Go to Profile tab to get started</Text>
      </View>
    );
  }

  if (buddies.length === 0) {
    return (
      <View style={[styles.screenContent, styles.centered]}>
        <Text style={styles.emptyStateText}>No {fishingType} fishing buddies found</Text>
        <Text style={styles.emptyStateSubtext}>Try adjusting your filters or check back later!</Text>
        <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
          <Text style={styles.filterButtonText}>ADJUST FILTERS</Text>
        </Pressable>
      </View>
    );
  }

  const currentBuddy = buddies[currentIndex];

  return (
    <View style={[styles.screenContent, { paddingTop: insets.top }]}>
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>
          {fishingType === 'freshwater' ? 'FRESHWATER' : 'SALTWATER'} BUDDIES
        </Text>
        <View style={styles.headerRow}>
          <Text style={styles.feedSubtitle}>{buddies.length} nearby • {currentIndex + 1} of {buddies.length}</Text>
          <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.filterButtonText}>FILTERS</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.cardStack}>
        <SwipeableCard 
          buddy={currentBuddy} 
          onNext={goToNext} 
          onPrevious={goToPrevious}
          onMessage={() => openMessageModal(currentBuddy)}
        />
      </View>

      <View style={[styles.navigationButtons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.navButton} onPress={goToPrevious}>
          <Text style={styles.navButtonText}>← PREVIOUS</Text>
        </Pressable>
        <Pressable style={styles.messageButton} onPress={() => openMessageModal(currentBuddy)}>
          <Text style={styles.messageButtonText}>MESSAGE</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={goToNext}>
          <Text style={styles.navButtonText}>NEXT →</Text>
        </Pressable>
      </View>

      <FiltersModal 
        visible={filtersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={() => {
          setFiltersOpen(false);
          loadPotentialBuddies();
        }}
        tackleCategories={tackleCategories}
        fishingType={fishingType}
      />

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

function SwipeableCard({ buddy, onNext, onPrevious, onMessage }: {
  buddy: FishingBuddy;
  onNext: () => void;
  onPrevious: () => void;
  onMessage: () => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 100) {
        Animated.timing(pan, {
          toValue: { x: SCREEN_WIDTH, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          onPrevious();
        });
      } else if (gestureState.dx < -100) {
        Animated.timing(pan, {
          toValue: { x: -SCREEN_WIDTH, y: 0 },
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          pan.setValue({ x: 0, y: 0 });
          onNext();
        });
      } else {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.swipeCard,
        {
          transform: [{ translateX: pan.x }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <BuddyCard buddy={buddy} onMessage={onMessage} />
    </Animated.View>
  );
}

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
          <Image 
            source={{ uri: buddy.profile_photo_url }} 
            style={styles.buddyPhoto}
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>ANGLER</Text>
            <Text style={styles.placeholderName}>{buddy.display_name}</Text>
          </View>
        )}
        <View style={styles.photoOverlay}>
          <View style={styles.buddyInfo}>
            <Text style={styles.buddyName}>{buddy.display_name}, {buddy.age}</Text>
            <Text style={styles.buddyLocation}>• {buddy.location}</Text>
            {buddy.home_port && (
              <Text style={styles.buddyHomePort}>Port: {buddy.home_port}</Text>
            )}
            <Text style={styles.buddyActivity}>• {getLastActiveText(buddy.last_active)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.buddyDetails}>
        <Text style={styles.buddyBio}>{buddy.bio}</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>EXPERIENCE:</Text>
          <Text style={styles.detailValue}>{buddy.experience_level}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>HAS BOAT:</Text>
          <Text style={styles.detailValue}>{buddy.has_boat ? 'Yes' : 'No'}</Text>
        </View>
        
        {buddy.tackle_categories.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>TACKLE:</Text>
            <View style={styles.tackleRow}>
              {buddy.tackle_categories.map(t => (
                <View key={t} style={styles.miniChip}>
                  <Text style={styles.miniChipText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {buddy.favorite_species.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>TARGETS:</Text>
            <Text style={styles.detailValue}>{buddy.favorite_species.join(', ')}</Text>
          </View>
        )}

        <Pressable style={styles.messageCardButton} onPress={onMessage}>
          <Text style={styles.messageCardButtonText}>SEND MESSAGE</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FiltersModal({ visible, filters, onFiltersChange, onClose, onApply, tackleCategories, fishingType }: {
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
              FILTER {fishingType === 'freshwater' ? 'FRESHWATER' : 'SALTWATER'} BUDDIES
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>×</Text>
            </Pressable>
          </View>
          
          <View style={styles.filtersContent}>
            <Text style={styles.filterLabel}>MAX DISTANCE: {filters.maxDistance} MILES</Text>
            <View style={styles.distanceButtons}>
              {[10, 25, 50, 100].map(distance => (
                <Pressable 
                  key={distance}
                  style={[styles.distanceBtn, filters.maxDistance === distance && styles.distanceBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, maxDistance: distance })}
                >
                  <Text style={[styles.distanceBtnText, filters.maxDistance === distance && styles.distanceBtnTextActive]}>
                    {distance}mi
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>EXPERIENCE LEVEL</Text>
            <View style={styles.experienceButtons}>
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                <Pressable 
                  key={level}
                  style={[styles.filterBtn, filters.experienceLevel === level && styles.filterBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, experienceLevel: level as any })}
                >
                  <Text style={[styles.filterBtnText, filters.experienceLevel === level && styles.filterBtnTextActive]}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>HAS BOAT</Text>
            <View style={styles.boatButtons}>
              {['All', 'Yes', 'No'].map(option => (
                <Pressable 
                  key={option}
                  style={[styles.filterBtn, filters.hasBoat === option && styles.filterBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, hasBoat: option as any })}
                >
                  <Text style={[styles.filterBtnText, filters.hasBoat === option && styles.filterBtnTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filtersFooter}>
            <Pressable style={styles.applyBtn} onPress={onApply}>
              <Text style={styles.applyBtnText}>APPLY FILTERS</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MessageModal({ visible, buddy, message, onMessageChange, onSend, onClose, sending }: {
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
            <Text style={styles.messageTitle}>MESSAGE {buddy.display_name.toUpperCase()}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>×</Text>
            </Pressable>
          </View>
          
          <View style={styles.messageContent}>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={6}
              placeholder="Write your message..."
              placeholderTextColor={FishingTheme.colors.text.muted}
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
              <Text style={styles.sendBtnText}>
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, backgroundColor: FishingTheme.colors.background },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  feedHeader: { 
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  feedTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: FishingTheme.colors.darkGreen, 
    marginBottom: 8,
    letterSpacing: 1,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feedSubtitle: { fontSize: 14, color: FishingTheme.colors.text.tertiary },
  
  filterButton: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border 
  },
  filterButtonText: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  cardStack: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
    ...FishingTheme.shadows.md,
  },
  
  buddyCard: { flex: 1 },
  photoContainer: { flex: 1, position: 'relative' },
  buddyPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderPhoto: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: FishingTheme.colors.sageGreen, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    fontSize: 24, 
    marginBottom: 8, 
    color: FishingTheme.colors.cream,
    fontWeight: '800',
    letterSpacing: 2,
  },
  placeholderName: { 
    fontSize: 18, 
    color: FishingTheme.colors.cream, 
    fontWeight: '600' 
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(47, 69, 56, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  buddyInfo: { gap: 4 },
  buddyName: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: FishingTheme.colors.cream,
    letterSpacing: -0.5,
  },
  buddyLocation: { fontSize: 15, color: FishingTheme.colors.cream },
  buddyHomePort: { fontSize: 13, color: FishingTheme.colors.cream, opacity: 0.9 },
  buddyActivity: { fontSize: 13, color: FishingTheme.colors.cream, marginTop: 4 },
  
  buddyDetails: { padding: 20, gap: 12, backgroundColor: FishingTheme.colors.card },
  buddyBio: { 
    fontSize: 15, 
    color: FishingTheme.colors.text.primary, 
    lineHeight: 22, 
    marginBottom: 8 
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailSection: { gap: 6 },
  detailLabel: { 
    fontSize: 11, 
    color: FishingTheme.colors.text.tertiary, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 14, color: FishingTheme.colors.text.primary, fontWeight: '600' },
  tackleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  miniChipText: { 
    fontSize: 11, 
    color: FishingTheme.colors.cream, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  messageCardButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12, 
    marginTop: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageCardButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  navigationButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: FishingTheme.colors.border,
  },
  navButton: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border 
  },
  navButtonText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  messageButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  loadingText: { color: FishingTheme.colors.text.primary, fontSize: 16 },
  emptyStateText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: FishingTheme.colors.darkGreen, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  emptyStateSubtext: { 
    fontSize: 16, 
    color: FishingTheme.colors.text.tertiary, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  
  // Modal styles
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: FishingTheme.colors.overlay, 
    justifyContent: 'center', 
    padding: 20 
  },
  
  filtersCard: { 
    backgroundColor: FishingTheme.colors.cream, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  filtersHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 2, 
    borderBottomColor: FishingTheme.colors.border 
  },
  filtersTitle: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  filtersContent: { padding: 16, gap: 16 },
  filterLabel: { 
    color: FishingTheme.colors.text.tertiary, 
    fontSize: 11, 
    fontWeight: '700', 
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  
  distanceButtons: { flexDirection: 'row', gap: 8 },
  distanceBtn: { 
    flex: 1, 
    backgroundColor: FishingTheme.colors.card, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border 
  },
  distanceBtnActive: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  distanceBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    textAlign: 'center', 
    fontWeight: '700' 
  },
  distanceBtnTextActive: { color: FishingTheme.colors.cream },
  
  experienceButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  boatButtons: { flexDirection: 'row', gap: 8 },
  filterBtn: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border 
  },
  filterBtnActive: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  filterBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700', 
    fontSize: 12 
  },
  filterBtnTextActive: { color: FishingTheme.colors.cream },
  
  filtersFooter: { padding: 16, borderTopWidth: 2, borderTopColor: FishingTheme.colors.border },
  applyBtn: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  applyBtnText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  messageCard: { 
    backgroundColor: FishingTheme.colors.cream, 
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  messageHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 2, 
    borderBottomColor: FishingTheme.colors.border 
  },
  messageTitle: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  messageContent: { padding: 16 },
  messageInput: { 
    backgroundColor: FishingTheme.colors.card, 
    color: FishingTheme.colors.text.primary, 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border, 
    textAlignVertical: 'top', 
    minHeight: 120,
    fontSize: 15,
  },
  messageFooter: { padding: 16, borderTopWidth: 2, borderTopColor: FishingTheme.colors.border },
  sendBtn: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  closeBtn: { 
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
  closeBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 20,
    fontWeight: '400',
  },
});
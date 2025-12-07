import { useFishing } from '@/contexts/FishingContext';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '../../components/Closebutton';
import { FishingTheme } from '../../constants/FishingTheme';
import { FishingBuddy, allMockBuddies } from '../../lib/mockBuddies';
import { supabase } from '../../lib/supabase';

interface Filters {
  maxDistance: number;
  experienceLevel: 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
  hasBoat: 'All' | 'Yes' | 'No';
  tackleCategories: string[];
  fishingType: 'All' | 'freshwater' | 'saltwater';
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
  const [useRealData, setUseRealData] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    maxDistance: 100,
    experienceLevel: 'All',
    hasBoat: 'All',
    tackleCategories: [],
    fishingType: fishingType || 'All'
  });

  // Apply filters to mock data
  const filteredBuddies = useMemo(() => {
    let filtered = [...allMockBuddies];
    
    // Filter by fishing type
    if (filters.fishingType !== 'All') {
      filtered = filtered.filter(b => b.fishing_type === filters.fishingType);
    } else if (fishingType) {
      // Use context fishing type if no filter override
      filtered = filtered.filter(b => b.fishing_type === fishingType);
    }
    
    // Filter by distance
    filtered = filtered.filter(b => b.distance <= filters.maxDistance);
    
    // Filter by experience level
    if (filters.experienceLevel !== 'All') {
      filtered = filtered.filter(b => b.experience_level === filters.experienceLevel);
    }
    
    // Filter by boat ownership
    if (filters.hasBoat === 'Yes') {
      filtered = filtered.filter(b => b.has_boat === true);
    } else if (filters.hasBoat === 'No') {
      filtered = filtered.filter(b => b.has_boat === false);
    }
    
    // Filter by tackle categories
    if (filters.tackleCategories.length > 0) {
      filtered = filtered.filter(b => 
        b.tackle_categories.some(tc => filters.tackleCategories.includes(tc))
      );
    }
    
    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);
    
    return filtered;
  }, [filters, fishingType]);

  useEffect(() => {
    initializeUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Use filtered mock data for demo
    setBuddies(filteredBuddies);
    setCurrentIndex(0);
    setLoading(false);
  }, [filteredBuddies]);

  async function initializeUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error getting user session:', error);
    } finally {
      setLoading(false);
    }
  }

  const goToNext = () => {
    if (currentIndex < buddies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      Alert.alert('End of List', 'You\'ve viewed all available fishing buddies. Try adjusting your filters to see more!');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openMessageModal = (buddy: FishingBuddy) => {
    setSelectedBuddy(buddy);
    setMessageModalOpen(true);
    const waterType = buddy.fishing_type === 'freshwater' ? 'lake' : 'ocean';
    setMessageText(`Hey ${buddy.display_name}! I saw your profile and would love to go ${buddy.fishing_type} fishing together. Know any good spots on the ${waterType}?`);
  };

  const sendMessage = async () => {
    if (!selectedBuddy || !messageText.trim()) return;
    
    // For demo purposes, just show success
    setSending(true);
    setTimeout(() => {
      Alert.alert(
        'Demo Mode', 
        `In the live app, your message would be sent to ${selectedBuddy.display_name}. Check the Conversations tab to continue chatting!`,
        [{ text: 'OK', onPress: () => setMessageModalOpen(false) }]
      );
      setSending(false);
    }, 1000);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.safeAreaTop, { height: insets.top }]} />
        <View style={styles.centeredContent}>
          <Text style={styles.loadingText}>Finding fishing buddies...</Text>
        </View>
        <View style={[styles.safeAreaBottom, { height: insets.bottom }]} />
      </View>
    );
  }

  if (buddies.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.safeAreaTop, { height: insets.top }]} />
        <View style={styles.centeredContent}>
          <Text style={styles.emptyStateText}>No fishing buddies found</Text>
          <Text style={styles.emptyStateSubtext}>Try adjusting your filters to see more anglers!</Text>
          <Pressable style={styles.emptyFilterButton} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.emptyFilterButtonText}>ADJUST FILTERS</Text>
          </Pressable>
        </View>
        <View style={[styles.safeAreaBottom, { height: insets.bottom }]} />
        
        <FiltersModal 
          visible={filtersOpen}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setFiltersOpen(false)}
          onApply={() => {
            setFiltersOpen(false);
          }}
          tackleCategories={tackleCategories}
          fishingType={fishingType}
        />
      </View>
    );
  }

  const currentBuddy = buddies[currentIndex];

  // ====== MAIN RENDER ======
  return (
    <View style={styles.container}>
      {/* SAFE AREA TOP */}
      <View style={[styles.safeAreaTop, { height: insets.top }]} />
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.feedTitle}>
              {filters.fishingType === 'All' ? 'ALL' : filters.fishingType === 'freshwater' ? 'FRESHWATER' : 'SALTWATER'} BUDDIES
            </Text>
            <Text style={styles.feedSubtitle}>
              {buddies.length} nearby • {buddies.length > 0 ? `${currentIndex + 1} of ${buddies.length}` : 'No matches'}
            </Text>
          </View>
          
          {/* Filter button with active indicator */}
          <Pressable style={styles.filterButtonTop} onPress={() => setFiltersOpen(true)}>
            <Text style={styles.filterButtonTopText}>FILTERS</Text>
            {/* Green dot shows when any filter is active */}
            {(filters.maxDistance !== 100 || filters.experienceLevel !== 'All' || 
              filters.hasBoat !== 'All' || filters.tackleCategories.length > 0 || 
              filters.fishingType !== 'All') && (
              <View style={styles.filterDot} />
            )}
          </Pressable>
        </View>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        {/* Card Stack Container - centers the card in available space */}
        <View style={styles.cardStack}>
          {currentBuddy && (
            <SwipeableCard 
              buddy={currentBuddy} 
              onNext={goToNext} 
              onPrevious={goToPrevious}
              onMessage={() => openMessageModal(currentBuddy)}
            />
          )}
        </View>
      </View>

      {/* NAVIGATION SECTION - Simplified with just PREV and NEXT */}
      <View style={styles.navigationSection}>
        <View style={styles.navigationButtons}>
          <Pressable 
            style={[styles.navButton, styles.navButtonLarge, currentIndex === 0 && styles.navButtonDisabled]} 
            onPress={goToPrevious} 
            disabled={currentIndex === 0}
          >
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
              ← PREV
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.navButton, styles.navButtonLarge, currentIndex === buddies.length - 1 && styles.navButtonDisabled]} 
            onPress={goToNext} 
            disabled={currentIndex === buddies.length - 1}
          >
            <Text style={[styles.navButtonText, currentIndex === buddies.length - 1 && styles.navButtonTextDisabled]}>
              NEXT →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* SAFE AREA BOTTOM */}
      <View style={[styles.safeAreaBottom, { height: insets.bottom }]} />

      {/* MODALS - Render outside main layout */}
      <FiltersModal 
        visible={filtersOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={() => {
          setFiltersOpen(false);
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
  /**
   * Helper function to format last active time
   * Shows relative time (e.g., "Active 5m ago" or "Active 2h ago")
   */
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
      {/* PHOTO SECTION (40% of card height) */}
      <View style={styles.photoContainer}>
        {buddy.profile_photo_url ? (
          <Image 
            source={{ uri: buddy.profile_photo_url }} 
            style={styles.buddyPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderPhoto}>
            <Text style={styles.placeholderText}>ANGLER</Text>
            <Text style={styles.placeholderName}>{buddy.display_name}</Text>
          </View>
        )}
        
        {/* Dark overlay with user info */}
        <View style={styles.photoOverlay}>
          <View style={styles.buddyInfo}>
            <Text style={styles.buddyName}>{buddy.display_name}, {buddy.age}</Text>
            <Text style={styles.buddyLocation}>📍 {buddy.location} • {buddy.distance}mi away</Text>
            {buddy.home_port && (
              <Text style={styles.buddyHomePort}>⚓ {buddy.home_port}</Text>
            )}
            <Text style={styles.buddyActivity}>• {getLastActiveText(buddy.last_active)}</Text>
            {buddy.instagram && (
              <Text style={styles.buddyInstagram}>📷 {buddy.instagram}</Text>
            )}
          </View>
        </View>
      </View>
      
      {/* DETAILS SECTION (60% of card height) */}
      <View style={styles.buddyDetailsContainer}>
        <ScrollView 
          style={styles.buddyDetailsScroll}
          contentContainerStyle={styles.buddyDetailsContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Bio - Main description */}
          <Text style={styles.buddyBio}>{buddy.bio}</Text>
          
          {/* Experience Level */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EXPERIENCE:</Text>
            <Text style={styles.detailValue}>{buddy.experience_level}</Text>
          </View>
          
          {/* Boat Information - Only shown if has boat */}
          {buddy.has_boat && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>BOAT:</Text>
                <Text style={styles.detailValue}>✓ Has Boat</Text>
              </View>
              {buddy.boat_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>VESSEL:</Text>
                  <Text style={styles.detailValue}>"{buddy.boat_name}"</Text>
                </View>
              )}
              {buddy.boat_type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TYPE:</Text>
                  <Text style={styles.detailValue}>{buddy.boat_type} {buddy.boat_length && `(${buddy.boat_length})`}</Text>
                </View>
              )}
            </>
          )}
          
          {/* No Boat Status */}
          {!buddy.has_boat && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>BOAT:</Text>
              <Text style={styles.detailValue}>Shore/Kayak Angler</Text>
            </View>
          )}
          
          {/* Tackle Categories - Shown as chips */}
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
          
          {/* Target Species */}
          {buddy.favorite_species.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>TARGET SPECIES:</Text>
              <Text style={styles.detailValue}>{buddy.favorite_species.join(' • ')}</Text>
            </View>
          )}
          
          {/* Availability Times */}
          {buddy.preferred_times && buddy.preferred_times.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>AVAILABILITY:</Text>
              <View style={styles.tackleRow}>
                {buddy.preferred_times.map(time => (
                  <View key={time} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{time}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* MESSAGE BUTTON - Fixed at bottom of details section */}
        <View style={styles.messageButtonContainer}>
          <Pressable style={styles.messageCardButton} onPress={onMessage}>
            <Text style={styles.messageCardButtonText}>SEND MESSAGE</Text>
          </Pressable>
        </View>
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
            <Text style={styles.filtersTitle}>FILTER BUDDIES</Text>
            <CloseButton onPress={onClose} iconName="chevron-down" />
          </View>
          
          <ScrollView style={styles.filtersContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>FISHING TYPE</Text>
            <View style={styles.fishingTypeButtons}>
              {['All', 'freshwater', 'saltwater'].map(type => (
                <Pressable 
                  key={type}
                  style={[styles.filterBtn, filters.fishingType === type && styles.filterBtnActive]}
                  onPress={() => onFiltersChange({ ...filters, fishingType: type as any })}
                >
                  <Text style={[styles.filterBtnText, filters.fishingType === type && styles.filterBtnTextActive]}>
                    {type === 'All' ? 'All' : type === 'freshwater' ? 'Freshwater' : 'Saltwater'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>MAX DISTANCE: {filters.maxDistance} MILES</Text>
            <View style={styles.distanceButtons}>
              {[10, 25, 50, 100, 200].map(distance => (
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
                    {option === 'Yes' ? 'Boat Owner' : option === 'No' ? 'No Boat' : 'All'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>TACKLE CATEGORIES</Text>
            <View style={styles.tackleButtons}>
              {tackleCategories.map(tackle => {
                const isSelected = filters.tackleCategories.includes(tackle);
                return (
                  <Pressable 
                    key={tackle}
                    style={[styles.tackleBtn, isSelected && styles.tackleBtnActive]}
                    onPress={() => {
                      const newTackle = isSelected
                        ? filters.tackleCategories.filter(t => t !== tackle)
                        : [...filters.tackleCategories, tackle];
                      onFiltersChange({ ...filters, tackleCategories: newTackle });
                    }}
                  >
                    <Text style={[styles.tackleBtnText, isSelected && styles.tackleBtnTextActive]}>
                      {tackle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.filtersFooter}>
            <Pressable 
              style={styles.clearBtn} 
              onPress={() => onFiltersChange({
                maxDistance: 100,
                experienceLevel: 'All',
                hasBoat: 'All',
                tackleCategories: [],
                fishingType: 'All'
              })}
            >
              <Text style={styles.clearBtnText}>CLEAR ALL</Text>
            </Pressable>
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
            <CloseButton onPress={onClose} iconName="close" />
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
            
            <View style={styles.messageHints}>
              <Text style={styles.hintTitle}>CONVERSATION STARTERS:</Text>
              <Text style={styles.hintText}>• Ask about their favorite local spots</Text>
              <Text style={styles.hintText}>• Propose splitting boat/gas costs</Text>
              <Text style={styles.hintText}>• Share your fishing schedule</Text>
              <Text style={styles.hintText}>• Mention target species you both like</Text>
            </View>
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
  // ========== CONTAINER & LAYOUT STYLES ==========
  container: { 
    flex: 1, 
    backgroundColor: FishingTheme.colors.background 
  },
  
  safeAreaTop: {
    backgroundColor: FishingTheme.colors.background,
  },
  safeAreaBottom: {
    backgroundColor: FishingTheme.colors.background,
  },
  
  mainContent: {
    flex: 1,
  },
  
  centeredContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  
  // ========== HEADER STYLES ==========
  header: { 
    backgroundColor: FishingTheme.colors.background,
    paddingHorizontal: 20, 
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 10,
  },
  feedTitle: { 
    fontSize: 20,
    fontWeight: '800', 
    color: FishingTheme.colors.darkGreen, 
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  feedSubtitle: { 
    fontSize: 12, 
    color: FishingTheme.colors.text.tertiary,
    fontWeight: '500',
  },
  
  filterButtonTop: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.forestGreen,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    ...FishingTheme.shadows.sm,
  },
  filterButtonTopText: { 
    color: FishingTheme.colors.cream, 
    fontSize: 11, 
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#72E5A2',
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: FishingTheme.colors.background,
  },
  
  // ========== CARD STACK STYLES ==========
  cardStack: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.85,
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
    ...FishingTheme.shadows.md,
  },
  
  // ========== BUDDY CARD STYLES ==========
  buddyCard: { 
    flex: 1,
    backgroundColor: FishingTheme.colors.card,
  },
  
  photoContainer: { 
    height: '40%',
    position: 'relative',
  },
  buddyPhoto: { 
    width: '100%', 
    height: '100%',
  },
  placeholderPhoto: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: FishingTheme.colors.sageGreen, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    fontSize: 22, 
    marginBottom: 8, 
    color: FishingTheme.colors.cream,
    fontWeight: '800',
    letterSpacing: 2,
  },
  placeholderName: { 
    fontSize: 16, 
    color: FishingTheme.colors.cream, 
    fontWeight: '600' 
  },
  
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(47, 69, 56, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buddyInfo: { 
    gap: 2 
  },
  buddyName: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: FishingTheme.colors.cream,
    letterSpacing: -0.5,
  },
  buddyLocation: { 
    fontSize: 12, 
    color: FishingTheme.colors.cream, 
    opacity: 0.95 
  },
  buddyHomePort: { 
    fontSize: 11, 
    color: FishingTheme.colors.cream, 
    opacity: 0.9 
  },
  buddyActivity: { 
    fontSize: 10, 
    color: FishingTheme.colors.cream, 
    marginTop: 2, 
    opacity: 0.85 
  },
  buddyInstagram: { 
    fontSize: 10, 
    color: FishingTheme.colors.cream, 
    marginTop: 1, 
    opacity: 0.85 
  },
  
  buddyDetailsContainer: { 
    height: '60%',
    backgroundColor: FishingTheme.colors.card,
  },
  buddyDetailsScroll: {
    flex: 1,
  },
  buddyDetailsContent: {
    padding: 16,
    paddingBottom: 8,
  },
  buddyBio: { 
    fontSize: 13, 
    color: FishingTheme.colors.text.primary, 
    lineHeight: 19, 
    marginBottom: 12,
    fontStyle: 'italic',
  },
  
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  detailSection: { 
    gap: 6, 
    marginBottom: 10 
  },
  detailLabel: { 
    fontSize: 10, 
    color: FishingTheme.colors.text.tertiary, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: { 
    fontSize: 12, 
    color: FishingTheme.colors.text.primary, 
    fontWeight: '600', 
    flex: 1, 
    textAlign: 'right' 
  },
  
  tackleRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    marginTop: 4 
  },
  miniChip: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  miniChipText: { 
    fontSize: 10, 
    color: FishingTheme.colors.cream, 
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeChip: { 
    backgroundColor: FishingTheme.colors.tan, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  timeChipText: { 
    fontSize: 10, 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  messageButtonContainer: {
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: FishingTheme.colors.border,
    backgroundColor: FishingTheme.colors.card,
  },
  messageCardButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageCardButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  
  // ========== NAVIGATION STYLES ==========
  navigationSection: {
    backgroundColor: FishingTheme.colors.background,
    borderTopWidth: 2,
    borderTopColor: FishingTheme.colors.border,
  },
  navigationButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12,
  },
  navButton: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  navButtonLarge: {
    flex: 0.45, // Makes the buttons larger when only 2
    paddingHorizontal: 20,
  },
  navButtonDisabled: { 
    opacity: 0.4,
    backgroundColor: FishingTheme.colors.tan,
  },
  navButtonText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700',
    fontSize: 14, // Slightly larger font for the bigger buttons
    letterSpacing: 0.3,
  },
  navButtonTextDisabled: { 
    color: FishingTheme.colors.text.muted,
  },
  
  // ========== LOADING & EMPTY STATES ==========
  loadingText: { 
    color: FishingTheme.colors.text.primary, 
    fontSize: 16 
  },
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
  emptyFilterButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.forestGreen,
    marginTop: 20,
  },
  emptyFilterButtonText: { 
    color: FishingTheme.colors.cream, 
    fontSize: 13, 
    fontWeight: '800',
    letterSpacing: 0.5,
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
    borderColor: FishingTheme.colors.darkGreen,
    maxHeight: '80%',
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
  filtersContent: { padding: 16, maxHeight: '70%' },
  filterLabel: { 
    color: FishingTheme.colors.text.tertiary, 
    fontSize: 11, 
    fontWeight: '700', 
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  
  fishingTypeButtons: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  distanceButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  distanceBtn: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingVertical: 10,
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border,
    minWidth: 55,
    alignItems: 'center',
  },
  distanceBtnActive: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  distanceBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    textAlign: 'center', 
    fontWeight: '700',
    fontSize: 12,
  },
  distanceBtnTextActive: { color: FishingTheme.colors.cream },
  
  experienceButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  boatButtons: { flexDirection: 'row', gap: 8 },
  tackleButtons: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
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
  
  tackleBtn: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 10, 
    paddingVertical: 7, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border 
  },
  tackleBtnActive: { 
    backgroundColor: FishingTheme.colors.sageGreen, 
    borderColor: FishingTheme.colors.sageGreen 
  },
  tackleBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '600', 
    fontSize: 11 
  },
  tackleBtnTextActive: { color: FishingTheme.colors.cream },
  
  filtersFooter: { 
    padding: 16, 
    borderTopWidth: 2, 
    borderTopColor: FishingTheme.colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    flex: 1,
  },
  clearBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700', 
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  applyBtn: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
    flex: 1.5,
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
  messageHints: { marginTop: 16 },
  hintTitle: { 
    fontSize: 10, 
    color: FishingTheme.colors.text.tertiary, 
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hintText: { 
    fontSize: 12, 
    color: FishingTheme.colors.text.secondary, 
    marginBottom: 4,
    marginLeft: 4,
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
});
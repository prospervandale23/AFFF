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
import { FishingTheme } from '../../constants/FishingTheme';
import { supabase } from '../../lib/supabase';

interface FishingBuddy {
  id: string;
  display_name: string;
  age: number;
  location: string;
  distance: number; // Distance in miles
  tackle_categories: string[];
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced';
  bio: string;
  profile_photo_url?: string;
  last_active: string;
  has_boat: boolean;
  boat_type?: string;
  boat_name?: string;
  boat_length?: string;
  favorite_species: string[];
  home_port: string;
  fishing_type: 'freshwater' | 'saltwater';
  instagram?: string;
  preferred_times?: string[];
}

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

// Mock profile photos (using placeholder URLs)
const mockPhotos = {
  saltwater: [
    'https://images.unsplash.com/photo-1529230117010-b6c436154f25?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1516690553959-71a414d6b9b6?w=400&h=500&fit=crop',
  ],
  freshwater: [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504309250229-4f08315f7b5e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1528837516156-0a7225a43641?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=400&h=500&fit=crop',
  ]
};

// Mock data for demo
const mockSaltwaterBuddies: FishingBuddy[] = [
  {
    id: 'sw1',
    display_name: 'Captain Mike',
    age: 42,
    location: 'Point Judith, RI',
    distance: 8,
    tackle_categories: ['Heavy Spinning', 'Jigging', 'Trolling'],
    experience_level: 'Advanced',
    bio: "30+ years fishing the Northeast waters. I run charters out of Point Judith targeting stripers, blues, and tuna. Always looking for serious anglers to share fuel costs on off days.",
    profile_photo_url: mockPhotos.saltwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    has_boat: true,
    boat_type: 'Center Console',
    boat_name: 'Reel Deal',
    boat_length: '31-35ft',
    favorite_species: ['Striped Bass', 'Tuna', 'Bluefish'],
    home_port: 'Point Judith Marina',
    fishing_type: 'saltwater',
    instagram: '@captmike_ri',
    preferred_times: ['Dawn', 'Dusk']
  },
  {
    id: 'sw2',
    display_name: 'Sarah T',
    age: 28,
    location: 'Newport, RI',
    distance: 12,
    tackle_categories: ['Light Spinning', 'Surf Casting'],
    experience_level: 'Intermediate',
    bio: "Marine biologist turned fishing enthusiast. Love early morning surf casting for stripers and sharing knowledge about sustainable fishing practices. Let's protect what we love!",
    profile_photo_url: mockPhotos.saltwater[1],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    has_boat: false,
    favorite_species: ['Striped Bass', 'Fluke', 'Sea Bass'],
    home_port: 'Castle Hill',
    fishing_type: 'saltwater',
    instagram: '@oceanbiosarah',
    preferred_times: ['Early Morning', 'Morning']
  },
  {
    id: 'sw3',
    display_name: 'Tony "Tuna"',
    age: 55,
    location: 'Galilee, RI',
    distance: 10,
    tackle_categories: ['Heavy Spinning', 'Trolling', 'Jigging'],
    experience_level: 'Advanced',
    bio: "Tournament angler, 3x Block Island tuna champion. Have a 35' Contender always rigged and ready. Split costs, catch giants, tell stories. Simple as that.",
    profile_photo_url: mockPhotos.saltwater[2],
    last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    has_boat: true,
    boat_type: 'Sportfisher',
    boat_name: 'Tuna Terror',
    boat_length: '36-40ft',
    favorite_species: ['Tuna', 'Mahi', 'Striped Bass'],
    home_port: 'Port of Galilee',
    fishing_type: 'saltwater',
    preferred_times: ['Dawn', 'Morning', 'Afternoon']
  },
  {
    id: 'sw4',
    display_name: 'Jake Sullivan',
    age: 34,
    location: 'Wickford, RI',
    distance: 18,
    tackle_categories: ['Light Spinning', 'Jigging'],
    experience_level: 'Beginner',
    bio: "New to saltwater fishing but eager to learn! Just moved to RI from Colorado. Have all the gear, need the knowledge. Happy to help with boat costs or shore fishing.",
    profile_photo_url: mockPhotos.saltwater[3],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    has_boat: false,
    favorite_species: ['Striped Bass', 'Fluke'],
    home_port: 'Wickford Harbor',
    fishing_type: 'saltwater',
    preferred_times: ['Weekends Only']
  },
  {
    id: 'sw5',
    display_name: 'Captain Amanda',
    age: 38,
    location: 'Narragansett, RI',
    distance: 5,
    tackle_categories: ['Light Spinning', 'Heavy Spinning', 'Surf Casting'],
    experience_level: 'Advanced',
    bio: "USCG licensed captain. Specialize in light tackle and fly fishing for albies and bonito. My 24' bay boat is perfect for skinny water. Dawn patrol is my favorite!",
    profile_photo_url: mockPhotos.saltwater[4],
    last_active: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    has_boat: true,
    boat_type: 'Bay Boat',
    boat_name: 'Salty Sisters',
    boat_length: '20-25ft',
    favorite_species: ['False Albacore', 'Bonito', 'Striped Bass'],
    home_port: 'Ram Point Marina',
    fishing_type: 'saltwater',
    instagram: '@saltysistercharters',
    preferred_times: ['Dawn', 'Early Morning']
  },
  {
    id: 'sw6',
    display_name: 'Dave "Fluke" Finder',
    age: 48,
    location: 'Watch Hill, RI',
    distance: 25,
    tackle_categories: ['Light Spinning', 'Jigging'],
    experience_level: 'Intermediate',
    bio: "Fluke fanatic! Know all the best drifts from Watch Hill to Block Island. Looking for buddies who appreciate the art of bucktailing. 22' Parker always ready to go.",
    profile_photo_url: mockPhotos.saltwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    has_boat: true,
    boat_type: 'Center Console',
    boat_name: 'Fluke Finder',
    boat_length: '20-25ft',
    favorite_species: ['Fluke', 'Sea Bass', 'Tautog'],
    home_port: 'Watch Hill Marina',
    fishing_type: 'saltwater',
    preferred_times: ['Morning', 'Afternoon']
  }
];

const mockFreshwaterBuddies: FishingBuddy[] = [
  {
    id: 'fw1',
    display_name: 'Big Bass Bill',
    age: 45,
    location: 'Lake Winnipesaukee, NH',
    distance: 75,
    tackle_categories: ['Baitcasting', 'Medium Spinning'],
    experience_level: 'Advanced',
    bio: "Tournament bass angler with 20+ years experience. Know every honey hole on Winnipesaukee. Running a Ranger 520 with all the electronics. Let's chase some hawgs!",
    profile_photo_url: mockPhotos.freshwater[0],
    last_active: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    has_boat: true,
    boat_type: 'Bass Boat',
    boat_name: 'Bass Master',
    boat_length: '20-25ft',
    favorite_species: ['Bass', 'Pike', 'Perch'],
    home_port: 'Alton Bay',
    fishing_type: 'freshwater',
    instagram: '@bigbassbill_nh',
    preferred_times: ['Dawn', 'Dusk']
  },
  {
    id: 'fw2',
    display_name: 'Emma Fisher',
    age: 26,
    location: 'Lake George, NY',
    distance: 120,
    tackle_categories: ['Fly', 'Light Spinning'],
    experience_level: 'Intermediate',
    bio: "Fly fishing enthusiast and outdoor photographer. Love catching native brook trout in the Adirondacks. Always looking for scenic spots and fishing buddies who respect nature.",
    profile_photo_url: mockPhotos.freshwater[1],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    has_boat: false,
    favorite_species: ['Trout', 'Bass', 'Pike'],
    home_port: 'Lake George Village',
    fishing_type: 'freshwater',
    instagram: '@flyfishemma',
    preferred_times: ['Early Morning', 'Morning']
  },
  {
    id: 'fw3',
    display_name: 'Old Timer Tom',
    age: 67,
    location: 'Lake Champlain, VT',
    distance: 150,
    tackle_categories: ['Ice Fishing', 'Light Spinning', 'Medium Spinning'],
    experience_level: 'Advanced',
    bio: "Retired and fishing every day. Know Champlain like the back of my hand. Got a reliable Lund with a 4-stroke. Coffee's always hot, stories are free, let's catch some walleye!",
    profile_photo_url: mockPhotos.freshwater[2],
    last_active: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    has_boat: true,
    boat_type: 'Jon Boat',
    boat_name: 'Time Killer',
    boat_length: 'Under 20ft',
    favorite_species: ['Walleye', 'Pike', 'Perch', 'Bass'],
    home_port: 'Burlington Harbor',
    fishing_type: 'freshwater',
    preferred_times: ['Early Morning', 'Morning', 'Afternoon']
  },
  {
    id: 'fw4',
    display_name: 'College Chris',
    age: 22,
    location: 'Quabbin Reservoir, MA',
    distance: 45,
    tackle_categories: ['Light Spinning', 'Fly'],
    experience_level: 'Beginner',
    bio: "URI student, fishing team member. Learning to fish New England waters. Have a kayak and basic gear. Down for early morning sessions before class!",
    profile_photo_url: mockPhotos.freshwater[3],
    last_active: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    has_boat: false,
    favorite_species: ['Bass', 'Trout'],
    home_port: 'Gate 8 Launch',
    fishing_type: 'freshwater',
    instagram: '@chrisfishesuri',
    preferred_times: ['Early Morning', 'Weekends Only']
  },
  {
    id: 'fw5',
    display_name: 'Pike Mike',
    age: 39,
    location: 'Connecticut River, CT',
    distance: 65,
    tackle_categories: ['Medium Spinning', 'Heavy Spinning', 'Baitcasting'],
    experience_level: 'Intermediate',
    bio: "Northern pike specialist. If it has teeth, I'm hunting it. Got a 20' aluminum perfect for river fishing. Always catch and release for the big ones. Tight lines!",
    profile_photo_url: mockPhotos.freshwater[4],
    last_active: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    has_boat: true,
    boat_type: 'Jon Boat',
    boat_name: 'Pike Finder',
    boat_length: 'Under 20ft',
    favorite_species: ['Pike', 'Bass', 'Catfish'],
    home_port: 'Haddam Meadows',
    fishing_type: 'freshwater',
    preferred_times: ['Dawn', 'Dusk', 'Night']
  }
];

// Combine all mock buddies
const allMockBuddies = [...mockSaltwaterBuddies, ...mockFreshwaterBuddies];

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
  // The main container uses flex:1 to fill the entire screen
  // Safe areas are handled at the top and bottom
  // The middle content area flexes to fill available space
  return (
    <View style={styles.container}>
      {/* 
        SAFE AREA TOP
        - Protects content from status bar
        - Height dynamically set based on device (notch, dynamic island, etc)
        - Background matches app theme for seamless look
      */}
      <View style={[styles.safeAreaTop, { height: insets.top }]} />
      
      {/* 
        HEADER SECTION
        - Fixed height header that doesn't scroll
        - Contains title, subtitle, and filter button
        - Filter button shows active indicator (green dot) when filters applied
      */}
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

      {/* 
        MAIN CONTENT AREA
        - Uses flex:1 to fill all available space between header and nav
        - Contains the swipeable card stack
        - Card is sized to fit within this container
      */}
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

      {/* 
        NAVIGATION SECTION
        - Fixed at bottom, doesn't scroll
        - Contains Previous, Message, and Next buttons
        - Buttons disable at list boundaries
      */}
      <View style={styles.navigationSection}>
        <View style={styles.navigationButtons}>
          <Pressable 
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]} 
            onPress={goToPrevious} 
            disabled={currentIndex === 0}
          >
            <Text style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}>
              ← PREV
            </Text>
          </Pressable>
          
          <Pressable style={styles.messageButton} onPress={() => openMessageModal(currentBuddy)}>
            <Text style={styles.messageButtonText}>MESSAGE</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.navButton, currentIndex === buddies.length - 1 && styles.navButtonDisabled]} 
            onPress={goToNext} 
            disabled={currentIndex === buddies.length - 1}
          >
            <Text style={[styles.navButtonText, currentIndex === buddies.length - 1 && styles.navButtonTextDisabled]}>
              NEXT →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 
        SAFE AREA BOTTOM
        - Protects navigation from home indicator
        - Only applies on devices with home indicators (iPhone X+)
      */}
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
      {/* 
        PHOTO SECTION (40% of card height)
        - Shows profile photo or placeholder
        - Overlay contains name, location, and status
      */}
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
      
      {/* 
        DETAILS SECTION (60% of card height)
        - Fixed height container with internal scrolling
        - Contains bio, boat info, tackle, species, etc.
      */}
      <View style={styles.buddyDetailsContainer}>
        <ScrollView 
          style={styles.buddyDetailsScroll}
          contentContainerStyle={styles.buddyDetailsContent}
          showsVerticalScrollIndicator={false}
          bounces={false} // Prevents bounce effect
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
        
        {/* 
          MESSAGE BUTTON
          - Fixed at bottom of details section
          - Always visible, doesn't scroll
        */}
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
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>×</Text>
            </Pressable>
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
  /**
   * Main container that fills entire screen
   * Uses flex layout to properly distribute space
   */
  container: { 
    flex: 1, 
    backgroundColor: FishingTheme.colors.background 
  },
  
  /**
   * Safe area views for notch/home indicator
   * Height is set dynamically based on device
   */
  safeAreaTop: {
    backgroundColor: FishingTheme.colors.background,
  },
  safeAreaBottom: {
    backgroundColor: FishingTheme.colors.background,
  },
  
  /**
   * Main content area between header and navigation
   * Flexes to fill available space
   */
  mainContent: {
    flex: 1, // Takes all available space between header and nav
  },
  
  /**
   * Centered content for loading/empty states
   */
  centeredContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  
  // ========== HEADER STYLES ==========
  /**
   * Fixed header at top of screen
   * Contains title and filter button
   */
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
    marginRight: 10, // Space between title and filter button
  },
  feedTitle: { 
    fontSize: 20, // Reduced to fit better
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
  
  /**
   * Filter button in top right corner
   * Shows active indicator when filters applied
   */
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
    backgroundColor: '#72E5A2', // Bright green for visibility
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 2,
    borderColor: FishingTheme.colors.background,
  },
  
  // ========== CARD STACK STYLES ==========
  /**
   * Container for swipeable cards
   * Centers card in available space
   */
  cardStack: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 16, // Reduced padding for more card space
    paddingVertical: 10,
  },
  
  /**
   * Individual swipeable card
   * Fixed dimensions based on available space
   */
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT * 0.85, // Slightly reduced to fit better
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
    ...FishingTheme.shadows.md,
  },
  
  // ========== BUDDY CARD STYLES ==========
  /**
   * Main card container with fixed layout
   */
  buddyCard: { 
    flex: 1,
    backgroundColor: FishingTheme.colors.card,
  },
  
  /**
   * Photo section - 40% of card height
   */
  photoContainer: { 
    height: '40%', // Fixed percentage of card
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
  
  /**
   * Photo overlay with user info
   * Gradient background for readability
   */
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
  
  /**
   * Details section - 60% of card height
   * Contains scrollable content and fixed message button
   */
  buddyDetailsContainer: { 
    height: '60%', // Fixed percentage of card
    backgroundColor: FishingTheme.colors.card,
  },
  buddyDetailsScroll: {
    flex: 1,
  },
  buddyDetailsContent: {
    padding: 16,
    paddingBottom: 8, // Reduced since button is separate
  },
  buddyBio: { 
    fontSize: 13, 
    color: FishingTheme.colors.text.primary, 
    lineHeight: 19, 
    marginBottom: 12,
    fontStyle: 'italic',
  },
  
  /**
   * Detail rows for structured information
   */
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
  
  /**
   * Tackle and time chips
   */
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
  
  /**
   * Message button container - fixed at bottom of details
   */
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
  /**
   * Navigation section at bottom of screen
   */
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
  navButtonDisabled: { 
    opacity: 0.4,
    backgroundColor: FishingTheme.colors.tan,
  },
  navButtonText: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  navButtonTextDisabled: { 
    color: FishingTheme.colors.text.muted,
  },
  messageButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 20, 
    paddingVertical: 11, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  
  
  cardStack2: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  swipeCard2: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
    ...FishingTheme.shadows.md,
  },
  
  buddyCard2: { flex: 1 },
  photoContainer2: { flex: 0.55, position: 'relative' },
  buddyPhoto2: { width: '100%', height: '100%' },
  placeholderPhoto2: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: FishingTheme.colors.sageGreen, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText2: { 
    fontSize: 24, 
    marginBottom: 8, 
    color: FishingTheme.colors.cream,
    fontWeight: '800',
    letterSpacing: 2,
  },
  placeholderName2: { 
    fontSize: 18, 
    color: FishingTheme.colors.cream, 
    fontWeight: '600' 
  },
  photoOverlay2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(47, 69, 56, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buddyInfo2: { gap: 2 },
  buddyName2: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: FishingTheme.colors.cream,
    letterSpacing: -0.5,
  },
  buddyLocation2: { fontSize: 13, color: FishingTheme.colors.cream, opacity: 0.95 },
  buddyHomePort2: { fontSize: 12, color: FishingTheme.colors.cream, opacity: 0.9 },
  buddyActivity2: { fontSize: 11, color: FishingTheme.colors.cream, marginTop: 2, opacity: 0.85 },
  buddyInstagram2: { fontSize: 11, color: FishingTheme.colors.cream, marginTop: 2, opacity: 0.85 },
  
  buddyDetails: { flex: 0.45, padding: 16, backgroundColor: FishingTheme.colors.card },
  buddyBio2: { 
    fontSize: 14, 
    color: FishingTheme.colors.text.primary, 
    lineHeight: 20, 
    marginBottom: 12,
    fontStyle: 'italic',
  },
  detailRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailSection2: { gap: 6, marginBottom: 10 },
  detailLabel2: { 
    fontSize: 10, 
    color: FishingTheme.colors.text.tertiary, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue2: { fontSize: 13, color: FishingTheme.colors.text.primary, fontWeight: '600', flex: 1, textAlign: 'right' },
  tackleRow2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  miniChip2: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  miniChipText2: { 
    fontSize: 10, 
    color: FishingTheme.colors.cream, 
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timeChip2: { 
    backgroundColor: FishingTheme.colors.tan, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  timeChipText2: { 
    fontSize: 10, 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  messageCardButton2: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    marginTop: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageCardButtonText2: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  
  navigationButtons2: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: FishingTheme.colors.background,
    borderTopWidth: 2,
    borderTopColor: FishingTheme.colors.border,
  },
  navButton2: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  navButtonDisabled2: { 
    opacity: 0.4,
    backgroundColor: FishingTheme.colors.tan,
  },
  navButtonText2: { 
    color: FishingTheme.colors.darkGreen, 
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  navButtonTextDisabled2: { 
    color: FishingTheme.colors.text.muted,
  },
  messageButton2: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  messageButtonText2: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800',
    letterSpacing: 0.5,
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
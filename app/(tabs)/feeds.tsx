import { useFishing } from '@/contexts/FishingContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { getPotentialMatches, startConversation, UserProfile } from '../../lib/api';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXPERIENCE_OPTIONS = ['all', 'Beginner', 'Intermediate', 'Advanced'] as const;
type ExperienceFilter = typeof EXPERIENCE_OPTIONS[number];

export default function FeedsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fishingType } = useFishing();

  // --- Core State ---
  const [buddies, setBuddies] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // --- Filter UI State ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterDistance, setFilterDistance] = useState(25);
  const [filterHasBoat, setFilterHasBoat] = useState(false);
  const [filterExperience, setFilterExperience] = useState<ExperienceFilter>('all');

  useEffect(() => {
    loadInitialData();
  }, [fishingType]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      setCurrentUserId(session.user.id);

      // DEFENSIVE API CALL: 
      // If your API/Database isn't updated yet, this try/catch prevents the blank screen.
      try {
        const matches = await getPotentialMatches(session.user.id, {
          fishingType: fishingType || undefined,
          maxDistance: filterDistance,
          hasBoat: filterHasBoat || undefined,
          experienceLevel: filterExperience !== 'all' ? filterExperience : undefined
        });
        setBuddies(matches || []);
      } catch (apiError) {
        console.warn("API Error (likely missing SQL/RPC):", apiError);
        setBuddies([]); // Default to empty if API fails
      }

      setCurrentIndex(0);
    } catch (error) {
      console.error('Session Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleApplyFilters = () => {
    setIsModalVisible(false);
    loadInitialData();
  };

  const handleStartChat = async (buddy: UserProfile) => {
    if (!currentUserId) return;
    try {
      const conv = await startConversation(currentUserId, buddy.id);
      router.push({
        pathname: "/conversation/[id]",
        params: { 
          id: conv.id, 
          name: buddy.display_name || 'Fisherman', 
          photo: buddy.profile_photo_url || '' 
        }
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={FishingTheme.colors.darkGreen} />
    </View>
  );

  const currentBuddy = buddies[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>FISHING BUDDIES</Text>
            <Text style={styles.headerSubtitle}>{buddies.length} nearby anglers</Text>
          </View>

          <Pressable 
            style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.filterBtnText}>FILTERS</Text>
          </Pressable>
        </View>
      </View>

      {/* MAIN FEED */}
      <View style={styles.main}>
        {currentBuddy ? (
          <View style={styles.card}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.photoContainer}>
                {currentBuddy.profile_photo_url ? (
                  <Image source={{ uri: currentBuddy.profile_photo_url }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>NO PHOTO</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoBar}>
                <Text style={styles.name}>{currentBuddy.display_name || 'Anonymous'}</Text>
                <Text style={styles.location}>📍 {currentBuddy.home_port || 'Unknown location'}</Text>
              </View>

              <View style={styles.details}>
                <Text style={styles.bio}>{currentBuddy.bio || "No bio yet. Ready to fish!"}</Text>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{currentBuddy.experience_level || 'Beginner'}</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: FishingTheme.colors.sageGreen }]}>
                    <Text style={styles.chipText}>{currentBuddy.fishing_type || 'Angler'}</Text>
                  </View>
                  {currentBuddy['has_boat'] && (
                    <View style={[styles.chip, { backgroundColor: FishingTheme.colors.tan }]}>
                      <Text style={[styles.chipText, { color: FishingTheme.colors.darkGreen }]}>🚤 Has Boat</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable 
                style={[styles.navBtn, currentIndex === 0 && styles.disabled]} 
                onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navBtnText}>PREV</Text>
              </Pressable>
              <Pressable style={styles.chatBtn} onPress={() => handleStartChat(currentBuddy)}>
                <Text style={styles.chatBtnText}>MESSAGE</Text>
              </Pressable>
              <Pressable 
                style={[styles.navBtn, currentIndex === buddies.length - 1 && styles.disabled]} 
                onPress={() => setCurrentIndex(Math.min(buddies.length - 1, currentIndex + 1))}
                disabled={currentIndex === buddies.length - 1}
              >
                <Text style={styles.navBtnText}>NEXT</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No buddies found.</Text>
            <Text style={styles.emptySubtext}>Try broadening your filters.</Text>
          </View>
        )}
      </View>

      {/* FILTER MODAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>FILTERS</Text>
            
            {/* Distance Filter */}
            <Text style={styles.filterLabel}>Distance: {filterDistance} miles</Text>
            <View style={styles.segmentRow}>
              {[10, 25, 50, 100].map(d => (
                <Pressable 
                  key={d} 
                  onPress={() => setFilterDistance(d)} 
                  style={[styles.segBtn, filterDistance === d && styles.segBtnActive]}
                >
                  <Text style={[styles.segBtnText, filterDistance === d && styles.segBtnTextActive]}>
                    {d}mi
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Experience Filter */}
            <Text style={styles.filterLabel}>Experience Level</Text>
            <View style={styles.segmentRow}>
              {EXPERIENCE_OPTIONS.map(exp => (
                <Pressable 
                  key={exp} 
                  onPress={() => setFilterExperience(exp)} 
                  style={[styles.segBtn, styles.expBtn, filterExperience === exp && styles.segBtnActive]}
                >
                  <Text style={[styles.segBtnText, filterExperience === exp && styles.segBtnTextActive]}>
                    {exp === 'all' ? 'All' : exp}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Has Boat Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.filterLabel}>Has Boat</Text>
              <Switch 
                value={filterHasBoat} 
                onValueChange={setFilterHasBoat} 
                trackColor={{ false: '#ccc', true: FishingTheme.colors.darkGreen }} 
                thumbColor={filterHasBoat ? FishingTheme.colors.tan : '#f4f3f4'}
              />
            </View>

            {/* Active Filters Summary */}
            <View style={styles.activeFilters}>
              <Text style={styles.activeFiltersLabel}>Active filters:</Text>
              <Text style={styles.activeFiltersText}>
                {[
                  `${filterDistance}mi`,
                  filterExperience !== 'all' ? filterExperience : null,
                  filterHasBoat ? 'Has boat' : null
                ].filter(Boolean).join(' • ') || 'None'}
              </Text>
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
  photoContainer: { width: '100%', height: 350 },
  photo: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: FishingTheme.colors.sageGreen, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: 'white', fontWeight: '800' },
  infoBar: { backgroundColor: FishingTheme.colors.darkGreen, padding: 20 },
  name: { fontSize: 26, fontWeight: '900', color: 'white' },
  location: { fontSize: 14, color: 'white', opacity: 0.9, marginTop: 4 },
  details: { padding: 20 },
  bio: { fontSize: 16, color: FishingTheme.colors.text.primary, marginBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { backgroundColor: FishingTheme.colors.darkGreen, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: 'white', fontSize: 11, fontWeight: '700' },
  footer: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: FishingTheme.colors.background },
  navBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: FishingTheme.colors.tan, alignItems: 'center' },
  navBtnText: { fontWeight: '800', color: FishingTheme.colors.darkGreen },
  chatBtn: { flex: 2, padding: 12, borderRadius: 10, backgroundColor: FishingTheme.colors.darkGreen, alignItems: 'center' },
  chatBtnText: { fontWeight: '900', color: 'white' },
  disabled: { opacity: 0.3 },
  emptyText: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen },
  emptySubtext: { fontSize: 14, color: FishingTheme.colors.text.secondary, marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: FishingTheme.colors.darkGreen, marginBottom: 20 },
  filterLabel: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.text.tertiary, marginBottom: 10, marginTop: 5 },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  segBtn: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: FishingTheme.colors.border, alignItems: 'center' },
  expBtn: { paddingHorizontal: 6 },
  segBtnActive: { backgroundColor: FishingTheme.colors.darkGreen, borderColor: FishingTheme.colors.darkGreen },
  segBtnText: { fontWeight: '700', fontSize: 12, color: FishingTheme.colors.text.secondary },
  segBtnTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  activeFilters: { backgroundColor: FishingTheme.colors.background, padding: 12, borderRadius: 10, marginBottom: 20 },
  activeFiltersLabel: { fontSize: 11, fontWeight: '600', color: FishingTheme.colors.text.tertiary, marginBottom: 4 },
  activeFiltersText: { fontSize: 13, fontWeight: '700', color: FishingTheme.colors.darkGreen },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: FishingTheme.colors.text.tertiary },
  applyBtn: { flex: 2, backgroundColor: FishingTheme.colors.darkGreen, padding: 15, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { color: 'white', fontWeight: '900' }
});
import { useFishing } from '@/contexts/FishingContext';
import React, { useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { supabase } from '../../lib/supabase';

interface SimpleProfile {
  display_name: string;
  bio: string;
  home_port: string;
  age: string;
  location: string;
  tackle_categories: string[];
  rod: string;
  reel: string;
  line: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  has_boat: boolean;
  boat_type: string;
  boat_length: string;
  boat_name: string;
  favorite_species: string[];
  profile_photo_url: string;
  preferred_fishing_times: string[];
  tackle_details: {
    lures: string;
    bait: string;
    hooks: string;
    weights: string;
    other_gear: string;
  };
  fishing_type: 'freshwater' | 'saltwater' | null;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { fishingType, species, tackleCategories } = useFishing();
  
  const [profile, setProfile] = useState<SimpleProfile>({
    display_name: '',
    bio: '',
    home_port: '',
    age: '',
    location: '',
    tackle_categories: [],
    rod: '',
    reel: '',
    line: '',
    experience_level: null,
    has_boat: false,
    boat_type: '',
    boat_length: '',
    boat_name: '',
    favorite_species: [],
    profile_photo_url: '',
    preferred_fishing_times: [],
    tackle_details: {
      lures: '',
      bait: '',
      hooks: '',
      weights: '',
      other_gear: ''
    },
    fishing_type: fishingType
  });
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 ProfileScreen mounted, starting auth initialization...');
    initializeAuth();
  }, []);

  useEffect(() => {
    if (fishingType && profile.fishing_type !== fishingType) {
      setProfile(prev => ({ ...prev, fishing_type: fishingType }));
    }
  }, [fishingType]);

  async function initializeAuth() {
    console.log('🚀 initializeAuth called');
    
    try {
      setLoading(true);
      setAuthError(null);
      
      console.log('🔍 Checking for existing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('📊 Session check result:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email || 'no email',
        userId: session?.user?.id || 'no id',
        error: error?.message || 'no error'
      });
      
      if (error) {
        console.error('❌ Session check error:', error);
        setAuthError(error.message);
        setIsSignedIn(false);
        setLoading(false);
        return;
      }

      if (session && session.user) {
        console.log('✅ Found existing session for:', session.user.email);
        setIsSignedIn(true);
        await loadProfile(session.user.id);
      } else {
        console.log('❌ No existing session found');
        setIsSignedIn(false);
      }
    } catch (error) {
      console.error('💥 Auth initialization error:', error);
      setAuthError('Failed to initialize authentication');
      setIsSignedIn(false);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }

    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed!');
      console.log('📧 Event:', event);
      console.log('👤 User email:', session?.user?.email || 'none');
      console.log('🆔 User ID:', session?.user?.id || 'none');
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in successfully:', session.user.email);
          setIsSignedIn(true);
          setAuthError(null);
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ User signed out');
          setIsSignedIn(false);
          setAuthError(null);
          resetProfile();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed for:', session.user.email);
          if (isSignedIn) {
            await loadProfile(session.user.id);
          }
        } else {
          console.log('🤷 Unhandled auth event:', event);
        }
      } catch (error) {
        console.error('💥 Error handling auth state change:', error);
        setAuthError('Authentication error occurred');
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }

  async function loadProfile(userId: string) {
    console.log('📖 Loading profile for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('✅ Profile loaded successfully for:', data.display_name || 'unnamed user');
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          home_port: data.home_port || '',
          age: data.age?.toString() || '',
          location: data.location || '',
          tackle_categories: data.tackle_categories || [],
          rod: data.rod || '',
          reel: data.reel || '',
          line: data.line || '',
          experience_level: data.experience_level,
          has_boat: data.has_boat || false,
          boat_type: data.boat_type || '',
          boat_length: data.boat_length || '',
          boat_name: data.boat_name || '',
          favorite_species: data.favorite_species || [],
          profile_photo_url: data.profile_photo_url || '',
          preferred_fishing_times: data.preferred_fishing_times || [],
          tackle_details: {
            lures: data.tackle_details?.lures || '',
            bait: data.tackle_details?.bait || '',
            hooks: data.tackle_details?.hooks || '',
            weights: data.tackle_details?.weights || '',
            other_gear: data.tackle_details?.other_gear || ''
          },
          fishing_type: data.fishing_type || fishingType
        });
      } else {
        console.log('📝 No profile found, using defaults');
      }
    } catch (error) {
      console.error('💥 Load profile error:', error);
    }
  }

  function resetProfile() {
    console.log('🔄 Resetting profile to defaults');
    setProfile({
      display_name: '',
      bio: '',
      home_port: '',
      age: '',
      location: '',
      tackle_categories: [],
      rod: '',
      reel: '',
      line: '',
      experience_level: null,
      has_boat: false,
      boat_type: '',
      boat_length: '',
      boat_name: '',
      favorite_species: [],
      profile_photo_url: '',
      preferred_fishing_times: [],
      tackle_details: {
        lures: '',
        bait: '',
        hooks: '',
        weights: '',
        other_gear: ''
      },
      fishing_type: fishingType
    });
  }

  async function saveProfile() {
    console.log('💾 Attempting to save profile...');
    
    try {
      setSaving(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No valid session for saving profile');
        Alert.alert('Error', 'You must be signed in to save your profile');
        return;
      }

      console.log('💾 Saving profile for user:', session.user.id);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          display_name: profile.display_name,
          bio: profile.bio,
          home_port: profile.home_port,
          age: profile.age ? parseInt(profile.age) : null,
          location: profile.location,
          tackle_categories: profile.tackle_categories,
          rod: profile.rod,
          reel: profile.reel,
          line: profile.line,
          experience_level: profile.experience_level,
          has_boat: profile.has_boat,
          boat_type: profile.boat_type,
          boat_length: profile.boat_length,
          boat_name: profile.boat_name,
          favorite_species: profile.favorite_species,
          profile_photo_url: profile.profile_photo_url,
          preferred_fishing_times: profile.preferred_fishing_times,
          tackle_details: profile.tackle_details,
          fishing_type: fishingType,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Save error:', error);
        Alert.alert('Error', 'Failed to save profile: ' + error.message);
        return;
      }

      console.log('✅ Profile saved successfully');
      Alert.alert('Success!', 'Your profile has been saved');
      setSettingsOpen(false);
    } catch (error) {
      console.error('💥 Save profile error:', error);
      Alert.alert('Error', 'Something went wrong while saving');
    } finally {
      setSaving(false);
    }
  }

  async function signInAnonymously() {
    console.log('🔐 Anonymous sign in process started');
    
    try {
      setAuthError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('❌ Anonymous sign in error:', error);
        setAuthError(error.message);
        Alert.alert('Error', error.message);
      } else {
        console.log('✅ Anonymous sign in successful');
        console.log('👤 User ID:', data.user?.id);
      }
    } catch (error) {
      console.error('💥 Unexpected anonymous sign in error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    console.log('🚪 Sign out process started');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        Alert.alert('Error', error.message);
      } else {
        console.log('✅ Signed out successfully');
      }
    } catch (error) {
      console.error('💥 Unexpected sign out error:', error);
      Alert.alert('Error', 'Something went wrong while signing out');
    }
  }

  function toggleTackle(tackle: string) {
    const current = profile.tackle_categories;
    const updated = current.includes(tackle)
      ? current.filter(t => t !== tackle)
      : [...current, tackle];
    
    setProfile(prev => ({ ...prev, tackle_categories: updated }));
  }

  function toggleSpecies(speciesName: string) {
    const current = profile.favorite_species;
    const updated = current.includes(speciesName)
      ? current.filter(s => s !== speciesName)
      : [...current, speciesName];
    
    setProfile(prev => ({ ...prev, favorite_species: updated }));
  }

  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    console.log('🔓 Rendering sign-in state');
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 20 }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>AFF</Text>
        </View>
        <Text style={styles.sectionTitle}>ANGLER FRIEND FINDER</Text>
        <Text style={styles.signInText}>
          Create your {fishingType} fishing profile and connect with other anglers instantly!
        </Text>
        
        {authError && (
          <Text style={styles.errorText}>
            Error: {authError}
          </Text>
        )}
        
        <Pressable style={styles.signInButton} onPress={signInAnonymously}>
          <Text style={styles.signInButtonText}>GET STARTED</Text>
        </Pressable>
      </View>
    );
  }

  console.log('✅ Rendering signed-in profile state');
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.profileContent, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>YOUR PROFILE</Text>
            <View style={styles.fishingTypeBadge}>
              <Text style={styles.fishingTypeText}>
                {fishingType === 'freshwater' ? 'FRESHWATER' : 'SALTWATER'}
              </Text>
            </View>
          </View>
          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </Pressable>
        </View>
        
        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>DISPLAY NAME</Text>
          <Text style={styles.profileValue}>{profile.display_name || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>BIO</Text>
          <Text style={styles.profileValue}>{profile.bio || 'No bio yet'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>HOME PORT</Text>
          <Text style={styles.profileValue}>{profile.home_port || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>AGE</Text>
          <Text style={styles.profileValue}>{profile.age || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>EXPERIENCE LEVEL</Text>
          <Text style={styles.profileValue}>{profile.experience_level || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>HAS BOAT</Text>
          <Text style={styles.profileValue}>{profile.has_boat ? 'Yes' : 'No'}</Text>
        </View>

        {profile.has_boat && (
          <>
            <View style={styles.profileSection}>
              <Text style={styles.profileLabel}>BOAT DETAILS</Text>
              <Text style={styles.profileValue}>
                {profile.boat_name || 'Unnamed'} • {profile.boat_type || 'Type not set'} • {profile.boat_length || 'Length not set'}
              </Text>
            </View>
          </>
        )}

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>FAVORITE SPECIES</Text>
          <View style={styles.tackleList}>
            {profile.favorite_species.length > 0 ? 
              profile.favorite_species.map(s => (
                <View key={s} style={styles.tackleChip}>
                  <Text style={styles.tackleChipText}>{s}</Text>
                </View>
              )) : 
              <Text style={styles.profileValue}>None selected</Text>
            }
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>PREFERRED FISHING TIMES</Text>
          <View style={styles.tackleList}>
            {profile.preferred_fishing_times.length > 0 ? 
              profile.preferred_fishing_times.map(time => (
                <View key={time} style={styles.tackleChip}>
                  <Text style={styles.tackleChipText}>{time}</Text>
                </View>
              )) : 
              <Text style={styles.profileValue}>None selected</Text>
            }
          </View>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>TACKLE CATEGORIES</Text>
          <View style={styles.tackleList}>
            {profile.tackle_categories.length > 0 ? 
              profile.tackle_categories.map(t => (
                <View key={t} style={styles.tackleChip}>
                  <Text style={styles.tackleChipText}>{t}</Text>
                </View>
              )) : 
              <Text style={styles.profileValue}>None selected</Text>
            }
          </View>
        </View>

        <Pressable style={styles.editButton} onPress={() => setSettingsOpen(true)}>
          <Text style={styles.editButtonText}>EDIT PROFILE</Text>
        </Pressable>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>EDIT PROFILE</Text>
              <Pressable onPress={() => setSettingsOpen(false)} style={styles.xBtn}>
                <Text style={styles.xBtnText}>×</Text>
              </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={styles.settingsContent}>
              <Text style={styles.label}>DISPLAY NAME</Text>
              <TextInput
                placeholder="What should people call you?"
                placeholderTextColor={FishingTheme.colors.text.muted}
                value={profile.display_name}
                onChangeText={(v) => setProfile(p => ({ ...p, display_name: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>BIO</Text>
              <TextInput
                placeholder="Tell people about your fishing style..."
                placeholderTextColor={FishingTheme.colors.text.muted}
                value={profile.bio}
                onChangeText={(v) => setProfile(p => ({ ...p, bio: v }))}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>HOME PORT</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' ? "e.g., Lake George, NY" : "e.g., Point Judith, RI"}
                placeholderTextColor={FishingTheme.colors.text.muted}
                value={profile.home_port}
                onChangeText={(v) => setProfile(p => ({ ...p, home_port: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>AGE</Text>
              <TextInput
                placeholder="Your age"
                placeholderTextColor={FishingTheme.colors.text.muted}
                value={profile.age}
                onChangeText={(v) => setProfile(p => ({ ...p, age: v }))}
                style={styles.input}
                keyboardType="numeric"
              />

              <Text style={styles.label}>LOCATION</Text>
              <TextInput
                placeholder="City, State"
                placeholderTextColor={FishingTheme.colors.text.muted}
                value={profile.location}
                onChangeText={(v) => setProfile(p => ({ ...p, location: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>EXPERIENCE LEVEL</Text>
              <View style={styles.chipsWrap}>
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => {
                  const active = profile.experience_level === level;
                  return (
                    <Pressable 
                      key={level} 
                      onPress={() => setProfile(p => ({ ...p, experience_level: level }))} 
                      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                    >
                      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{level}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>FAVORITE SPECIES</Text>
              <View style={styles.chipsWrap}>
                {species.map(s => {
                  const active = profile.favorite_species.includes(s);
                  return (
                    <Pressable 
                      key={s} 
                      onPress={() => toggleSpecies(s)} 
                      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                    >
                      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{s}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>TACKLE CATEGORIES</Text>
              <View style={styles.chipsWrap}>
                {tackleCategories.map(t => {
                  const active = profile.tackle_categories.includes(t);
                  return (
                    <Pressable key={t} onPress={() => toggleTackle(t)} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
                      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>HAS BOAT</Text>
              <Pressable 
                onPress={() => setProfile(p => ({ ...p, has_boat: !p.has_boat }))}
                style={[styles.chip, profile.has_boat ? styles.chipActive : styles.chipIdle]}
              >
                <Text style={profile.has_boat ? styles.chipTextActive : styles.chipTextIdle}>
                  {profile.has_boat ? 'Yes, I have a boat' : 'No boat'}
                </Text>
              </Pressable>

              {profile.has_boat && (
                <>
                  <Text style={styles.label}>BOAT NAME</Text>
                  <TextInput
                    placeholder="e.g., Sea Hunter, Miss Sarah"
                    placeholderTextColor={FishingTheme.colors.text.muted}
                    value={profile.boat_name}
                    onChangeText={(v) => setProfile(p => ({ ...p, boat_name: v }))}
                    style={styles.input}
                  />

                  <Text style={styles.label}>BOAT TYPE</Text>
                  <View style={styles.chipsWrap}>
                    {(fishingType === 'freshwater' 
                      ? ['Bass Boat', 'Jon Boat', 'Pontoon', 'Kayak', 'Canoe', 'Other']
                      : ['Center Console', 'Sportfisher', 'Bay Boat', 'Flats Boat', 'Charter Boat', 'Other']
                    ).map(type => {
                      const active = profile.boat_type === type;
                      return (
                        <Pressable 
                          key={type} 
                          onPress={() => setProfile(p => ({ ...p, boat_type: type }))} 
                          style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                        >
                          <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{type}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.label}>BOAT LENGTH</Text>
                  <View style={styles.chipsWrap}>
                    {['Under 20ft', '20-25ft', '26-30ft', '31-35ft', '36-40ft', '40ft+'].map(length => {
                      const active = profile.boat_length === length;
                      return (
                        <Pressable 
                          key={length} 
                          onPress={() => setProfile(p => ({ ...p, boat_length: length }))} 
                          style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                        >
                          <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{length}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.label}>PREFERRED FISHING TIMES</Text>
              <View style={styles.chipsWrap}>
                {['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night', 'Dawn', 'Dusk', 'Weekends Only'].map(time => {
                  const active = profile.preferred_fishing_times.includes(time);
                  return (
                    <Pressable 
                      key={time} 
                      onPress={() => {
                        const current = profile.preferred_fishing_times;
                        const updated = active 
                          ? current.filter(t => t !== time)
                          : [...current, time];
                        setProfile(p => ({ ...p, preferred_fishing_times: updated }));
                      }} 
                      style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
                    >
                      <Text style={active ? styles.chipTextActive : styles.chipTextIdle}>{time}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.settingsFooter}>
              <Pressable 
                onPress={saveProfile} 
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE PROFILE'}</Text>
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
  centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: FishingTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: FishingTheme.colors.cream,
    letterSpacing: 2,
  },
  
  profileContent: { padding: 20, gap: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  sectionTitle: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 24, 
    fontWeight: '800', 
    marginBottom: 8,
    letterSpacing: 1,
  },
  
  fishingTypeBadge: { 
    backgroundColor: FishingTheme.colors.card, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    alignSelf: 'flex-start',
  },
  fishingTypeText: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  profileSection: { gap: 8 },
  profileLabel: { 
    fontSize: 11, 
    color: FishingTheme.colors.text.tertiary, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileValue: { fontSize: 16, color: FishingTheme.colors.text.primary, fontWeight: '500' },
  tackleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tackleChip: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  tackleChipText: { 
    fontSize: 12, 
    color: FishingTheme.colors.cream, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  loadingText: { color: FishingTheme.colors.text.primary, fontSize: 16 },
  signInText: { 
    color: FishingTheme.colors.text.secondary, 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 22,
    maxWidth: 300,
  },
  signInButton: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  signInButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    fontSize: 16,
    letterSpacing: 0.5,
  },
  signOutButton: { 
    backgroundColor: FishingTheme.colors.status.poor, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  signOutText: { 
    color: FishingTheme.colors.cream, 
    fontSize: 11, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: { 
    color: FishingTheme.colors.status.poor, 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 16, 
    paddingHorizontal: 20 
  },
  
  editButton: {
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  editButtonText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Settings modal
  settingsBackdrop: { 
    flex: 1, 
    backgroundColor: FishingTheme.colors.overlay, 
    justifyContent: 'center', 
    padding: 16 
  },
  settingsCard: { 
    backgroundColor: FishingTheme.colors.cream, 
    borderRadius: 18, 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.darkGreen, 
    maxHeight: '86%' 
  },
  settingsHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 2, 
    borderBottomColor: FishingTheme.colors.border 
  },
  settingsTitle: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 18, 
    fontWeight: '800',
    letterSpacing: 1,
  },
  xBtn: { 
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
  xBtnText: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 20,
    fontWeight: '400',
  },
  settingsContent: { padding: 16, gap: 10 },
  label: { 
    color: FishingTheme.colors.text.tertiary, 
    fontSize: 11, 
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: { 
    backgroundColor: FishingTheme.colors.card, 
    color: FishingTheme.colors.text.primary, 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.border,
    fontSize: 15,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    borderRadius: 999, 
    borderWidth: 2 
  },
  chipIdle: { 
    backgroundColor: FishingTheme.colors.card, 
    borderColor: FishingTheme.colors.border 
  },
  chipActive: { 
    backgroundColor: FishingTheme.colors.darkGreen, 
    borderColor: FishingTheme.colors.darkGreen 
  },
  chipTextIdle: { 
    color: FishingTheme.colors.text.secondary, 
    fontWeight: '600', 
    fontSize: 12 
  },
  chipTextActive: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800', 
    fontSize: 12,
    letterSpacing: 0.3,
  },
  settingsFooter: { padding: 12, borderTopWidth: 2, borderTopColor: FishingTheme.colors.border },
  saveBtn: { 
    alignSelf: 'flex-end', 
    backgroundColor: FishingTheme.colors.darkGreen, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderWidth: 2, 
    borderColor: FishingTheme.colors.forestGreen 
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { 
    color: FishingTheme.colors.cream, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeader: { 
    color: FishingTheme.colors.darkGreen, 
    fontSize: 16, 
    fontWeight: '800', 
    marginTop: 16, 
    marginBottom: 8,
    letterSpacing: 0.5,
  },
});
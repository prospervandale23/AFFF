import { useFishing } from '@/contexts/FishingContext';
import React, { useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
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

  // Update profile fishing type when context changes
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

  // Loading state
  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Not signed in state
  if (!isSignedIn) {
    console.log('🔓 Rendering sign-in state');
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.sectionTitle}>Welcome to Fishing Buddy!</Text>
        <Text style={styles.signInText}>
          Create your {fishingType} fishing profile and connect with other anglers instantly!
        </Text>
        
        {authError && (
          <Text style={styles.errorText}>
            Error: {authError}
          </Text>
        )}
        
        <Pressable style={styles.signInButton} onPress={signInAnonymously}>
          <Text style={styles.signInButtonText}>Get Started</Text>
        </Pressable>
      </View>
    );
  }

  // Signed in state - show profile
  console.log('✅ Rendering signed-in profile state');
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.headerButtons}>
            <View style={styles.fishingTypeBadge}>
              <Text style={styles.fishingTypeText}>
                {fishingType === 'freshwater' ? '🏞️ Freshwater' : '🌊 Saltwater'}
              </Text>
            </View>
            <Pressable style={styles.signOutButton} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
        
        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Display Name</Text>
          <Text style={styles.profileValue}>{profile.display_name || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Bio</Text>
          <Text style={styles.profileValue}>{profile.bio || 'No bio yet'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Home Port</Text>
          <Text style={styles.profileValue}>{profile.home_port || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Age</Text>
          <Text style={styles.profileValue}>{profile.age || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Experience Level</Text>
          <Text style={styles.profileValue}>{profile.experience_level || 'Not set'}</Text>
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Has Boat</Text>
          <Text style={styles.profileValue}>{profile.has_boat ? 'Yes 🚤' : 'No'}</Text>
        </View>

        {profile.has_boat && (
          <>
            <View style={styles.profileSection}>
              <Text style={styles.profileLabel}>Boat Details</Text>
              <Text style={styles.profileValue}>
                {profile.boat_name || 'Unnamed'} • {profile.boat_type || 'Type not set'} • {profile.boat_length || 'Length not set'}
              </Text>
            </View>
          </>
        )}

        <View style={styles.profileSection}>
          <Text style={styles.profileLabel}>Favorite Species</Text>
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
          <Text style={styles.profileLabel}>Preferred Fishing Times</Text>
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
          <Text style={styles.profileLabel}>Tackle Categories</Text>
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
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </Pressable>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Edit Profile</Text>
              <Pressable onPress={() => setSettingsOpen(false)} style={styles.xBtn}>
                <Text style={styles.xBtnText}>✕</Text>
              </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={styles.settingsContent}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                placeholder="What should people call you?"
                placeholderTextColor="#7E8BA0"
                value={profile.display_name}
                onChangeText={(v) => setProfile(p => ({ ...p, display_name: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>Bio</Text>
              <TextInput
                placeholder="Tell people about your fishing style..."
                placeholderTextColor="#7E8BA0"
                value={profile.bio}
                onChangeText={(v) => setProfile(p => ({ ...p, bio: v }))}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Home Port</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' ? "e.g., Lake George, NY" : "e.g., Point Judith, RI"}
                placeholderTextColor="#7E8BA0"
                value={profile.home_port}
                onChangeText={(v) => setProfile(p => ({ ...p, home_port: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>Age</Text>
              <TextInput
                placeholder="Your age"
                placeholderTextColor="#7E8BA0"
                value={profile.age}
                onChangeText={(v) => setProfile(p => ({ ...p, age: v }))}
                style={styles.input}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Location</Text>
              <TextInput
                placeholder="City, State"
                placeholderTextColor="#7E8BA0"
                value={profile.location}
                onChangeText={(v) => setProfile(p => ({ ...p, location: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>Experience Level</Text>
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

              <Text style={styles.label}>Favorite Species</Text>
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

              <Text style={styles.label}>Tackle Categories</Text>
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

              <Text style={styles.label}>Has Boat</Text>
              <Pressable 
                onPress={() => setProfile(p => ({ ...p, has_boat: !p.has_boat }))}
                style={[styles.chip, profile.has_boat ? styles.chipActive : styles.chipIdle]}
              >
                <Text style={profile.has_boat ? styles.chipTextActive : styles.chipTextIdle}>
                  {profile.has_boat ? 'Yes, I have a boat 🚤' : 'No boat'}
                </Text>
              </Pressable>

              {profile.has_boat && (
                <>
                  <Text style={styles.label}>Boat Name</Text>
                  <TextInput
                    placeholder="e.g., Sea Hunter, Miss Sarah"
                    placeholderTextColor="#7E8BA0"
                    value={profile.boat_name}
                    onChangeText={(v) => setProfile(p => ({ ...p, boat_name: v }))}
                    style={styles.input}
                  />

                  <Text style={styles.label}>Boat Type</Text>
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

                  <Text style={styles.label}>Boat Length</Text>
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

              <Text style={styles.label}>Preferred Fishing Times</Text>
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

              <Text style={styles.label}>Rod</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' ? "e.g., 7' Medium St. Croix" : "e.g., 7' Heavy Penn"}
                placeholderTextColor="#7E8BA0"
                value={profile.rod}
                onChangeText={(v) => setProfile(p => ({ ...p, rod: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>Reel</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' ? "e.g., Shimano 2500" : "e.g., Penn Spinfisher VI 4500"}
                placeholderTextColor="#7E8BA0"
                value={profile.reel}
                onChangeText={(v) => setProfile(p => ({ ...p, reel: v }))}
                style={styles.input}
              />

              <Text style={styles.label}>Line</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' ? "e.g., 12lb fluorocarbon" : "e.g., 30lb braid"}
                placeholderTextColor="#7E8BA0"
                value={profile.line}
                onChangeText={(v) => setProfile(p => ({ ...p, line: v }))}
                style={styles.input}
              />

              <Text style={styles.sectionHeader}>🎣 Detailed Tackle</Text>
              
              <Text style={styles.label}>Lures & Soft Plastics</Text>
              <TextInput
                placeholder={fishingType === 'freshwater' 
                  ? "e.g., Senkos, Spinnerbaits, Crankbaits" 
                  : "e.g., Spooks, Bucktails, Gulp, Swimmers"}
                placeholderTextColor="#7E8BA0"
                value={profile.tackle_details.lures}
                onChangeText={(v) => setProfile(p => ({ 
                  ...p, 
                  tackle_details: { ...p.tackle_details, lures: v }
                }))}
                style={styles.input}
              />

              <Text style={styles.label}>Bait</Text>
              <TextInput
                placeholder={fishingType === 'freshwater'
                  ? "e.g., Nightcrawlers, Minnows, Leeches"
                  : "e.g., Live eels, Bunker, Squid, Clams"}
                placeholderTextColor="#7E8BA0"
                value={profile.tackle_details.bait}
                onChangeText={(v) => setProfile(p => ({ 
                  ...p, 
                  tackle_details: { ...p.tackle_details, bait: v }
                }))}
                style={styles.input}
              />

              <Text style={styles.label}>Hooks</Text>
              <TextInput
                placeholder={fishingType === 'freshwater'
                  ? "e.g., Offset worm hooks, Trebles"
                  : "e.g., Circle hooks 8/0, J-hooks 2/0"}
                placeholderTextColor="#7E8BA0"
                value={profile.tackle_details.hooks}
                onChangeText={(v) => setProfile(p => ({ 
                  ...p, 
                  tackle_details: { ...p.tackle_details, hooks: v }
                }))}
                style={styles.input}
              />

              <Text style={styles.label}>Weights & Sinkers</Text>
              <TextInput
                placeholder={fishingType === 'freshwater'
                  ? "e.g., Bullet weights, Split shot"
                  : "e.g., Bank sinkers, Egg sinkers, Jig heads"}
                placeholderTextColor="#7E8BA0"
                value={profile.tackle_details.weights}
                onChangeText={(v) => setProfile(p => ({ 
                  ...p, 
                  tackle_details: { ...p.tackle_details, weights: v }
                }))}
                style={styles.input}
              />

              <Text style={styles.label}>Other Gear</Text>
              <TextInput
                placeholder="e.g., Net, Pliers, Tackle box, Cooler"
                placeholderTextColor="#7E8BA0"
                value={profile.tackle_details.other_gear}
                onChangeText={(v) => setProfile(p => ({ 
                  ...p, 
                  tackle_details: { ...p.tackle_details, other_gear: v }
                }))}
                style={styles.input}
              />
            </ScrollView>

            <View style={styles.settingsFooter}>
              <Pressable 
                onPress={saveProfile} 
               style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
               disabled={saving}
             >
               <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
             </Pressable>
           </View>
         </View>
       </View>
     </Modal>
   </View>
 );
}

const styles = StyleSheet.create({
 container: { flex: 1, backgroundColor: '#0B1220' },
 centered: { justifyContent: 'center', alignItems: 'center', padding: 20 },
 profileContent: { padding: 20, gap: 20 },
 headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
 headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
 sectionTitle: { color: '#E8ECF1', fontSize: 18, fontWeight: '700', marginBottom: 8 },
 profileSection: { gap: 8 },
 profileLabel: { fontSize: 14, color: '#AFC3E1', fontWeight: '600' },
 profileValue: { fontSize: 16, color: '#E8ECF1' },
 tackleList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
 tackleChip: { backgroundColor: '#72E5A2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
 tackleChipText: { fontSize: 12, color: '#0B1220', fontWeight: '700' },
 
 fishingTypeBadge: { 
   backgroundColor: '#1A2440', 
   paddingHorizontal: 12, 
   paddingVertical: 6, 
   borderRadius: 12,
   borderWidth: 1,
   borderColor: '#2A3A63'
 },
 fishingTypeText: { color: '#72E5A2', fontSize: 12, fontWeight: '600' },
 
 loadingText: { color: '#E8ECF1', fontSize: 16 },
 signInText: { color: '#9BB0CC', fontSize: 16, textAlign: 'center', marginBottom: 20, lineHeight: 22 },
 signInButton: { backgroundColor: '#72E5A2', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
 signInButtonText: { color: '#0B1220', fontWeight: '700', fontSize: 16 },
 signOutButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
 signOutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
 errorText: { color: '#FF8A8A', fontSize: 14, textAlign: 'center', marginBottom: 16, paddingHorizontal: 20 },
 
 editButton: {
   backgroundColor: '#1A2440',
   borderRadius: 12,
   paddingHorizontal: 16,
   paddingVertical: 12,
   marginTop: 20,
   alignSelf: 'center',
   borderWidth: 1,
   borderColor: '#2A3A63',
 },
 editButtonText: { color: '#E9F2FF', fontWeight: '700' },
 
 // Settings modal styles
 settingsBackdrop: { flex: 1, backgroundColor: 'rgba(6,10,18,0.7)', justifyContent: 'center', padding: 16 },
 settingsCard: { backgroundColor: '#0F1627', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#22304D', maxHeight: '86%' },
 settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E2A44' },
 settingsTitle: { color: '#E8ECF1', fontSize: 16, fontWeight: '700' },
 xBtn: { padding: 8, borderRadius: 8, backgroundColor: '#121A2B', borderWidth: 1, borderColor: '#24324D' },
 xBtnText: { color: '#BFD2EE', fontSize: 13 },
 settingsContent: { padding: 16, gap: 10 },
 label: { color: '#AFC3E1', fontSize: 12, marginTop: 6 },
 input: { backgroundColor: '#121A2B', color: '#E6F0FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#233355' },
 textArea: { height: 80, textAlignVertical: 'top' },
 chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
 chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
 chipIdle: { backgroundColor: '#0F1627', borderColor: '#263654' },
 chipActive: { backgroundColor: '#72E5A2', borderColor: '#72E5A2' },
 chipTextIdle: { color: '#B7C7E0', fontWeight: '600', fontSize: 12 },
 chipTextActive: { color: '#0B1220', fontWeight: '800', fontSize: 12 },
 settingsFooter: { padding: 12, borderTopWidth: 1, borderTopColor: '#1E2A44' },
 saveBtn: { alignSelf: 'flex-end', backgroundColor: '#1A2440', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#2A3A63' },
 saveBtnDisabled: { opacity: 0.5 },
 saveBtnText: { color: '#E9F2FF', fontWeight: '700' },
 sectionHeader: { color: '#72E5A2', fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
});
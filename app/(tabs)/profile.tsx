import { useFishing } from '@/contexts/FishingContext';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Modal,
  Platform,
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
import { supabase } from '../../lib/supabase';

interface SimpleProfile {
  display_name: string;
  bio: string;
  home_port: string;
  age: string;
  location: string;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  has_boat: boolean;
  boat_type: string;
  boat_length: string;
  profile_photo_url: string;
  fishing_type: 'freshwater' | 'saltwater' | null;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { fishingType } = useFishing();
  const router = useRouter();
  
  const [profile, setProfile] = useState<SimpleProfile>({
    display_name: '',
    bio: '',
    home_port: '',
    age: '',
    location: '',
    experience_level: null,
    has_boat: false,
    boat_type: '',
    boat_length: '',
    profile_photo_url: '',
    fishing_type: fishingType
  });
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (fishingType && profile.fishing_type !== fishingType) {
      setProfile(prev => ({ ...prev, fishing_type: fishingType }));
    }
  }, [fishingType]);

  async function initializeAuth() {
    try {
      setLoading(true);
      setAuthError(null);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setAuthError(error.message);
        setIsSignedIn(false);
        setLoading(false);
        return;
      }

      if (session && session.user) {
        setIsSignedIn(true);
        await loadProfile(session.user.id);
      } else {
        setIsSignedIn(false);
      }
    } catch (error) {
      setAuthError('Failed to initialize authentication');
      setIsSignedIn(false);
    } finally {
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsSignedIn(true);
          setAuthError(null);
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setIsSignedIn(false);
          setAuthError(null);
          resetProfile();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (isSignedIn) {
            await loadProfile(session.user.id);
          }
        }
      } catch (error) {
        setAuthError('Authentication error occurred');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

async function loadProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return;
    }

    if (data) {
      // Add cache-busting for profile photo
      const photoUrl = data.profile_photo_url 
        ? `${data.profile_photo_url}?t=${Date.now()}` 
        : '';
      
      setProfile({
        display_name: data.display_name || '',
        bio: data.bio || '',
        home_port: data.home_port || '',
        age: data.age?.toString() || '',
        location: data.location || '',
        experience_level: data.experience_level,
        has_boat: data.has_boat || false,
        boat_type: data.boat_type || '',
        boat_length: data.boat_length || '',
        profile_photo_url: photoUrl,
        fishing_type: data.fishing_type || fishingType
      });
    }
  } catch (error) {
    console.error('Load profile error:', error);
  }
}

  function resetProfile() {
    setProfile({
      display_name: '',
      bio: '',
      home_port: '',
      age: '',
      location: '',
      experience_level: null,
      has_boat: false,
      boat_type: '',
      boat_length: '',
      profile_photo_url: '',
      fishing_type: fishingType
    });
  }

  async function pickImage() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await takePhoto();
          else if (buttonIndex === 2) await chooseFromLibrary();
        }
      );
    } else {
      Alert.alert('Profile Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: chooseFromLibrary },
      ]);
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) await uploadPhoto(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo.');
    }
  }

  async function chooseFromLibrary() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) await uploadPhoto(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to choose photo.');
    }
  }

  async function uploadPhoto(uri: string) {
  try {
    setUploadingPhoto(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      Alert.alert('Error', 'You must be signed in to upload a photo');
      return;
    }

    const userId = session.user.id;
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/profile.${fileExt}`;
    
    console.log('📸 Upload path:', filePath);
    
    // Fetch as arraybuffer instead of blob
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    
    console.log('📦 ArrayBuffer size:', arrayBuffer.byteLength);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, arrayBuffer, { 
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true 
      });

    if (uploadError) {
      console.log('❌ Upload error:', uploadError);
      throw uploadError;
    }
    
    console.log('✅ Upload success:', uploadData);

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', publicUrl);

    const photoUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

    setProfile(prev => ({ ...prev, profile_photo_url: photoUrlWithTimestamp }));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        profile_photo_url: publicUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (updateError) {
      console.log('❌ Profile update error:', updateError);
      Alert.alert('Warning', 'Photo uploaded but profile update failed: ' + updateError.message);
    } else {
      console.log('✅ Profile updated with photo URL');
    }

  } catch (error: any) {
    console.log('❌ Upload failed:', error);
    Alert.alert('Upload Failed', error.message);
  } finally {
    setUploadingPhoto(false);
  }
}

  async function removePhoto() {
    Alert.alert('Remove Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const userId = session.user.id;

            const { error: deleteError } = await supabase.storage
              .from('profile-photos')
              .remove([`${userId}/profile.jpg`, `${userId}/profile.png`, `${userId}/profile.webp`]);

            if (deleteError) {
              console.warn('Could not delete from storage:', deleteError);
            }

            await supabase
              .from('profiles')
              .update({ profile_photo_url: null, updated_at: new Date().toISOString() })
              .eq('id', session.user.id);

            setProfile(prev => ({ ...prev, profile_photo_url: '' }));
          } catch (error) {
            console.error('Error removing photo:', error);
          }
        }
      },
    ]);
  }

  async function saveProfile() {
    try {
      setSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'No active session');
        return;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        display_name: profile.display_name,
        bio: profile.bio,
        home_port: profile.home_port,
        age: profile.age || null,
        location: profile.location,
        experience_level: profile.experience_level,
        has_boat: profile.has_boat,
        boat_type: profile.boat_type,
        boat_length: profile.boat_length,
        profile_photo_url: profile.profile_photo_url?.split('?')[0] || null,
        fishing_type: fishingType,
        updated_at: new Date().toISOString()
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      
      setSettingsOpen(false);
      Alert.alert('Success', 'Profile saved!');
    } catch (error: any) {
      Alert.alert('Error', 'Save failed: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function signInWithApple() {
    try {
      setLoading(true);
      const redirectTo = Linking.createURL('/');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo, scopes: 'name email' },
      });
      if (error) Alert.alert('Error', error.message);
    } catch (error) {
      Alert.alert('Error', 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function signInAnonymously() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) Alert.alert('Error', error.message);
    } catch (error) {
      Alert.alert('Error', 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    router.replace('/');
  } catch (error) {
    Alert.alert('Error', 'Sign out failed');
  }
}

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + 20 }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>CC</Text>
        </View>
        <Text style={styles.sectionTitle}>CATCH CONNECT</Text>
        <Text style={styles.signInText}>
          Create your {fishingType} fishing profile and connect with other anglers instantly!
        </Text>
        
        {authError && <Text style={styles.errorText}>Error: {authError}</Text>}
        
        {Platform.OS === 'ios' && (
          <Pressable style={[styles.signInButton, { marginBottom: 12 }]} onPress={signInWithApple}>
            <Text style={styles.signInButtonText}>CONTINUE WITH APPLE</Text>
          </Pressable>
        )}

        <Pressable style={styles.signInButton} onPress={signInAnonymously}>
          <Text style={styles.signInButtonText}>GET STARTED</Text>
        </Pressable>
      </View>
    );
  }

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

        <View style={styles.photoSection}>
          <Pressable onPress={pickImage} disabled={uploadingPhoto}>
{profile.profile_photo_url ? (
  <Image 
    source={{ uri: profile.profile_photo_url }} 
    style={styles.profilePhoto}
    onError={(e) => console.log('🖼️ Image load error:', e.nativeEvent.error)}
    onLoad={() => console.log('🖼️ Image loaded successfully')}
  />
) : (
  <View style={styles.profilePhotoPlaceholder}>
    <Text style={styles.photoPlaceholderText}>
      {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '+'}
    </Text>
  </View>
)}
          </Pressable>
          <View style={styles.photoButtons}>
            <Pressable style={styles.changePhotoButton} onPress={pickImage} disabled={uploadingPhoto}>
              <Text style={styles.changePhotoText}>{uploadingPhoto ? 'UPLOADING...' : 'CHANGE PHOTO'}</Text>
            </Pressable>
            {profile.profile_photo_url ? (
              <Pressable style={styles.removePhotoButton} onPress={removePhoto}>
                <Text style={styles.removePhotoText}>REMOVE</Text>
              </Pressable>
            ) : null}
          </View>
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
          <View style={styles.profileSection}>
            <Text style={styles.profileLabel}>BOAT DETAILS</Text>
            <Text style={styles.profileValue}>
              {profile.boat_type || 'Type not set'} • {profile.boat_length || 'Length not set'}
            </Text>
          </View>
        )}

        <Pressable style={styles.editButton} onPress={() => setSettingsOpen(true)}>
          <Text style={styles.editButtonText}>EDIT PROFILE</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>EDIT PROFILE</Text>
              <CloseButton onPress={() => setSettingsOpen(false)} iconName="chevron-down" />
            </View>
            
            <ScrollView contentContainerStyle={styles.settingsContent}>
              <Text style={styles.label}>PROFILE PHOTO</Text>
              <View style={styles.modalPhotoSection}>
                <Pressable onPress={pickImage} disabled={uploadingPhoto}>
                  {profile.profile_photo_url ? (
                    <Image source={{ uri: profile.profile_photo_url }} style={styles.modalProfilePhoto} />
                  ) : (
                    <View style={styles.modalProfilePhotoPlaceholder}>
                      <Text style={styles.modalPhotoPlaceholderText}>+</Text>
                    </View>
                  )}
                </Pressable>
                <Pressable style={styles.modalChangePhotoButton} onPress={pickImage} disabled={uploadingPhoto}>
                  <Text style={styles.modalChangePhotoText}>
                    {uploadingPhoto ? 'UPLOADING...' : profile.profile_photo_url ? 'CHANGE' : 'ADD PHOTO'}
                  </Text>
                </Pressable>
              </View>

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

              <Text style={styles.label}>HAS BOAT</Text>
              <Pressable 
                onPress={() => setProfile(p => ({ ...p, has_boat: !p.has_boat }))}
                style={[styles.chip, profile.has_boat ? styles.chipActive : styles.chipIdle]}
              >
                <Text style={profile.has_boat ? styles.chipTextActive : styles.chipTextIdle}>
                  {profile.has_boat ? 'Yes, I have a boat' : 'No boat'}
                </Text>
              </Pressable>

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

              <View style={styles.settingsFooter}>
                <Pressable 
                  onPress={saveProfile} 
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE PROFILE'}</Text>
                </Pressable>
              </View>
            </ScrollView>
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

  photoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: FishingTheme.colors.darkGreen,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: FishingTheme.colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: FishingTheme.colors.darkGreen,
  },
  photoPlaceholderText: {
    fontSize: 48,
    fontWeight: '800',
    color: FishingTheme.colors.cream,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  changePhotoButton: {
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  changePhotoText: {
    color: FishingTheme.colors.cream,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  removePhotoButton: {
    backgroundColor: FishingTheme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.status.poor,
  },
  removePhotoText: {
    color: FishingTheme.colors.status.poor,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  modalPhotoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  modalProfilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: FishingTheme.colors.darkGreen,
  },
  modalProfilePhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: FishingTheme.colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FishingTheme.colors.darkGreen,
  },
  modalPhotoPlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: FishingTheme.colors.cream,
  },
  modalChangePhotoButton: {
    backgroundColor: FishingTheme.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.darkGreen,
  },
  modalChangePhotoText: {
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
});
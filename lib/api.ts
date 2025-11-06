import { supabase } from './supabase.js';

// =====================================================
// TYPE DEFINITIONS - STREAMLINED (NO UNUSED FIELDS)
// =====================================================

export interface MatchFilters {
  maxDistance?: number;
  fishingType?: 'freshwater' | 'saltwater';
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  tackleCategories?: string[];
  hasBoat?: boolean;
  ageRange?: {
    min: number;
    max: number;
  };
}

export interface UserProfile {
  id: string;
  display_name: string;
  bio?: string;
  profile_photo_url?: string;
  
  // Fishing preferences  
  fishing_style?: 'Spinning' | 'Fly' | 'Jigging' | 'Baitcasting' | 'Trolling' | 'Ice';
  fishing_type?: 'freshwater' | 'saltwater';
  
  // Personal info
  age?: number;
  location?: string;
  home_port?: string;
  experience_level?: 'Beginner' | 'Intermediate' | 'Advanced';
  favorite_species?: string[];
  tackle_categories?: string[];
  preferred_fishing_times?: string[];
  
  // Boat info
  has_boat?: boolean;
  boat_type?: string;
  boat_length?: string;
  boat_name?: string;
  
  // Meta
  discoverable: boolean;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'location';
  image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface FishingReport {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  species_caught: string[];
  water_temp?: number;
  air_temp?: number;
  weather_conditions?: string;
  tackle_used?: string;
  bait_used?: string;
  catch_count: number;
  trip_duration_hours?: number;
  notes?: string;
  photo_urls: string[];
  fishing_type?: 'freshwater' | 'saltwater';
  created_at: string;
  allow_research_use: boolean;
}

export interface PrivacySettings {
  id: string;
  allow_photos_from: 'everyone' | 'matches' | 'none';
  allow_location_from: 'everyone' | 'matches' | 'none';
  discoverable: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// API FUNCTIONS
// =====================================================

/**
 * Get potential fishing buddies based on filters
 */
export async function getPotentialMatches(userId: string, filters?: MatchFilters): Promise<UserProfile[]> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .eq('discoverable', true);

    // Filter by fishing_type (freshwater/saltwater)
    if (filters?.fishingType) {
      query = query.eq('fishing_type', filters.fishingType);
    }

    // Filter by experience level
    if (filters?.experienceLevel) {
      query = query.eq('experience_level', filters.experienceLevel);
    }

    // Filter by boat ownership
    if (filters?.hasBoat !== undefined) {
      query = query.eq('has_boat', filters.hasBoat);
    }

    // Filter by tackle categories (array overlap)
    if (filters?.tackleCategories && filters.tackleCategories.length > 0) {
      query = query.overlaps('tackle_categories', filters.tackleCategories);
    }

    // Filter by age range
    if (filters?.ageRange) {
      query = query
        .gte('age', filters.ageRange.min)
        .lte('age', filters.ageRange.max);
    }

    const { data, error } = await query
      .order('last_active', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching potential matches:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getPotentialMatches error:', error);
    throw error;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getUserProfile error:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}

/**
 * Start a conversation between two users
 */
export async function startConversation(currentUserId: string, otherUserId: string): Promise<Conversation> {
  try {
    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(participant_one.eq.${currentUserId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${currentUserId})`)
      .single();

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_one: currentUserId,
        participant_two: otherUserId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('startConversation error:', error);
    throw error;
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string, 
  senderId: string, 
  content: string, 
  messageType: 'text' | 'image' | 'location' = 'text',
  imageUrl?: string,
  latitude?: number,
  longitude?: number
): Promise<Message> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        image_url: imageUrl,
        latitude,
        longitude
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (error) {
    console.error('sendMessage error:', error);
    throw error;
  }
}

/**
 * Get user's conversations
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getUserConversations error:', error);
    throw error;
  }
}

/**
 * Get messages in a conversation
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getConversationMessages error:', error);
    throw error;
  }
}

/**
 * Create a fishing report
 */
export async function createFishingReport(reportData: Omit<FishingReport, 'id' | 'created_at'>): Promise<FishingReport> {
  try {
    const { data, error } = await supabase
      .from('fishing_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('Error creating fishing report:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('createFishingReport error:', error);
    throw error;
  }
}

/**
 * Get nearby fishing reports
 */
export async function getNearbyFishingReports(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 50,
  fishingType?: 'freshwater' | 'saltwater'
): Promise<FishingReport[]> {
  try {
    let query = supabase
      .from('fishing_reports')
      .select('*');

    if (fishingType) {
      query = query.eq('fishing_type', fishingType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching fishing reports:', error);
      throw error;
    }

    // Simple distance filtering
    const filtered = data?.filter(report => {
      const distance = calculateDistance(latitude, longitude, report.latitude, report.longitude);
      return distance <= radiusKm;
    });

    return filtered || [];
  } catch (error) {
    console.error('getNearbyFishingReports error:', error);
    throw error;
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
  try {
    const { data, error } = await supabase
      .from('privacy_settings')
      .update(settings)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updatePrivacySettings error:', error);
    throw error;
  }
}

/**
 * Get user's privacy settings
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
  try {
    const { data, error } = await supabase
      .from('privacy_settings')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('getPrivacySettings error:', error);
    throw error;
  }
}

/**
 * Update user's last active timestamp
 */
export async function updateLastActive(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last active:', error);
      throw error;
    }
  } catch (error) {
    console.error('updateLastActive error:', error);
    throw error;
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
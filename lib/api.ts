import { supabase } from './supabase';

// 1. Define the UserProfile type to match your profile schema
export interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  home_port: string | null;
  age: string | null;
  location: string | null;
  experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  has_boat: boolean;
  boat_type: string | null;
  boat_length: string | null;
  profile_photo_url: string | null;
  fishing_type: 'freshwater' | 'saltwater' | null;
  tackle_categories: string[] | null;
}

// 2. Define filter options for getPotentialMatches
interface MatchFilters {
  fishingType?: 'freshwater' | 'saltwater';
  maxDistance?: number;
  hasBoat?: boolean;
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
}

// 3. Fetch buddies based on filters
export async function getPotentialMatches(
  currentUserId: string, 
  filters?: MatchFilters
): Promise<UserProfile[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId);

  if (filters?.fishingType) {
    query = query.eq('fishing_type', filters.fishingType);
  }

  if (filters?.hasBoat) {
    query = query.eq('has_boat', true);
  }

  if (filters?.experienceLevel) {
    query = query.eq('experience_level', filters.experienceLevel);
  }

  // Note: maxDistance filtering requires coordinates + PostGIS or an RPC
  // For now it's accepted but not applied until you add location data

  const { data, error } = await query.limit(20);

  if (error) {
    console.error('Error fetching buddies:', error);
    return [];
  }

  return data as UserProfile[];
}

// 4. Start a conversation (for the Message button)
export async function startConversation(user1Id: string, user2Id: string) {
  // Check if a conversation already exists between these two
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`user1_id.eq.${user1Id},user2_id.eq.${user1Id}`)
    .or(`user1_id.eq.${user2Id},user2_id.eq.${user2Id}`)
    .single();

  if (existing) return existing;

  // Otherwise, create a new one
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { user1_id: user1Id, user2_id: user2Id }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
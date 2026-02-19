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
  // First, get the list of users this person has blocked or been blocked by
  const blockedIds = await getBlockedAndBlockerIds(currentUserId);

  let query = supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId);

  // Exclude blocked users from results
  if (blockedIds.length > 0) {
    query = query.not('id', 'in', `(${blockedIds.join(',')})`);
  }

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
  // Check if a conversation already exists between these two (in either direction)
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_one.eq.${user1Id},participant_two.eq.${user2Id}),and(participant_one.eq.${user2Id},participant_two.eq.${user1Id})`
    )
    .single();

  if (existing) return existing;

  // Otherwise, create a new one
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { participant_one: user1Id, participant_two: user2Id, last_message_at: new Date().toISOString() }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 5. Block a user
export async function blockUser(blockerId: string, blockedId: string) {
  const { data, error } = await supabase
    .from('blocks')
    .insert([{ blocker_id: blockerId, blocked_id: blockedId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Unblock a user
export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.rpc('unblock_user', { target_id: blockedId });
  if (error) throw error;
}

// 7. Get all users blocked by the current user (for the blocked users modal)
export interface BlockedUserInfo {
  blocked_id: string;
  display_name: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

export async function getBlockedUsers(blockerId: string): Promise<BlockedUserInfo[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select(`
      blocked_id,
      created_at,
      profile:profiles!blocked_id(display_name, profile_photo_url)
    `)
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }

  return (data as any[]).map(row => ({
    blocked_id: row.blocked_id,
    display_name: row.profile?.display_name || 'Unknown',
    profile_photo_url: row.profile?.profile_photo_url || null,
    created_at: row.created_at,
  }));
}

// 8. Helper: Get all user IDs that the current user has blocked OR has been blocked by
//    Used to filter feeds and messages
export async function getBlockedAndBlockerIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  if (error) {
    console.error('Error fetching block list:', error);
    return [];
  }

  const ids = (data || []).map(row =>
    row.blocker_id === userId ? row.blocked_id : row.blocker_id
  );

  return [...new Set(ids)];
}
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { supabase } from '../../lib/supabase';

interface ConversationPreview {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_photo?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  fishing_type?: 'freshwater' | 'saltwater';
}

// Mock conversations for demo
const mockConversations: ConversationPreview[] = [
  {
    id: 'conv1',
    other_user_id: 'sw1',
    other_user_name: 'Captain Mike',
    other_user_photo: 'https://images.unsplash.com/photo-1529230117010-b6c436154f25?w=400&h=500&fit=crop',
    last_message: "Hey! I'm heading out to Point Judith tomorrow morning, want to join?",
    last_message_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    unread_count: 2,
    fishing_type: 'saltwater'
  },
  {
    id: 'conv2',
    other_user_id: 'sw2',
    other_user_name: 'Sarah T',
    other_user_photo: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=500&fit=crop',
    last_message: 'The stripers were running hard this morning at Castle Hill!',
    last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread_count: 0,
    fishing_type: 'saltwater'
  },
  {
    id: 'conv3',
    other_user_id: 'fw1',
    other_user_name: 'Big Bass Bill',
    other_user_photo: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop',
    last_message: 'Sounds good! I have the topwater lures ready to go.',
    last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread_count: 0,
    fishing_type: 'freshwater'
  },
  {
    id: 'conv4',
    other_user_id: 'sw5',
    other_user_name: 'Captain Amanda',
    other_user_photo: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=500&fit=crop',
    last_message: "False albacore are in! Let's chase them this weekend.",
    last_message_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unread_count: 1,
    fishing_type: 'saltwater'
  }
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeMessages();
  }, []);

  async function initializeMessages() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        // In production, load real conversations from Supabase
        // await loadConversations(session.user.id);
      }
      // For demo, use mock data
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error initializing messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_one,
          participant_two,
          last_message_at,
          messages (
            content,
            created_at,
            sender_id
          )
        `)
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Transform data to ConversationPreview format
      // This would need to join with profiles table for user details
      console.log('Loaded conversations:', data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function openConversation(conversation: ConversationPreview) {
    router.push({
      pathname: '/conversation/conversation_id',
      params: { 
        id: conversation.id,
        name: conversation.other_user_name,
        photo: conversation.other_user_photo || '',
        otherUserId: conversation.other_user_id
      }
    });
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={FishingTheme.colors.darkGreen} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>MESSAGES</Text>
            <Text style={styles.headerSubtitle}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {conversations.some(c => c.unread_count > 0) && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {conversations.reduce((acc, c) => acc + c.unread_count, 0)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={FishingTheme.colors.text.muted} />
          </View>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start connecting with fishing buddies in the Feeds tab!
          </Text>
          <Pressable 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/feeds')}
          >
            <Text style={styles.emptyButtonText}>FIND BUDDIES</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable 
              style={({ pressed }) => [
                styles.conversationItem,
                pressed && styles.conversationItemPressed
              ]}
              onPress={() => openConversation(item)}
            >
              {/* Profile Photo */}
              <View style={styles.avatarContainer}>
                {item.other_user_photo ? (
                  <Image 
                    source={{ uri: item.other_user_photo }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {item.other_user_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                {/* Online indicator would go here */}
                <View style={[
                  styles.fishingTypeDot,
                  { backgroundColor: item.fishing_type === 'saltwater' 
                    ? FishingTheme.colors.darkGreen 
                    : FishingTheme.colors.sageGreen 
                  }
                ]} />
              </View>

              {/* Message Preview */}
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.other_user_name}
                  </Text>
                  <Text style={styles.messageTime}>
                    {formatTime(item.last_message_time)}
                  </Text>
                </View>
                <View style={styles.messagePreviewRow}>
                  <Text 
                    style={[
                      styles.messagePreview,
                      item.unread_count > 0 && styles.messagePreviewUnread
                    ]} 
                    numberOfLines={2}
                  >
                    {item.last_message}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Chevron */}
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={FishingTheme.colors.text.muted} 
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
    backgroundColor: FishingTheme.colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: FishingTheme.colors.text.tertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unreadBadge: {
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  unreadBadgeText: {
    color: FishingTheme.colors.cream,
    fontSize: 12,
    fontWeight: '800',
  },

  // Conversation Item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: FishingTheme.colors.background,
  },
  conversationItemPressed: {
    backgroundColor: FishingTheme.colors.card,
  },
  separator: {
    height: 1,
    backgroundColor: FishingTheme.colors.border,
    marginLeft: 88,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FishingTheme.colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: FishingTheme.colors.cream,
  },
  fishingTypeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: FishingTheme.colors.background,
  },

  // Message Content
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: FishingTheme.colors.darkGreen,
    flex: 1,
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: FishingTheme.colors.text.muted,
    fontWeight: '500',
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messagePreview: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  messagePreviewUnread: {
    color: FishingTheme.colors.text.primary,
    fontWeight: '600',
  },
  unreadCountBadge: {
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: FishingTheme.colors.cream,
    fontSize: 11,
    fontWeight: '800',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: FishingTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    color: FishingTheme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
  },
  emptyButtonText: {
    color: FishingTheme.colors.cream,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { useNotifications } from '../../contexts/NotificationContext';
import { blockUser, getBlockedAndBlockerIds } from '../../lib/api';
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

interface SupabaseConversationResponse {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  participant_one_profile: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    fishing_type: 'freshwater' | 'saltwater' | null;
  } | null;
  participant_two_profile: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    fishing_type: 'freshwater' | 'saltwater' | null;
  } | null;
}

interface UnreadMessage {
  conversation_id: string;
}

interface LastMessage {
  conversation_id: string;
  content: string;
  created_at: string;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setUnreadCount } = useNotifications();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  // On mount, get session once
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        loadConversations(session.user.id);
      }
      setLoading(false);
    });

    // Realtime subscription — fires when any message is inserted or updated
    // Re-runs loadConversations which recomputes both badge counts
    const channel = supabase
      .channel('messages-refresh')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          if (currentUserIdRef.current) {
            loadConversations(currentUserIdRef.current);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Every time this screen gains focus (including returning from a conversation),
  // reload so badge counts reflect any reads that happened in the conversation screen
  useFocusEffect(
    useCallback(() => {
      if (currentUserIdRef.current) {
        loadConversations(currentUserIdRef.current);
      }
    }, [])
  );

  async function loadConversations(userId: string) {
    try {
      let blockedIds: string[] = [];
      try {
        blockedIds = await getBlockedAndBlockerIds(userId);
      } catch (e) {
        console.error('Block list fetch failed:', e);
      }

      // 1. Conversation metadata + profiles
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_one,
          participant_two,
          last_message_at,
          participant_one_profile:profiles!participant_one(id, display_name, profile_photo_url, fishing_type),
          participant_two_profile:profiles!participant_two(id, display_name, profile_photo_url, fishing_type)
        `)
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      const typedConvData = (convData as unknown) as SupabaseConversationResponse[];
      const convIds = typedConvData.map(c => c.id);

      if (convIds.length === 0) {
        setConversations([]);
        setUnreadCount(0);
        return;
      }

      // 2. All unread messages from other users across these conversations
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .is('read_at', null);

      // 3. Most recent message per conversation for preview text
      const { data: lastMsgData } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false });

      // per-row: message count per conversation
      const unreadCountMap = new Map<string, number>();
      (unreadData as UnreadMessage[] || []).forEach(msg => {
        unreadCountMap.set(
          msg.conversation_id,
          (unreadCountMap.get(msg.conversation_id) || 0) + 1
        );
      });

      // last message lookup
      const lastMessageMap = new Map<string, LastMessage>();
      (lastMsgData as LastMessage[] || []).forEach(msg => {
        if (!lastMessageMap.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg);
        }
      });

      const transformed: ConversationPreview[] = typedConvData
        .map(conv => {
          const isPartOne = conv.participant_one === userId;
          const otherProfile = isPartOne
            ? conv.participant_two_profile
            : conv.participant_one_profile;
          const otherUserId = otherProfile?.id || '';
          const lastMsg = lastMessageMap.get(conv.id);

          return {
            id: conv.id,
            other_user_id: otherUserId,
            other_user_name: otherProfile?.display_name || 'Fisherman',
            other_user_photo: otherProfile?.profile_photo_url || undefined,
            last_message: lastMsg?.content || 'No messages yet',
            last_message_time: lastMsg?.created_at || conv.last_message_at,
            unread_count: unreadCountMap.get(conv.id) || 0,
            fishing_type: otherProfile?.fishing_type || undefined,
          };
        })
        .filter(conv => !blockedIds.includes(conv.other_user_id));

      setConversations(transformed);

      // Tab badge = number of conversations with any unread messages (1 per conversation)
      // This is what drives the Chats tab badge and the app icon badge
      const unreadConversationCount = transformed.filter(
        conv => conv.unread_count > 0
      ).length;
      setUnreadCount(unreadConversationCount);

    } catch (error) {
      console.error('Load Error:', error);
    }
  }

  async function handleBlockUser(otherUserId: string, otherUserName: string) {
    if (!currentUserIdRef.current) return;
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUserName}? They won't be able to message you or appear in your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(currentUserIdRef.current!, otherUserId);
              await loadConversations(currentUserIdRef.current!);
            } catch (error) {
              Alert.alert('Error', 'Could not block user. Please try again.');
            }
          }
        }
      ]
    );
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={FishingTheme.colors.darkGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>MESSAGES</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Find a fishing buddy and start chatting!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.conversationRow}>
            <Pressable
              style={styles.conversationItem}
              onPress={() => router.push({
                pathname: '/conversation/[id]',
                params: { id: item.id, name: item.other_user_name, photo: item.other_user_photo || '' }
              })}
            >
              <View style={styles.avatarContainer}>
                {item.other_user_photo ? (
                  <Image source={{ uri: item.other_user_photo }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{item.other_user_name[0]}</Text>
                  </View>
                )}
              </View>
              <View style={styles.messageContent}>
                <View style={styles.messageHeader}>
                  <Text style={styles.userName}>{item.other_user_name}</Text>
                  <Text style={styles.messageTime}>{formatTime(item.last_message_time)}</Text>
                </View>
                <View style={styles.messagePreviewRow}>
                  <Text
                    style={[styles.messagePreview, item.unread_count > 0 && styles.messagePreviewUnread]}
                    numberOfLines={1}
                  >
                    {item.last_message.startsWith('https://') ? '⛶ Photo' : item.last_message}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
            <Pressable
              style={styles.blockBtn}
              onPress={() => handleBlockUser(item.other_user_id, item.other_user_name)}
            >
              <Text style={styles.blockBtnText}>BLOCK</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FishingTheme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: FishingTheme.colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: FishingTheme.colors.darkGreen },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen },
  emptySubtext: { fontSize: 14, color: FishingTheme.colors.text.secondary, marginTop: 8 },
  conversationRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: FishingTheme.colors.border },
  conversationItem: { flexDirection: 'row', flex: 1, padding: 16 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: FishingTheme.colors.sageGreen, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: 'white', fontWeight: 'bold' },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  userName: { fontWeight: 'bold', color: FishingTheme.colors.darkGreen },
  messageTime: { fontSize: 12, color: FishingTheme.colors.text.muted },
  messagePreviewRow: { flexDirection: 'row', alignItems: 'center' },
  messagePreview: { flex: 1, color: FishingTheme.colors.text.secondary },
  messagePreviewUnread: { fontWeight: 'bold', color: 'black' },
  unreadCountBadge: { backgroundColor: FishingTheme.colors.darkGreen, borderRadius: 10, paddingHorizontal: 6, marginLeft: 4 },
  unreadCountText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  blockBtn: {
    marginRight: 16,
    backgroundColor: FishingTheme.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: FishingTheme.colors.status.poor,
  },
  blockBtnText: {
    color: FishingTheme.colors.status.poor,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
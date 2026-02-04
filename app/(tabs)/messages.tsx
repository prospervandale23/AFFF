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

// Interface to fix VS Code TypeScript errors
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
  messages: {
    content: string;
    created_at: string;
    sender_id: string;
    read_at: string | null;
  }[];
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeMessages();
    
    const channel = supabase
      .channel('messages-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (currentUserId) loadConversations(currentUserId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  async function initializeMessages() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadConversations(session.user.id);
      }
    } catch (error) {
      console.error('Error:', error);
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
          participant_one_profile:profiles!participant_one(id, display_name, profile_photo_url, fishing_type),
          participant_two_profile:profiles!participant_two(id, display_name, profile_photo_url, fishing_type),
          messages(content, created_at, sender_id, read_at)
        `)
        .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Cast the data to our interface to resolve VS Code issues
      const typedData = (data as unknown) as SupabaseConversationResponse[];

      const transformed: ConversationPreview[] = typedData.map(conv => {
        const isPartOne = conv.participant_one === userId;
        const otherProfile = isPartOne ? conv.participant_two_profile : conv.participant_one_profile;
        
        const lastMsg = conv.messages && conv.messages.length > 0 
          ? conv.messages[conv.messages.length - 1] 
          : { content: 'No messages yet', created_at: conv.last_message_at };
        
        const unreadCount = conv.messages.filter(m => 
          m.sender_id !== userId && !m.read_at
        ).length;

        return {
          id: conv.id,
          other_user_id: otherProfile?.id || '',
          other_user_name: otherProfile?.display_name || 'Fisherman',
          other_user_photo: otherProfile?.profile_photo_url || undefined,
          last_message: lastMsg.content,
          last_message_time: lastMsg.created_at,
          unread_count: unreadCount,
          fishing_type: otherProfile?.fishing_type || undefined
        };
      });

      setConversations(transformed);
    } catch (error) {
      console.error('Load Error:', error);
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
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
        renderItem={({ item }) => (
          <Pressable 
            style={styles.conversationItem}
            onPress={() => router.push({
              pathname: '//conversation/[id]',
              params: { id: item.id, name: item.other_user_name, photo: item.other_user_photo || '' }
            })}
          >
            <View style={styles.avatarContainer}>
              {item.other_user_photo ? (
                <Image source={{ uri: item.other_user_photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.other_user_name[0]}</Text></View>
              )}
            </View>
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.userName}>{item.other_user_name}</Text>
                <Text style={styles.messageTime}>{formatTime(item.last_message_time)}</Text>
              </View>
              <View style={styles.messagePreviewRow}>
                <Text style={[styles.messagePreview, item.unread_count > 0 && styles.messagePreviewUnread]} numberOfLines={1}>
                  {item.last_message}
                </Text>
                {item.unread_count > 0 && (
                  <View style={styles.unreadCountBadge}><Text style={styles.unreadCountText}>{item.unread_count}</Text></View>
                )}
              </View>
            </View>
          </Pressable>
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
  conversationItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: FishingTheme.colors.border },
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
  unreadCountText: { color: 'white', fontSize: 12, fontWeight: 'bold' }
});
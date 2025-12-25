import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'location';
  image_url?: string;
}

// Mock messages for demo
const generateMockMessages = (conversationId: string, otherUserName: string): Message[] => {
  const now = Date.now();
  const currentUserId = 'current-user';
  const otherUserId = 'other-user';

  const mockChats: Record<string, Message[]> = {
    'conv1': [
      {
        id: 'm1',
        content: `Hey ${otherUserName}! I saw your profile and would love to go saltwater fishing together. Know any good spots?`,
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm2',
        content: "Hey! Great to hear from you. I know some killer spots around Point Judith for stripers.",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 2.5).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm3',
        content: "That sounds perfect! What gear should I bring?",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm4',
        content: "Bring your heavy spinning setup. I've got extra bucktails and Gulp if you need them.",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 1.5).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm5',
        content: "Hey! I'm heading out to Point Judith tomorrow morning, want to join?",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 15).toISOString(),
        message_type: 'text'
      },
    ],
    'conv2': [
      {
        id: 'm1',
        content: "Hi Sarah! Your sustainable fishing approach really resonates with me.",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm2',
        content: "Thanks! It's so important to protect our fisheries. Are you free this weekend for some surf casting?",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm3',
        content: "Absolutely! Where do you usually go?",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm4',
        content: "The stripers were running hard this morning at Castle Hill!",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
        message_type: 'text'
      },
    ],
    'conv3': [
      {
        id: 'm1',
        content: "Hey Bill! Always wanted to fish Winnipesaukee. Any tips?",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm2',
        content: "Oh man, you're gonna love it! The smallmouth action is incredible right now.",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 47).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm3',
        content: "I'm planning a trip up there next month. Would you be up for showing me around?",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 46).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm4',
        content: "Absolutely! Early morning topwater bite has been fire. Bring your best walking baits.",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 45).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm5',
        content: "Sounds good! I have the topwater lures ready to go.",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        message_type: 'text'
      },
    ],
    'conv4': [
      {
        id: 'm1',
        content: "Captain Amanda! Love your light tackle approach. Would love to learn more.",
        sender_id: currentUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm2',
        content: "Thanks! There's nothing like catching albies on light tackle. Pure chaos!",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 70).toISOString(),
        message_type: 'text'
      },
      {
        id: 'm3',
        content: "False albacore are in! Let's chase them this weekend.",
        sender_id: otherUserId,
        created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        message_type: 'text'
      },
    ]
  };

  return mockChats[conversationId] || [];
};

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name, photo, otherUserId } = useLocalSearchParams<{
    id: string;
    name: string;
    photo: string;
    otherUserId: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('current-user');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    initializeUser();
  }, [id]);

  async function initializeUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }

  async function loadMessages() {
    // For demo, use mock messages
    const mockMsgs = generateMockMessages(id || 'conv1', name || 'Buddy');
    setMessages(mockMsgs);

    // In production, load from Supabase:
    // const { data, error } = await supabase
    //   .from('messages')
    //   .select('*')
    //   .eq('conversation_id', id)
    //   .order('created_at', { ascending: true });
  }

  async function sendMessage() {
    if (!inputText.trim() || sending) return;

    setSending(true);
    const messageContent = inputText.trim();
    setInputText('');

    // Optimistically add the message
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      message_type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // In production, send to Supabase:
    // try {
    //   const { data, error } = await supabase
    //     .from('messages')
    //     .insert({
    //       conversation_id: id,
    //       sender_id: currentUserId,
    //       content: messageContent,
    //       message_type: 'text'
    //     })
    //     .select()
    //     .single();
    //   
    //   if (error) throw error;
    //   
    //   // Update the temp message with real ID
    //   setMessages(prev => prev.map(m => 
    //     m.id === newMessage.id ? data : m
    //   ));
    // } catch (error) {
    //   console.error('Error sending message:', error);
    //   // Remove the optimistic message on error
    //   setMessages(prev => prev.filter(m => m.id !== newMessage.id));
    //   setInputText(messageContent); // Restore the input
    // }

    setSending(false);
  }

  function formatMessageTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isOwnMessage = item.sender_id === currentUserId;
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      messages[index - 1]?.sender_id === currentUserId
    );

    return (
      <View style={[
        styles.messageRow,
        isOwnMessage ? styles.messageRowOwn : styles.messageRowOther
      ]}>
        {/* Avatar for other user's messages */}
        {!isOwnMessage && (
          <View style={styles.avatarSpace}>
            {showAvatar && (
              photo ? (
                <Image source={{ uri: photo }} style={styles.messageAvatar} />
              ) : (
                <View style={styles.messageAvatarPlaceholder}>
                  <Text style={styles.messageAvatarInitial}>
                    {name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        {/* Message Bubble */}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.messageTextOwn : styles.messageTextOther
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.messageTimeOwn : styles.messageTimeOther
          ]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={FishingTheme.colors.darkGreen} />
        </Pressable>

        <Pressable style={styles.headerProfile}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarInitial}>
                {name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
            <Text style={styles.headerStatus}>Fishing Buddy</Text>
          </View>
        </Pressable>

        <Pressable style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={FishingTheme.colors.darkGreen} />
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={FishingTheme.colors.text.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <Pressable 
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() && !sending 
                ? FishingTheme.colors.cream 
                : FishingTheme.colors.text.muted
              } 
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
    backgroundColor: FishingTheme.colors.background,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FishingTheme.colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  headerAvatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: FishingTheme.colors.cream,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: FishingTheme.colors.darkGreen,
  },
  headerStatus: {
    fontSize: 12,
    color: FishingTheme.colors.text.tertiary,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  avatarSpace: {
    width: 32,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  messageAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FishingTheme.colors.sageGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: FishingTheme.colors.cream,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleOwn: {
    backgroundColor: FishingTheme.colors.darkGreen,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: FishingTheme.colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: FishingTheme.colors.cream,
  },
  messageTextOther: {
    color: FishingTheme.colors.text.primary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  messageTimeOther: {
    color: FishingTheme.colors.text.muted,
  },

  // Input Area
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: FishingTheme.colors.border,
    backgroundColor: FishingTheme.colors.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: FishingTheme.colors.text.primary,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FishingTheme.colors.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: FishingTheme.colors.tan,
  },
});
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
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

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        await loadMessages();
        await markAsRead(session.user.id);
      }
    };
    setup();

    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          if (currentUserId) markAsRead(currentUserId);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, currentUserId]);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }

  async function markAsRead(userId: string) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .is('read_at', null);
  }

  async function sendMessage() {
    if (!inputText.trim() || !currentUserId) return;
    const content = inputText.trim();
    setInputText('');

    const { error } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: currentUserId, content });

    if (!error) {
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={FishingTheme.colors.darkGreen} /></Pressable>
        <Text style={styles.headerName}>{name}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.sender_id === currentUserId ? styles.msgOwn : styles.msgOther]}>
            <View style={[styles.bubble, item.sender_id === currentUserId ? styles.bubbleOwn : styles.bubbleOther]}>
              <Text style={item.sender_id === currentUserId ? styles.textOwn : styles.textOther}>{item.content}</Text>
            </View>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type a message..." />
        <Pressable onPress={sendMessage} style={styles.sendBtn}><Ionicons name="send" size={20} color="white" /></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FishingTheme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: FishingTheme.colors.border },
  headerName: { fontSize: 18, fontWeight: 'bold', marginLeft: 12, color: FishingTheme.colors.darkGreen },
  msgRow: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 16 },
  msgOwn: { justifyContent: 'flex-end' },
  msgOther: { justifyContent: 'flex-start' },
  bubble: { padding: 12, borderRadius: 18, maxWidth: '80%' },
  bubbleOwn: { backgroundColor: FishingTheme.colors.darkGreen },
  bubbleOther: { backgroundColor: FishingTheme.colors.card, borderWidth: 1, borderColor: FishingTheme.colors.border },
  textOwn: { color: 'white' },
  textOther: { color: 'black' },
  inputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: FishingTheme.colors.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: FishingTheme.colors.card, borderRadius: 20, paddingHorizontal: 16, height: 40 },
  sendBtn: { backgroundColor: FishingTheme.colors.darkGreen, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }
});
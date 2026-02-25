import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatImageSkeleton } from '../../components/Skeletons';
import { FishingTheme } from '../../constants/FishingTheme';
import { sendPushNotification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image';
  created_at: string;
  read_at: string | null;
}

function ImageMessage({ uri, isOwn, onPress }: { uri: string; isOwn: boolean; onPress: () => void }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Pressable onPress={onPress}>
      {!loaded && <ChatImageSkeleton isOwn={isOwn} />}
      <Image
        source={{ uri }}
        style={[
          styles.chatImage,
          isOwn ? styles.chatImageOwn : styles.chatImageOther,
          !loaded && styles.hiddenImage,
        ]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
      />
    </Pressable>
  );
}

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
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
    if (data) setMessages(data as Message[]);
  }

  async function markAsRead(userId: string) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id)
      .neq('sender_id', userId)
      .is('read_at', null);
  }

  async function notifyRecipient(content: string, isImage: boolean) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_one, participant_two')
      .eq('id', id)
      .single();

    if (!conv) return;

    const recipientId = conv.participant_one === currentUserId
      ? conv.participant_two
      : conv.participant_one;

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', currentUserId)
      .single();

    const senderName = senderProfile?.display_name || 'Someone';
    await sendPushNotification(recipientId, senderName, content, isImage);
  }

  async function sendMessage() {
    if (!inputText.trim() || !currentUserId) return;
    const content = inputText.trim();
    setInputText('');

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: currentUserId,
        content,
        message_type: 'text'
      });

    if (!error) {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id);

      await notifyRecipient(content, false);
    }
  }

  async function handlePhotoPress() {
    Alert.alert('Send Photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
    ]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendPhoto(result.assets[0].uri);
    }
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadAndSendPhoto(result.assets[0].uri);
    }
  }

  async function uploadAndSendPhoto(uri: string) {
    if (!currentUserId) return;

    try {
      setUploadingPhoto(true);

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${id}/${fileName}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('chat-photos')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(filePath);

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: currentUserId,
          content: publicUrl,
          message_type: 'image',
        });

      if (msgError) throw msgError;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', id);

      await notifyRecipient('', true);

    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Could not send photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isOwn = item.sender_id === currentUserId;

    return (
      <View style={[styles.msgRow, isOwn ? styles.msgOwn : styles.msgOther]}>
        {item.message_type === 'image' ? (
          <ImageMessage
            uri={item.content}
            isOwn={isOwn}
            onPress={() => setLightboxUri(item.content)}
          />
        ) : (
          <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
            <Text style={isOwn ? styles.textOwn : styles.textOther}>
              {item.content}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={FishingTheme.colors.darkGreen} />
        </Pressable>
        <Text style={styles.headerName}>{name}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Bar */}
      <View style={[styles.inputArea, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.photoBtn}
          onPress={handlePhotoPress}
          disabled={uploadingPhoto}
        >
          {uploadingPhoto ? (
            <ActivityIndicator size="small" color={FishingTheme.colors.darkGreen} />
          ) : (
            <Ionicons name="image-outline" size={22} color={FishingTheme.colors.darkGreen} />
          )}
        </Pressable>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={FishingTheme.colors.text.muted}
          multiline
          maxLength={1000}
        />

        <Pressable
          onPress={sendMessage}
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color="white" />
        </Pressable>
      </View>

      {/* Lightbox */}
      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={() => setLightboxUri(null)}
        >
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          <Pressable
            style={[styles.lightboxClose, { top: insets.top + 16 }]}
            onPress={() => setLightboxUri(null)}
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: FishingTheme.colors.border
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: FishingTheme.colors.darkGreen
  },
  messageList: {
    paddingVertical: 12,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 16
  },
  msgOwn: { justifyContent: 'flex-end' },
  msgOther: { justifyContent: 'flex-start' },
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%'
  },
  bubbleOwn: {
    backgroundColor: FishingTheme.colors.darkGreen
  },
  bubbleOther: {
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border
  },
  textOwn: { color: 'white' },
  textOther: { color: FishingTheme.colors.text.primary },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  chatImageOwn: {
    borderBottomRightRadius: 4,
  },
  chatImageOther: {
    borderBottomLeftRadius: 4,
  },
  hiddenImage: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: FishingTheme.colors.border,
    alignItems: 'center',
    gap: 8,
    backgroundColor: FishingTheme.colors.background,
  },
  photoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FishingTheme.colors.card,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    color: FishingTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: FishingTheme.colors.border,
  },
  sendBtn: {
    backgroundColor: FishingTheme.colors.darkGreen,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '80%',
  },
  lightboxClose: {
    position: 'absolute',
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
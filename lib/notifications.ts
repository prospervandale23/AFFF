import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2F4538',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '6574fa28-f725-4813-8047-4ba86ec1be9b', // from your app.json
  });

  return token.data;
}

export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  if (error) console.error('Error saving push token:', error);
}

export async function sendPushNotification(
  recipientUserId: string,
  senderName: string,
  messageContent: string,
  isImage: boolean = false
) {
  // Fetch recipient's push token
  const { data, error } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', recipientUserId)
    .single();

  if (error || !data?.push_token) return;

  const body = isImage ? '📷 Sent you a photo' : messageContent;

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: data.push_token,
      title: senderName,
      body: body.length > 80 ? body.substring(0, 80) + '...' : body,
      sound: 'default',
      badge: 1,
      data: { type: 'message' },
    }),
  });
}
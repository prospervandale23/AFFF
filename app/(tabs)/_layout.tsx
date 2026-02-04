// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useNotifications } from '../../contexts/NotificationContext';

export default function TabsLayout() {
  const { unreadCount, clearBadge } = useNotifications();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopColor: Colors.light.border,
          borderTopWidth: 2,
          height: Platform.select({ ios: 90, android: 70 }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 24, android: 10 }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Conditions',
          tabBarIcon: ({ color, size }) => <Ionicons name="partly-sunny-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{
          tabPress: () => clearBadge(), // Resets badge when tab is clicked
        }}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbox-outline" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.light.badgeBackground,
            color: Colors.light.badgeText,
            fontSize: 10,
            fontWeight: '800',
          },
        }}
      />
      <Tabs.Screen
        name="species"
        options={{
          title: 'Species',
          tabBarIcon: ({ color, size }) => <Ionicons name="fish-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}
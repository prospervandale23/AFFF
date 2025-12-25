// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2F4538', // darkGreen
        tabBarInactiveTintColor: '#8B9B8E', // muted
        tabBarStyle: {
          backgroundColor: '#E8DCC4', // tan/background
          borderTopColor: '#D4C4A8', // border
          borderTopWidth: 2,
          height: Platform.select({ ios: 90, android: 70 }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 24, android: 10 }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarIconStyle: { 
          marginTop: 4 
        },
      }}
    >
      {/* ====== TAB ORDER - Rearrange these Screen components to change order ====== */}
      
      <Tabs.Screen
        name="home"
        options={{
          title: 'Conditions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="partly-sunny-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-outline" color={color} size={size} />
          ),
          tabBarBadge: 3, // Set to undefined or remove this line to hide badge
          tabBarBadgeStyle: {
            backgroundColor: '#2F4538',
            color: '#F5EFE0',
            fontSize: 10,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      
      <Tabs.Screen
        name="species"
        options={{
          title: 'Species',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fish-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      
      {/* Hidden tabs - these won't show in the tab bar */}
      <Tabs.Screen
        name="map"
        options={{
          href: null, // Hides from tab bar
        }}
      />
    </Tabs>
  );
}
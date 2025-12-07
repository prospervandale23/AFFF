import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Hide the default navigation header so we can use our custom one */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* 2. Custom Header with Close Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          {/* You can use text "Close" or an Icon */}
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>
          {TERMS_AND_CONDITIONS_TEXT}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    paddingTop: 10, // Extra padding for status bar if needed
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
    backgroundColor: '#0B1220',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  closeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  text: {
    color: '#E2E8F0',
    fontSize: 16,
    lineHeight: 24,
  }
});

// --- YOUR TEXT CONTENT ---
const TERMS_AND_CONDITIONS_TEXT = `
1. Acceptance of Terms
By downloading or using the app, you agree to our Terms and Conditions outlined below.

2. Account Registration
You need to register for an account to access most features. By creating an account, you promise that all information you provide is true, accurate, and current.

3. Privacy Policy
We care about data privacy and security. By using the app, you agree to be bound by our Privacy Policy.

4. User Generated Content
Users may post photos of catches. You retain ownership of your content.

5. Safety Disclaimer
Fishing involves physical activity and potential risks. You agree that you are voluntarily participating in these activities and assume all risk of injury.

[... Add the rest of your text here ...]
`;
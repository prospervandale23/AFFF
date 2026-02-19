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
You need to register for an account to access the app. By verifying your age and creating an account, you confirm that you are over 16 years old and that the information you provide is accurate and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

3. Privacy Policy
We care about data privacy and security. Catch Connect will not share your personal information with third parties without your consent, except as required by law should a criminal investigation or legal process which results from a users' actions demand it. By using the app, you agree to be bound by our Privacy Policy.

4. User Generated Content
Users may post photos of catches. Catch Connect will not share the emails, usernames, photos, or other personal informatino of any user with third parties without your consent. Catch Connect is not responsible for the recycling and or collection of user generated content by other users within the app. Use discretion with the information and photos you upload to your profile, and the messages you send to other users. 

5. Safety Disclaimer
Fishing involves physical activity and potential risks; so does meeting in person with strangers. Catch Connect is not liable for any injuries or accidents that may occur while fishing or meeting in-person with other users, regardless of the circumstances. 

6. Changes to Terms
We reserve the right to modify these Terms and Conditions at any time. We will notify users of any changes by updating the Terms on this page.
`;
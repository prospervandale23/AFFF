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
By downloading and or using the app, you agree to the Terms and Conditions outlined below.

2. Account Registration
Account Registration is required to use Finnz. Verifying your age confirms you're eligible for registration. You are responsible for maintaining the confidentiality of your account credentials (passwords, emails, etc.) and for all actions that occur under your personal account.

3. Privacy Policy
Finnz will not share your personal information with third parties, unless required to do so in response to an investigation and or legal proceeding resulting from a users' actions. By using the app, you agree to be bound by our Privacy Policy outlined in the profiles tab of Finnz.

4. User Generated Content
Users may post photos of catches. Finnz will not share the emails, usernames, photos, or other personal information of any user with third parties without their explicit consent. Finnz is not responsible for the recycling and or collection of user generated content by other users within the app. Use discretion with the information and photos you upload to your Finnz profile and the messages you send to other users. 

5. Safety Disclaimer
Fishing involves physical activity and the potential for serious bodily harm and or death. As does meeting in person with strangers you met on the internet. Finnz is not liable for any damages to property, injury, or death that may occur while fishing or meeting in-person with other Finnz users or any other persons for that matter, regardless of the circumstances. 

6. Changes to Terms
Finnz reserves the right to modify the Terms and Conditions outlined above at any time. We will notify users of any changes to our Terms and Conditions by sending an email to the address associated with your account. Your continued use of the app after changes are made to the Terms and Conditions constitutes your acceptance of the new Terms and Conditions.
`;

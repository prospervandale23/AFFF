import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

const videoSource = require('../assets/videos/splash.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    checkExistingUser();
    checkAppleAuth();
  }, []);

  async function checkAppleAuth() {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(available);
    } catch (error) {
      console.error('Error checking Apple auth:', error);
      setAppleAuthAvailable(false);
    }
  }

  async function checkExistingUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  // --- Actions ---

  const handleEmailSignIn = () => {
    // Navigate to your email login screen (make sure you create this route!)
    router.push('//auth/email-signin'); 
  };

  const handleTermsClick = () => {
    // Navigate to the new Terms screen
    router.push('/terms');
  };

  async function signInWithApple() {
    try {
      setSigningIn(true);
      setErrorMessage('');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) throw error;
      
      // Update profile name if available
      if (credential.fullName && data.user) {
        const displayName = [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ');
        if (displayName) {
          await supabase.from('profiles').update({ display_name: displayName }).eq('id', data.user.id);
        }
      }
      router.replace('/(tabs)/home');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setErrorMessage(`Apple Error: ${error.message}`);
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function signInAnonymously() {
    try {
      setSigningIn(true);
      setErrorMessage('');
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color="#72E5A2" />
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <VideoView
        style={styles.backgroundVideo}
        player={player}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
      />

      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Catch Connect</Text>
            <Text style={styles.tagline}>Connect with fishing buddies near you</Text>
          </View>

          <View style={styles.authContainer}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {appleAuthAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={signInWithApple}
              />
            )}

            <Pressable 
              style={styles.emailButton}
              onPress={handleEmailSignIn}
              disabled={signingIn}
            >
              <Text style={styles.emailButtonText}>SIGN IN WITH EMAIL</Text>
            </Pressable>

            <Pressable 
              style={styles.guestButton}
              onPress={signInAnonymously}
              disabled={signingIn}
            >
              <Text style={styles.guestButtonText}>
                {signingIn ? 'SIGNING IN...' : 'CONTINUE AS GUEST'}
              </Text>
            </Pressable>

            {/* HYPERLINK */}
            <Text style={styles.disclaimer}>
              By registering for this app you agree to our{' '}
              <Text style={styles.linkText} onPress={handleTermsClick}>
                terms and conditions
              </Text>.
            </Text>

          </View>
        </View>
      </SafeAreaView>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  backgroundVideo: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 60 },
  title: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', marginBottom: 8, letterSpacing: 2 },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 6 },
  authContainer: { gap: 16, alignItems: 'center' },
  appleButton: { width: '100%', maxWidth: 320, height: 50 },
  emailButton: { width: '100%', maxWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, alignItems: 'center' },
  emailButtonText: { fontSize: 16, fontWeight: '800', color: '#000000', letterSpacing: 0.5 },
  guestButton: { width: '100%', maxWidth: 320, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  guestButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.5 },
  disclaimer: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 8, maxWidth: 280 },
  linkText: { color: '#FFFFFF', textDecorationLine: 'underline', fontWeight: 'bold' },
  errorBox: { width: '100%', maxWidth: 320, backgroundColor: 'rgba(255,59,48,0.2)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,59,48,0.5)', marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: '600', color: '#FF3B30', textAlign: 'center' },
});
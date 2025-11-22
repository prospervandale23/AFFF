import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
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
      console.log('🍎 Apple Auth Available:', available);
      setAppleAuthAvailable(available);
    } catch (error) {
      console.error('Error checking Apple auth:', error);
      setAppleAuthAvailable(false);
    }
  }

  async function checkExistingUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already signed in, go straight to app
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithApple() {
    try {
      setSigningIn(true);
      setErrorMessage('');
      console.log('🍎 Starting Apple Sign In...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('✅ Apple credential received');
      setErrorMessage('Got Apple credential, connecting to Supabase...');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      });

      if (error) {
        console.error('❌ Supabase sign in error:', error);
        setErrorMessage(`Supabase Error: ${error.message}`);
        return;
      }
      
      console.log('✅ Successfully signed in with Apple');
      setErrorMessage('Success! Redirecting...');
      
      // Update profile with Apple user info if available
      if (credential.fullName && data.user) {
        const displayName = [
          credential.fullName.givenName,
          credential.fullName.familyName
        ].filter(Boolean).join(' ');

        if (displayName) {
          await supabase.from('profiles').update({
            display_name: displayName
          }).eq('id', data.user.id);
        }
      }
      
      // Navigate to home (user can select fishing type there)
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('💥 Apple sign in error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign In');
        setErrorMessage('Sign in canceled');
      } else {
        const errorMsg = error.message || error.toString() || 'Unknown error';
        setErrorMessage(`Apple Error: ${errorMsg}`);
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function signInAnonymously() {
    try {
      setSigningIn(true);
      setErrorMessage('');
      console.log('🔐 Starting anonymous sign in...');
      
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('❌ Anonymous sign in error:', error);
        setErrorMessage(`Anonymous Sign In Error: ${error.message}`);
      } else {
        console.log('✅ Anonymous sign in successful');
        setErrorMessage('Success! Redirecting...');
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error('💥 Unexpected error:', error);
      const errorMsg = error.message || error.toString() || 'Unknown error';
      setErrorMessage(`Error: ${errorMsg}`);
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
            <Text style={styles.title}>AFF</Text>
            <Text style={styles.subtitle}>Angler Friend Finder</Text>
            <Text style={styles.tagline}>Connect with fishing buddies near you</Text>
          </View>

          <View style={styles.authContainer}>
            {/* Debug info - remove in production */}
            {__DEV__ && (
              <Text style={{ color: 'white', fontSize: 12, marginBottom: 10 }}>
                Apple Auth: {appleAuthAvailable ? '✅ Available' : '❌ Not Available'}
              </Text>
            )}

            {/* Error Display */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {appleAuthAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={signInWithApple}
              />
            )}

            {!appleAuthAvailable && (
              <Pressable 
                style={styles.appleAltButton}
                onPress={signInWithApple}
                disabled={signingIn}
              >
                <Text style={styles.appleAltButtonText}>
                  🍎 SIGN IN WITH APPLE
                </Text>
              </Pressable>
            )}

            <Pressable 
              style={styles.guestButton}
              onPress={signInAnonymously}
              disabled={signingIn}
            >
              <Text style={styles.guestButtonText}>
                {signingIn ? 'SIGNING IN...' : 'CONTINUE AS GUEST'}
              </Text>
            </Pressable>

            <Text style={styles.disclaimer}>
              Sign in to save your profile and connect with anglers
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  backgroundVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  authContainer: {
    gap: 16,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    maxWidth: 320,
    height: 50,
  },
  appleAltButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleAltButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  guestButton: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  errorBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
    lineHeight: 18,
  },
});
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CreateAccountScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEmail = identifier.includes('@');

  async function handleCreateAccount() {
    setError('');
    setSuccess('');

    // Validation
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Please enter an email or username.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Determine the email to use for Supabase auth
      let authEmail: string;

      if (isEmail) {
        authEmail = trimmed.toLowerCase();
      } else {
        // Username-based: check uniqueness first
        const { data: existing, error: checkError } = await supabase
          .from('user_identifiers')
          .select('id')
          .eq('username', trimmed.toLowerCase())
          .maybeSingle();

        if (checkError) {
          setError('Error checking username availability.');
          setLoading(false);
          return;
        }

        if (existing) {
          setError('That username is already taken.');
          setLoading(false);
          return;
        }

        // Generate internal email from username
        authEmail = `${trimmed.toLowerCase()}@catchconnect.local`;
      }

      // Create the account in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: authEmail,
        password,
      });

      if (signUpError) {
        // Handle common errors
        if (signUpError.message.includes('already registered')) {
          setError(isEmail
            ? 'An account with this email already exists.'
            : 'That username is already taken.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: isEmail ? trimmed.split('@')[0] : trimmed,
          fishing_type: null,
          experience_level: null,
          has_boat: false,
          bio: '',
          home_port: '',
          location: '',
          age: null,
          boat_type: '',
          boat_length: '',
          profile_photo_url: null,
        });

        // If username-based, store the mapping
        if (!isEmail) {
          await supabase.from('user_identifiers').insert({
            user_id: data.user.id,
            username: trimmed.toLowerCase(),
          });
        }

        // If email confirmation is required
        if (data.session) {
          router.replace('/(tabs)/home');
        } else {
          setSuccess(isEmail
            ? 'Account created! Check your email to verify.'
            : 'Account created! You can now sign in.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Use an email address or create a unique username
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
                <Pressable
                  style={styles.goSignInButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.goSignInText}>GO TO SIGN IN</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email or Username</Text>
                  <TextInput
                    style={styles.input}
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="e.g. johndoe or john@email.com"
                    placeholderTextColor="rgba(245, 239, 224, 0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.hint}>
                    {isEmail ? '📧 Signing up with email' : '👤 Signing up with username (no email needed)'}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="rgba(245, 239, 224, 0.3)"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor="rgba(245, 239, 224, 0.3)"
                    secureTextEntry
                  />
                </View>

                <Pressable
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                  onPress={handleCreateAccount}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A2E23" />
                  ) : (
                    <Text style={styles.createButtonText}>CREATE ACCOUNT</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A2E23',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#72E5A2',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F5EFE0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(245, 239, 224, 0.6)',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(245, 239, 224, 0.8)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F5EFE0',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hint: {
    fontSize: 13,
    color: 'rgba(245, 239, 224, 0.4)',
    marginTop: 6,
  },
  createButton: {
    backgroundColor: '#72E5A2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2E23',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.4)',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(114, 229, 162, 0.15)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(114, 229, 162, 0.3)',
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#72E5A2',
    textAlign: 'center',
    marginBottom: 16,
  },
  goSignInButton: {
    backgroundColor: '#72E5A2',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  goSignInText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2E23',
  },
});
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
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleUpdate() {
    setError('');
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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
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
          <View style={styles.content}>
            {done ? (
              <>
                <Text style={styles.title}>Password Updated</Text>
                <Text style={styles.subtitle}>
                  Your password has been changed. You can now sign in with your new password.
                </Text>
                <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
                  <Text style={styles.primaryButtonText}>GO TO SIGN IN</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.title}>Set New Password</Text>
                <Text style={styles.subtitle}>Choose a new password for your account.</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
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
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A2E23" />
                  ) : (
                    <Text style={styles.primaryButtonText}>UPDATE PASSWORD</Text>
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
  root: { flex: 1, backgroundColor: '#1A2E23' },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#F5EFE0', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(245, 239, 224, 0.6)', marginBottom: 32, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14, fontWeight: '700', color: 'rgba(245, 239, 224, 0.8)',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#F5EFE0', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  primaryButton: {
    backgroundColor: '#72E5A2', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { fontSize: 17, fontWeight: '800', color: '#1A2E23', letterSpacing: 0.5 },
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.15)', borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,59,48,0.4)',
  },
  errorText: { fontSize: 14, fontWeight: '600', color: '#FF6B6B', textAlign: 'center' },
});

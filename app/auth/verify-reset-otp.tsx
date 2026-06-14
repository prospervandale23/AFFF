import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function VerifyResetOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerify() {
    setError('');
    if (token.trim().length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'recovery',
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.replace('/auth/reset-password');
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
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {email}. Enter it below to reset your password.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Code</Text>
              <TextInput
                style={styles.codeInput}
                value={token}
                onChangeText={setToken}
                placeholder="000000"
                placeholderTextColor="rgba(245, 239, 224, 0.3)"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A2E23" />
              ) : (
                <Text style={styles.primaryButtonText}>VERIFY CODE</Text>
              )}
            </Pressable>
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
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backButton: { padding: 8, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '600', color: '#72E5A2' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 30, fontWeight: '800', color: '#F5EFE0', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(245, 239, 224, 0.6)', marginBottom: 32, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14, fontWeight: '700', color: 'rgba(245, 239, 224, 0.8)',
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16,
    fontSize: 32, fontWeight: '800', color: '#F5EFE0', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', textAlign: 'center', letterSpacing: 12,
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

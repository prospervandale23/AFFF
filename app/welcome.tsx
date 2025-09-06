import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type FishingType = 'Spinning' | 'Fly' | 'Jigging' | 'Baitcasting' | 'Trolling' | 'Ice';

const TYPES: FishingType[] = ['Spinning', 'Fly', 'Jigging', 'Baitcasting', 'Trolling', 'Ice'];

export default function Welcome() {
  const router = useRouter();
  const [selected, setSelected] = useState<FishingType | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(() => !!selected, [selected]);

  const persistChoice = useCallback(async (choice: FishingType) => {
    // Always save locally so routing logic works offline/unauthenticated
    await AsyncStorage.setItem('fishingType', choice);

    // If signed in, also sync to Supabase (user metadata + optional profiles table)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        // 1) Store in user metadata (simple + universal)
        await supabase.auth.updateUser({ data: { fishingType: choice } });

        // 2) OPTIONAL: upsert into a profiles table if you have one
        //   Requires a table like: profiles(id uuid primary key, fishing_type text, updated_at timestamp)
        //   and RLS policy allowing user = auth.uid()
        await supabase
          .from('profiles')
          .upsert(
            { id: user.id, fishing_type: choice, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          )
          .throwOnError();
      }
    } catch (e: any) {
      // Non-fatal: local state is enough to proceed.
      console.warn('Supabase sync failed (continuing with local value):', e?.message ?? e);
    }
  }, []);

  const onContinue = useCallback(async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await persistChoice(selected);
      router.replace('/(tabs)/feeds');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Oops', 'Could not save your choice. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [persistChoice, selected, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎣 Welcome to Fishing Buddy</Text>
      <Text style={styles.subtitle}>Pick your primary fishing style</Text>

      <View style={styles.grid}>
        {TYPES.map((t) => {
          const active = t === selected;
          return (
            <Pressable
              key={t}
              onPress={() => setSelected(t)}
              style={[styles.card, active && styles.cardActive]}
            >
              <Text style={[styles.cardText, active && styles.cardTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={!canContinue || saving}
      >
        {saving ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  title: { color: 'white', fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#A7B0C0', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  grid: {
    width: '100%', maxWidth: 420, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24,
  },
  card: {
    borderWidth: 1, borderColor: '#2A3448', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 10, minWidth: 120, alignItems: 'center',
  },
  cardActive: { backgroundColor: 'white', borderColor: 'white' },
  cardText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cardTextActive: { color: '#0B1220' },
  button: {
    backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, minWidth: 180, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#0B1220', fontSize: 16, fontWeight: '700' },
});

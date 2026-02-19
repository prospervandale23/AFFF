import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View
} from 'react-native';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const MIN_AGE = 16;

function generateYears() {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 100; y--) {
    years.push(y);
  }
  return years;
}

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function generateDays(month: number, year: number) {
  const count = getDaysInMonth(month, year);
  const days: number[] = [];
  for (let d = 1; d <= count; d++) {
    days.push(d);
  }
  return days;
}

// ─── Scroll Picker Component ────────────────────────────────────
interface ScrollPickerProps {
  items: { label: string; value: number }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  width: number;
}

function ScrollPicker({ items, selectedIndex, onSelect, width }: ScrollPickerProps) {
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;
  const flatListRef = useRef<any>(null);

  return (
    <View style={[styles.pickerColumn, { width, height: PICKER_HEIGHT }]}>
      {/* Selection highlight */}
      <View style={styles.selectionHighlight} pointerEvents="none" />

      <Animated.FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(_, i) => i.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e: any) => {
          const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
          onSelect(clampedIndex);
        }}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            (index - 1) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 1) * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.2, 0.5, 1, 0.5, 0.2],
            extrapolate: 'clamp',
          });

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.8, 0.9, 1.05, 0.9, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              style={[
                styles.pickerItem,
                { opacity, transform: [{ scale }] },
              ]}
            >
              <Text style={styles.pickerItemText}>{item.label}</Text>
            </Animated.View>
          );
        }}
      />
    </View>
  );
}

// ─── Main Age Gate Screen ───────────────────────────────────────
export default function AgeGateScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedYear, setSelectedYear] = useState(20); // ~20 years back as default
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  const years = generateYears();
  const days = generateDays(selectedMonth, years[selectedYear]);

  // Clamp day if month/year changes reduce available days
  const clampedDay = Math.min(selectedDay, days.length - 1);

  const monthItems = MONTHS.map((m, i) => ({ label: m, value: i }));
  const dayItems = days.map(d => ({ label: d.toString(), value: d }));
  const yearItems = years.map(y => ({ label: y.toString(), value: y }));

  function calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async function handleConfirm() {
    const birthDate = new Date(
      years[selectedYear],
      selectedMonth,
      days[clampedDay]
    );

    // Basic sanity check
    if (birthDate > new Date()) {
      setError('Please enter a valid date of birth.');
      return;
    }

    const age = calculateAge(birthDate);

    if (age < MIN_AGE) {
      setDenied(true);
      setError('');
      // Store denial to prevent retry
      await AsyncStorage.setItem('age_gate_denied', 'true');
      return;
    }

    // Store verification
    await AsyncStorage.setItem('age_verified', 'true');
    await AsyncStorage.setItem('user_dob', birthDate.toISOString());
    router.replace('/');
  }

  if (denied) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.deniedContainer}>
          <Text style={styles.deniedIcon}>🚫</Text>
          <Text style={styles.deniedTitle}>Age Requirement Not Met</Text>
          <Text style={styles.deniedMessage}>
            You must be at least {MIN_AGE} years old to use Catch Connect.
          </Text>
        </SafeAreaView>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.heading}>Enter your date of birth</Text>
          <Text style={styles.subheading}>
            You must be at least {MIN_AGE} years old to use this app
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.pickerRow}>
            <ScrollPicker
              items={monthItems}
              selectedIndex={selectedMonth}
              onSelect={setSelectedMonth}
              width={140}
            />
            <ScrollPicker
              items={dayItems}
              selectedIndex={clampedDay}
              onSelect={setSelectedDay}
              width={70}
            />
            <ScrollPicker
              items={yearItems}
              selectedIndex={selectedYear}
              onSelect={setSelectedYear}
              width={90}
            />
          </View>

          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>CONFIRM</Text>
          </Pressable>
        </View>
      </SafeAreaView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5EFE0',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 15,
    color: 'rgba(245, 239, 224, 0.6)',
    marginBottom: 32,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  pickerColumn: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(114, 229, 162, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(114, 229, 162, 0.3)',
    zIndex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5EFE0',
  },
  confirmButton: {
    backgroundColor: '#72E5A2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  confirmButtonText: {
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
  // Denied state
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  deniedIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  deniedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F5EFE0',
    marginBottom: 12,
    textAlign: 'center',
  },
  deniedMessage: {
    fontSize: 16,
    color: 'rgba(245, 239, 224, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
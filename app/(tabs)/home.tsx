import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FishingTheme } from '../../constants/FishingTheme';

// Types
type Buoy = { id: string; name: string; lat: number; lon: number };
type Obs = { time?: string; wtmpC?: number; atmpC?: number; presHpa?: number };
type TideData = {
  time: string;
  height: number;
  type: 'high' | 'low';
};
type WindData = {
  speed: number;
  direction: number;
  gust?: number;
};
type MoonPhase = {
  phase: string;
  illumination: number;
  age: number;
  nextNew: string;
  nextFull: string;
};

// Default buoys
const DEFAULT_BUOYS: Buoy[] = [
  { id: '44020', name: 'Block Island', lat: 40.97, lon: -71.12 },
  { id: '44097', name: 'Buzzards Bay', lat: 41.39, lon: -71.03 },
  { id: '44025', name: 'Long Island', lat: 40.25, lon: -73.16 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  const [buoy, setBuoy] = useState<Buoy>(DEFAULT_BUOYS[0]);
  const [obs, setObs] = useState<Obs | null>(null);
  const [recentPres, setRecentPres] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [windData, setWindData] = useState<WindData | null>(null);
  const [tideData, setTideData] = useState<TideData[]>([]);
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadAllData();
    
    const id = setInterval(() => loadAllData(), 300_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [buoy.id]);

  async function loadAllData() {
    await Promise.all([loadBuoy(buoy.id), loadMarineConditions()]);
  }

  async function loadBuoy(stationId: string) {
    try {
      setLoading(true);
      setError('');

      const mockData = {
        time: new Date().toISOString(),
        water_temp_c: 18.5,
        air_temp_c: 22.1,
        pressure_hpa: 1013.2,
      };

      if (!mounted.current) return;

      setObs({
        time: mockData.time,
        wtmpC: mockData.water_temp_c,
        atmpC: mockData.air_temp_c,
        presHpa: mockData.pressure_hpa,
      });
    } catch (e: any) {
      if (!mounted.current) return;
      console.warn('Buoy data error:', e);
      setError('Unable to connect to weather buoy');
      setObs(null);
    } finally {
      mounted.current && setLoading(false);
    }
  }

  async function loadMarineConditions() {
    try {
      setConditionsLoading(true);

      setWindData({
        speed: Math.floor(Math.random() * 15) + 5,
        direction: Math.floor(Math.random() * 360),
        gust: Math.floor(Math.random() * 10) + 15,
      });

      const now = new Date();
      const mockTides: TideData[] = [];
      for (let i = 0; i < 4; i++) {
        const tideTime = new Date(now.getTime() + i * 6 * 60 * 60 * 1000);
        mockTides.push({
          time: tideTime.toISOString(),
          height: Math.random() * 4 + 1,
          type: i % 2 === 0 ? 'high' : 'low',
        });
      }
      setTideData(mockTides);

      const moonPhaseData = calculateMoonPhase();
      setMoonPhase(moonPhaseData);
    } catch (error) {
      console.error('Marine conditions error:', error);
    } finally {
      setConditionsLoading(false);
    }
  }

  function calculateMoonPhase(): MoonPhase {
    const now = new Date();
    const knownNewMoon = new Date('2024-01-11');
    const synodicMonth = 29.53058867;

    const daysSinceKnownNew = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const cyclePosition = daysSinceKnownNew % synodicMonth;
    const age = Math.floor(cyclePosition);

    let phase = '';
    let illumination = 0;

    if (age < 1) {
      phase = 'New Moon';
      illumination = 0;
    } else if (age < 7) {
      phase = 'Waxing Crescent';
      illumination = age / 14;
    } else if (age < 9) {
      phase = 'First Quarter';
      illumination = 0.5;
    } else if (age < 14) {
      phase = 'Waxing Gibbous';
      illumination = ((age - 7) / 7) * 0.5 + 0.5;
    } else if (age < 16) {
      phase = 'Full Moon';
      illumination = 1;
    } else if (age < 22) {
      phase = 'Waning Gibbous';
      illumination = 1 - ((age - 15) / 7) * 0.5;
    } else if (age < 24) {
      phase = 'Last Quarter';
      illumination = 0.5;
    } else {
      phase = 'Waning Crescent';
      illumination = 0.5 - ((age - 22) / 7) * 0.5;
    }

    const daysToNextNew = synodicMonth - cyclePosition;
    const daysToNextFull = age < 15 ? 15 - age : synodicMonth - age + 15;

    const nextNew = new Date(now.getTime() + daysToNextNew * 24 * 60 * 60 * 1000);
    const nextFull = new Date(now.getTime() + daysToNextFull * 24 * 60 * 60 * 1000);

    return {
      phase,
      illumination: Math.round(illumination * 100) / 100,
      age,
      nextNew: nextNew.toISOString(),
      nextFull: nextFull.toISOString(),
    };
  }

  function getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  function getFishingConditions(): { score: string; color: string; reason: string } {
    let score = 0;
    let reasons: string[] = [];

    if (obs?.presHpa) {
      if (obs.presHpa > 1020) {
        score += 1;
        reasons.push('High pressure');
      } else if (obs.presHpa < 1000) {
        score -= 1;
        reasons.push('Low pressure');
      }
    }

    if (windData) {
      if (windData.speed < 10) {
        score += 1;
        reasons.push('Light winds');
      } else if (windData.speed > 20) {
        score -= 1;
        reasons.push('Strong winds');
      }
    }

    if (moonPhase) {
      if (moonPhase.phase === 'New Moon' || moonPhase.phase === 'Full Moon') {
        score += 1;
        reasons.push('Major lunar phase');
      } else if (moonPhase.phase === 'First Quarter' || moonPhase.phase === 'Last Quarter') {
        score += 0.5;
        reasons.push('Minor lunar phase');
      }
    }

    const nextTide = tideData[0];
    if (nextTide && nextTide.type === 'high') {
      score += 0.5;
      reasons.push('Incoming high tide');
    }

    if (score >= 2) return { score: 'Excellent', color: FishingTheme.colors.status.excellent, reason: reasons.join(' • ') };
    if (score >= 1) return { score: 'Good', color: FishingTheme.colors.status.good, reason: reasons.join(' • ') };
    if (score >= 0) return { score: 'Fair', color: FishingTheme.colors.status.fair, reason: reasons.join(' • ') };
    return { score: 'Poor', color: FishingTheme.colors.status.poor, reason: reasons.join(' • ') };
  }

  const pressureTrend = useMemo(() => {
    const s = recentPres.filter(Number.isFinite) as number[];
    if (s.length < 3) return { label: 'steady', icon: '→', color: 'flat' as const };
    const [latest, ...rest] = s;
    const priorAvg = rest.reduce((a, b) => a + b, 0) / rest.length;
    const delta = +(latest - priorAvg).toFixed(2);
    if (delta > 0.5) return { label: 'rising', icon: '↑', color: 'up' as const };
    if (delta < -0.5) return { label: 'falling', icon: '↓', color: 'down' as const };
    return { label: 'steady', icon: '→', color: 'flat' as const };
  }, [recentPres]);

  const airC = obs?.atmpC ?? null;
  const waterC = obs?.wtmpC ?? null;
  const pres = obs?.presHpa ?? null;
  const conditions = getFishingConditions();

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>FISHING BUDDY</Text>
            <Text style={styles.appSubtitle}>Marine Conditions</Text>
          </View>
          <Pressable style={styles.buoyButton} onPress={() => setPickerOpen(true)}>
            <View style={styles.buoyDot} />
            <View>
              <Text style={styles.buoyName}>{buoy.name}</Text>
              <Text style={styles.buoyId}>Station {buoy.id}</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Forecast Card */}
        <View style={styles.forecastSection}>
          <Text style={styles.sectionLabel}>TODAY'S FORECAST</Text>
          <View style={[styles.forecastCard, { borderLeftColor: conditions.color }]}>
            <View style={styles.forecastHeader}>
              <Text style={[styles.forecastScore, { color: conditions.color }]}>
                {conditions.score.toUpperCase()}
              </Text>
              <View style={[styles.conditionDot, { backgroundColor: conditions.color }]} />
            </View>
            <Text style={styles.forecastReason}>{conditions.reason}</Text>
          </View>
        </View>

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <View style={styles.errorDot} />
              <Text style={styles.errorTitle}>CONNECTION ERROR</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => loadBuoy(buoy.id)}>
              <Text style={styles.retryText}>RETRY CONNECTION</Text>
            </Pressable>
          </View>
        )}

        {/* Data Grid */}
        <View style={styles.dataGrid}>
          {/* Barometric Pressure */}
          <DataCard title="BAROMETRIC PRESSURE">
            {loading && !pres ? (
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            ) : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{pres != null ? pres.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}>hPa</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    pressureTrend.color === 'up' ? styles.badgeUp
                      : pressureTrend.color === 'down' ? styles.badgeDown
                      : styles.badgeFlat,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {pressureTrend.icon} {pressureTrend.label.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.timestamp}>
                  {obs?.time
                    ? `Updated ${new Date(obs.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Awaiting update'}
                </Text>
              </>
            )}
          </DataCard>

          {/* Wind */}
          <DataCard title="WIND CONDITIONS">
            {conditionsLoading && !windData ? (
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            ) : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{windData?.speed ?? '—'}</Text>
                  <Text style={styles.unit}>mph</Text>
                </View>
                <Text style={styles.windDirection}>
                  {windData ? `${getWindDirection(windData.direction)} (${windData.direction}°)` : 'Direction unavailable'}
                </Text>
                {windData?.gust && (
                  <Text style={styles.timestamp}>Gusts to {windData.gust} mph</Text>
                )}
              </>
            )}
          </DataCard>

          {/* Moon Phase */}
          <DataCard title="MOON PHASE">
            {!moonPhase ? (
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            ) : (
              <>
                <Text style={styles.moonPhase}>{moonPhase.phase.toUpperCase()}</Text>
                <Text style={styles.moonDetails}>
                  {Math.round(moonPhase.illumination * 100)}% illuminated
                </Text>
                <Text style={styles.moonDetails}>{moonPhase.age} days into cycle</Text>
                <Text style={styles.timestamp}>
                  Next full: {new Date(moonPhase.nextFull).toLocaleDateString()}
                </Text>
              </>
            )}
          </DataCard>

          {/* Air Temperature */}
          <DataCard title="AIR TEMPERATURE">
            {loading && airC == null ? (
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            ) : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{airC != null ? airC.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}>°C</Text>
                </View>
                <Text style={styles.tempConversion}>
                  {airC != null ? toF(airC).toFixed(1) : '—'}°F
                </Text>
              </>
            )}
          </DataCard>

          {/* Water Temperature */}
          <DataCard title="WATER TEMPERATURE">
            {loading && waterC == null ? (
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            ) : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{waterC != null ? waterC.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}>°C</Text>
                </View>
                <Text style={styles.tempConversion}>
                  {waterC != null ? toF(waterC).toFixed(1) : '—'}°F
                </Text>
              </>
            )}
          </DataCard>
        </View>

        {/* Tide Schedule */}
        <View style={styles.tideSection}>
          <Text style={styles.sectionLabel}>TIDE SCHEDULE</Text>
          {tideData.length === 0 ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={FishingTheme.colors.darkGreen} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tideScroll}
            >
              {tideData.slice(0, 4).map((tide, index) => (
                <View key={index} style={styles.tideCard}>
                  <View style={styles.tideHeader}>
                    <Text style={styles.tideType}>
                      {tide.type === 'high' ? 'HIGH' : 'LOW'}
                    </Text>
                    <Text style={styles.tideHeight}>{tide.height.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.tideUnit}>feet</Text>
                  <View style={styles.tideDivider} />
                  <Text style={styles.tideTime}>
                    {new Date(tide.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.tideDate}>
                    {new Date(tide.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Buoy Picker Modal */}
      <BuoyPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selectedBuoy) => {
          setBuoy(selectedBuoy);
          setPickerOpen(false);
        }}
        buoys={DEFAULT_BUOYS}
      />
    </View>
  );
}

function DataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.dataCard}>
      <Text style={styles.dataCardTitle}>{title}</Text>
      <View style={styles.dataCardContent}>{children}</View>
    </View>
  );
}

function BuoyPickerModal({
  visible,
  onClose,
  onSelect,
  buoys,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (buoy: Buoy) => void;
  buoys: Buoy[];
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>SELECT WEATHER BUOY</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>
          <FlatList
            data={buoys}
            keyExtractor={(b) => b.id}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.modalItem,
                  pressed && styles.modalItemPressed,
                ]}
              >
                <View style={styles.modalItemContent}>
                  <View style={styles.modalDot} />
                  <View style={styles.modalItemText}>
                    <Text style={styles.modalItemName}>{item.name}</Text>
                    <Text style={styles.modalItemDetail}>
                      Station {item.id} • {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function toF(c: number) {
  return (c * 9) / 5 + 32;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: FishingTheme.colors.background,
  },

  // Header
  header: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingBottom: FishingTheme.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  appTitle: {
    fontSize: FishingTheme.typography.sizes.display,
    fontWeight: FishingTheme.typography.weights.extrabold,
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: FishingTheme.typography.sizes.sm,
    color: FishingTheme.colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  buoyButton: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...FishingTheme.shadows.sm,
  },
  buoyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FishingTheme.colors.darkGreen,
  },
  buoyName: {
    fontSize: 12,
    fontWeight: '700',
    color: FishingTheme.colors.text.primary,
    letterSpacing: 0.3,
  },
  buoyId: {
    fontSize: 10,
    color: FishingTheme.colors.text.tertiary,
    marginTop: 1,
  },

  // Forecast Section
  forecastSection: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingTop: FishingTheme.spacing.xl,
  },
  sectionLabel: {
    fontSize: FishingTheme.typography.sizes.xs,
    fontWeight: FishingTheme.typography.weights.bold,
    color: FishingTheme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: FishingTheme.spacing.md,
  },
  forecastCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    padding: FishingTheme.spacing.lg,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    borderLeftWidth: 6,
    ...FishingTheme.shadows.md,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: FishingTheme.spacing.sm,
  },
  forecastScore: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conditionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  forecastReason: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Error
  errorContainer: {
    marginHorizontal: FishingTheme.spacing.xl,
    marginTop: FishingTheme.spacing.lg,
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    padding: FishingTheme.spacing.lg,
    borderWidth: 2,
    borderColor: FishingTheme.colors.status.poor,
    borderLeftWidth: 6,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FishingTheme.colors.status.poor,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: FishingTheme.colors.status.poor,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 14,
    color: FishingTheme.colors.text.secondary,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: FishingTheme.colors.cream,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Data Grid
  dataGrid: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingTop: FishingTheme.spacing.xl,
    gap: FishingTheme.spacing.md,
  },
  dataCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
    ...FishingTheme.shadows.sm,
  },
  dataCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: FishingTheme.colors.cream,
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: FishingTheme.spacing.lg,
    paddingVertical: FishingTheme.spacing.sm,
    letterSpacing: 1,
  },
  dataCardContent: {
    padding: FishingTheme.spacing.lg,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  bigValue: {
    fontSize: 36,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 16,
    color: FishingTheme.colors.text.tertiary,
    marginLeft: 6,
    marginBottom: 6,
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeUp: { backgroundColor: FishingTheme.colors.darkGreen },
  badgeDown: { backgroundColor: FishingTheme.colors.status.poor },
  badgeFlat: { backgroundColor: FishingTheme.colors.sageGreen },
  badgeText: {
    color: FishingTheme.colors.cream,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 11,
    color: FishingTheme.colors.text.muted,
    marginTop: 8,
  },
  windDirection: {
    fontSize: 16,
    fontWeight: '700',
    color: FishingTheme.colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  moonPhase: {
    fontSize: 18,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  moonDetails: {
    fontSize: 13,
    color: FishingTheme.colors.text.secondary,
    marginBottom: 4,
  },
  tempConversion: {
    fontSize: 14,
    color: FishingTheme.colors.text.tertiary,
    marginTop: 4,
  },
  unavailableText: {
    fontSize: 13,
    color: FishingTheme.colors.text.muted,
    fontStyle: 'italic',
  },

  // Tides
  tideSection: {
    paddingLeft: FishingTheme.spacing.xl,
    paddingTop: FishingTheme.spacing.xl,
    paddingBottom: FishingTheme.spacing.lg,
  },
  tideScroll: {
    paddingRight: FishingTheme.spacing.xl,
    gap: FishingTheme.spacing.md,
  },
  tideCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    padding: FishingTheme.spacing.lg,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    width: 120,
    ...FishingTheme.shadows.sm,
  },
  tideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  tideType: {
    fontSize: 11,
    fontWeight: '700',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 0.5,
  },
  tideHeight: {
    fontSize: 24,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: -0.5,
  },
  tideUnit: {
    fontSize: 10,
    color: FishingTheme.colors.text.tertiary,
    marginBottom: 8,
  },
  tideDivider: {
    height: 1,
    backgroundColor: FishingTheme.colors.border,
    marginVertical: 8,
  },
  tideTime: {
    fontSize: 15,
    fontWeight: '700',
    color: FishingTheme.colors.text.primary,
    marginBottom: 2,
  },
  tideDate: {
    fontSize: 11,
    color: FishingTheme.colors.text.tertiary,
  },
  loadingCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    padding: 40,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    alignItems: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: FishingTheme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: FishingTheme.colors.cream,
    borderTopLeftRadius: FishingTheme.borderRadius.xl,
    borderTopRightRadius: FishingTheme.borderRadius.xl,
    paddingTop: FishingTheme.spacing.xl,
    paddingBottom: 40,
    maxHeight: '70%',
    borderTopWidth: 3,
    borderColor: FishingTheme.colors.darkGreen,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: FishingTheme.spacing.xl,
    marginBottom: FishingTheme.spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: FishingTheme.colors.darkGreen,
    letterSpacing: 1,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FishingTheme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: FishingTheme.colors.darkGreen,
    fontWeight: '400',
    lineHeight: 28,
  },
  modalItem: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingVertical: FishingTheme.spacing.lg,
  },
  modalItemPressed: {
    backgroundColor: FishingTheme.colors.tan,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: FishingTheme.colors.darkGreen,
  },
  modalItemText: {
    flex: 1,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: FishingTheme.colors.darkGreen,
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  modalItemDetail: {
    fontSize: 12,
    color: FishingTheme.colors.text.tertiary,
  },
  modalSeparator: {
    height: 2,
    backgroundColor: FishingTheme.colors.border,
    marginHorizontal: FishingTheme.spacing.xl,
  },
});
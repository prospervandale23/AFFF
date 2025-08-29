import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList, Modal,
  Pressable,
  ScrollView,
  StyleSheet, Text, View
} from 'react-native';

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
  { id: '44020', name: 'Block Island (44020)', lat: 40.97, lon: -71.12 },
  { id: '44097', name: 'Buzzards Bay (44097)', lat: 41.39, lon: -71.03 },
  { id: '44025', name: 'Long Island (44025)', lat: 40.25, lon: -73.16 },
];

export default function HomeScreen() {
  const [buoy, setBuoy] = useState<Buoy>(DEFAULT_BUOYS[0]);
  const [obs, setObs] = useState<Obs | null>(null);
  const [recentPres, setRecentPres] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  
  // New state for marine conditions
  const [windData, setWindData] = useState<WindData | null>(null);
  const [tideData, setTideData] = useState<TideData[]>([]);
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    loadAllData();
    const id = setInterval(() => loadAllData(), 300_000); // Update every 5 minutes
    return () => { mounted.current = false; clearInterval(id); };
  }, [buoy.id]);

  async function loadAllData() {
    await Promise.all([
      loadBuoy(buoy.id),
      loadMarineConditions()
    ]);
  }

  async function loadBuoy(stationId: string) {
    try {
      setLoading(true);
      setDebug('');

      // Your existing API call (currently disabled due to CORS)
      // For now, we'll use mock data to prevent errors
      const mockData = {
        time: new Date().toISOString(),
        water_temp_c: 18.5,
        air_temp_c: 22.1,
        pressure_hpa: 1013.2
      };

      if (!mounted.current) return;
      
      setObs({
        time: mockData.time,
        wtmpC: mockData.water_temp_c,
        atmpC: mockData.air_temp_c,
        presHpa: mockData.pressure_hpa
      });
      
    } catch (e: any) {
      if (!mounted.current) return;
      console.warn('Buoy data error:', e);
      setDebug('Using sample data - NOAA API needs CORS configuration');
      // Set sample data instead of failing
      setObs({
        time: new Date().toISOString(),
        wtmpC: 18.5,
        atmpC: 22.1,
        presHpa: 1013.2
      });
    } finally {
      mounted.current && setLoading(false);
    }
  }

  async function loadMarineConditions() {
    try {
      setConditionsLoading(true);
      
      // For now, using mock data for all marine conditions
      // Later we'll integrate with proper marine APIs
      
      // Mock wind data
      setWindData({
        speed: Math.floor(Math.random() * 15) + 5, // 5-20 mph
        direction: Math.floor(Math.random() * 360),
        gust: Math.floor(Math.random() * 10) + 15 // 15-25 mph
      });

      // Mock tide data (next 4 tides)
      const now = new Date();
      const mockTides: TideData[] = [];
      for (let i = 0; i < 4; i++) {
        const tideTime = new Date(now.getTime() + (i * 6 * 60 * 60 * 1000)); // Every 6 hours
        mockTides.push({
          time: tideTime.toISOString(),
          height: Math.random() * 4 + 1, // 1-5 feet
          type: i % 2 === 0 ? 'high' : 'low'
        });
      }
      setTideData(mockTides);

      // Calculate moon phase (this is real calculation!)
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
    
    // Simplified moon phase calculation
    const knownNewMoon = new Date('2024-01-11'); // Known new moon
    const synodicMonth = 29.53058867; // Days in lunar cycle
    
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
      illumination = (age - 7) / 7 * 0.5 + 0.5;
    } else if (age < 16) {
      phase = 'Full Moon';
      illumination = 1;
    } else if (age < 22) {
      phase = 'Waning Gibbous';
      illumination = 1 - ((age - 15) / 7 * 0.5);
    } else if (age < 24) {
      phase = 'Last Quarter';
      illumination = 0.5;
    } else {
      phase = 'Waning Crescent';
      illumination = 0.5 - ((age - 22) / 7 * 0.5);
    }

    // Calculate next new and full moons
    const daysToNextNew = synodicMonth - cyclePosition;
    const daysToNextFull = age < 15 ? 15 - age : synodicMonth - age + 15;
    
    const nextNew = new Date(now.getTime() + daysToNextNew * 24 * 60 * 60 * 1000);
    const nextFull = new Date(now.getTime() + daysToNextFull * 24 * 60 * 60 * 1000);

    return {
      phase,
      illumination: Math.round(illumination * 100) / 100,
      age,
      nextNew: nextNew.toISOString(),
      nextFull: nextFull.toISOString()
    };
  }

  function getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  function getMoonEmoji(phase: string): string {
    switch (phase) {
      case 'New Moon': return '🌑';
      case 'Waxing Crescent': return '🌒';
      case 'First Quarter': return '🌓';
      case 'Waxing Gibbous': return '🌔';
      case 'Full Moon': return '🌕';
      case 'Waning Gibbous': return '🌖';
      case 'Last Quarter': return '🌗';
      case 'Waning Crescent': return '🌘';
      default: return '🌙';
    }
  }

  function getFishingConditions(): { score: string; color: string; reason: string } {
    // Simple fishing conditions algorithm based on available data
    let score = 0;
    let reasons: string[] = [];

    // Pressure analysis
    if (obs?.presHpa) {
      if (obs.presHpa > 1020) {
        score += 1;
        reasons.push('High pressure');
      } else if (obs.presHpa < 1000) {
        score -= 1;
        reasons.push('Low pressure');
      }
    }

    // Wind analysis
    if (windData) {
      if (windData.speed < 10) {
        score += 1;
        reasons.push('Light winds');
      } else if (windData.speed > 20) {
        score -= 1;
        reasons.push('Strong winds');
      }
    }

    // Moon phase analysis
    if (moonPhase) {
      if (moonPhase.phase === 'New Moon' || moonPhase.phase === 'Full Moon') {
        score += 1;
        reasons.push('Major lunar phase');
      } else if (moonPhase.phase === 'First Quarter' || moonPhase.phase === 'Last Quarter') {
        score += 0.5;
        reasons.push('Minor lunar phase');
      }
    }

    // Tide analysis (simplified - would need more complex logic for real predictions)
    const nextTide = tideData[0];
    if (nextTide && nextTide.type === 'high') {
      score += 0.5;
      reasons.push('Incoming high tide');
    }

    // Convert score to rating
    if (score >= 2) return { score: 'Excellent', color: '#72E5A2', reason: reasons.join(' • ') };
    if (score >= 1) return { score: 'Good', color: '#FFD93D', reason: reasons.join(' • ') };
    if (score >= 0) return { score: 'Fair', color: '#FF8A8A', reason: reasons.join(' • ') };
    return { score: 'Poor', color: '#FF6B6B', reason: reasons.join(' • ') };
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
      <View style={styles.header}>
        <Text style={styles.appTitle}>Fishing Buddy</Text>
        <Pressable style={styles.buoyButton} onPress={() => setPickerOpen(true)}>
          <Text style={styles.buoyText} numberOfLines={1}>Buoy: {buoy.name}</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Fishing Conditions Overview */}
        <View style={styles.conditionsOverview}>
          <Text style={styles.conditionsTitle}>Fishing Conditions</Text>
          <View style={[styles.conditionsCard, { borderColor: conditions.color }]}>
            <Text style={[styles.conditionsScore, { color: conditions.color }]}>
              {conditions.score}
            </Text>
            <Text style={styles.conditionsReason}>{conditions.reason}</Text>
          </View>
        </View>

        {/* Marine Data Grid */}
        <View style={styles.cardsGrid}>
          {/* Barometric Pressure */}
          <Card title="Barometric Pressure">
            {loading && !pres ? <ActivityIndicator /> : (
              <>
                <View style={styles.rowCenter}>
                  <Text style={styles.bigNumber}>{pres != null ? pres.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}> hPa</Text>
                </View>
                <View style={[
                  styles.trendPill,
                  pressureTrend.color === 'up' ? styles.trendUp :
                  pressureTrend.color === 'down' ? styles.trendDown : styles.trendFlat
                ]}>
                  <Text style={styles.trendText}>{pressureTrend.icon} {cap(pressureTrend.label)}</Text>
                </View>
                <Text style={styles.caption}>Latest: {obs?.time ? new Date(obs.time).toLocaleTimeString() : '—'}</Text>
              </>
            )}
          </Card>

          {/* Wind Conditions */}
          <Card title="Wind Conditions">
            {conditionsLoading && !windData ? <ActivityIndicator /> : (
              <>
                <View style={styles.rowCenter}>
                  <Text style={styles.bigNumber}>{windData?.speed ?? '—'}</Text>
                  <Text style={styles.unit}> mph</Text>
                </View>
                <Text style={styles.windDirection}>
                  {windData ? `${getWindDirection(windData.direction)} (${windData.direction}°)` : '—'}
                </Text>
                {windData?.gust && (
                  <Text style={styles.caption}>Gusts: {windData.gust} mph</Text>
                )}
              </>
            )}
          </Card>

          {/* Moon Phase */}
          <Card title="Moon Phase">
            {!moonPhase ? <ActivityIndicator /> : (
              <>
                <View style={styles.moonContainer}>
                  <Text style={styles.moonEmoji}>{getMoonEmoji(moonPhase.phase)}</Text>
                  <Text style={styles.moonPhase}>{moonPhase.phase}</Text>
                </View>
                <Text style={styles.moonDetails}>
                  {Math.round(moonPhase.illumination * 100)}% illuminated • {moonPhase.age} days old
                </Text>
                <Text style={styles.caption}>
                  Next Full: {new Date(moonPhase.nextFull).toLocaleDateString()}
                </Text>
              </>
            )}
          </Card>

          {/* Air Temperature */}
          <Card title="Air Temperature">
            {loading && airC == null ? <ActivityIndicator /> : (
              <>
                <View style={styles.rowCenter}>
                  <Text style={styles.bigNumber}>{airC != null ? airC.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}> °C</Text>
                </View>
                <Text style={styles.captionDim}>{airC != null ? toF(airC).toFixed(1) : '—'} °F</Text>
              </>
            )}
          </Card>

          {/* Water Temperature */}
          <Card title="Water Temperature">
            {loading && waterC == null ? <ActivityIndicator /> : (
              <>
                <View style={styles.rowCenter}>
                  <Text style={styles.bigNumber}>{waterC != null ? waterC.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}> °C</Text>
                </View>
                <Text style={styles.captionDim}>{waterC != null ? toF(waterC).toFixed(1) : '—'} °F • {buoy.id}</Text>
              </>
            )}
          </Card>
        </View>

        {/* Tide Information */}
        <View style={styles.tidesSection}>
          <Text style={styles.sectionTitle}>Tide Schedule</Text>
          {tideData.length === 0 ? (
            <ActivityIndicator />
          ) : (
            <View style={styles.tidesContainer}>
              {tideData.slice(0, 4).map((tide, index) => (
                <View key={index} style={styles.tideCard}>
                  <View style={styles.tideHeader}>
                    <Text style={styles.tideType}>
                      {tide.type === 'high' ? '⬆️ High' : '⬇️ Low'}
                    </Text>
                    <Text style={styles.tideHeight}>{tide.height.toFixed(1)}ft</Text>
                  </View>
                  <Text style={styles.tideTime}>
                    {new Date(tide.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Debug Info */}
        {!!debug && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTxt}>Debug: {debug}</Text>
          </View>
        )}
      </ScrollView>

      {/* Buoy Picker Modal */}
      <BuoyPickerModal 
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selectedBuoy) => { setBuoy(selectedBuoy); setPickerOpen(false); }}
        buoys={DEFAULT_BUOYS}
      />
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BuoyPickerModal({ visible, onClose, onSelect, buoys }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (buoy: Buoy) => void;
  buoys: Buoy[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Buoy</Text>
          <FlatList
            data={buoys}
            keyExtractor={b => b.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.modalItem, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                <Text style={styles.modalSubText}>{item.lat.toFixed(2)}, {item.lon.toFixed(2)}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function toF(c: number) { return (c * 9) / 5 + 32; }
function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220', paddingTop: 16 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  appTitle: { fontSize: 28, fontWeight: '800', color: '#E8ECF1', letterSpacing: -0.5 },
  buoyButton: {
    alignSelf: 'flex-start', 
    backgroundColor: '#1A2440', 
    borderRadius: 16,
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderWidth: 1.5, 
    borderColor: '#2A3A63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buoyText: { color: '#E9F2FF', fontSize: 14, fontWeight: '600', maxWidth: 280 },
  
  // Enhanced Fishing Conditions Overview
  conditionsOverview: { paddingHorizontal: 20, marginBottom: 20 },
  conditionsTitle: { color: '#E8ECF1', fontSize: 20, fontWeight: '700', marginBottom: 12, letterSpacing: -0.3 },
  conditionsCard: { 
    backgroundColor: '#121A2B', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 2, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  conditionsScore: { fontSize: 28, fontWeight: '800', marginBottom: 6, letterSpacing: -0.5 },
  conditionsReason: { color: '#9BB0CC', fontSize: 15, textAlign: 'center', lineHeight: 20 },
  
  // Enhanced Cards Grid
  cardsGrid: { paddingHorizontal: 20, gap: 16, marginBottom: 20 },
  card: { 
    backgroundColor: '#121A2B', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: '#1E2A44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: { 
    color: '#AFC3E1', 
    fontSize: 14, 
    letterSpacing: 0.5, 
    marginBottom: 12, 
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  rowCenter: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  bigNumber: { fontSize: 40, fontWeight: '800', color: '#F5FAFF', letterSpacing: -1 },
  unit: { fontSize: 18, color: '#A9B7CD', marginLeft: 8, marginBottom: 6, fontWeight: '500' },
  
  // Enhanced Trend Pills
  trendPill: { 
    alignSelf: 'flex-start', 
    marginTop: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  trendText: { color: '#0B1220', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
  trendUp: { backgroundColor: '#72E5A2' },
  trendDown: { backgroundColor: '#FF8A8A' },
  trendFlat: { backgroundColor: '#C8D2E0' },
  
  // Enhanced Wind & Moon Displays
  windDirection: { color: '#E8ECF1', fontSize: 17, fontWeight: '600', marginTop: 6, letterSpacing: -0.2 },
  
  moonContainer: { alignItems: 'center', marginBottom: 12 },
  moonEmoji: { fontSize: 52, marginBottom: 6 },
  moonPhase: { color: '#E8ECF1', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  moonDetails: { 
    color: '#9BB0CC', 
    fontSize: 13, 
    textAlign: 'center', 
    marginBottom: 6, 
    lineHeight: 18,
    letterSpacing: 0.2
  },
  
  // Enhanced Text Styles
  caption: { 
    color: '#8EA3C0', 
    fontSize: 13, 
    marginTop: 10, 
    lineHeight: 18,
    letterSpacing: 0.2
  },
  captionDim: { 
    color: '#7B8CA7', 
    fontSize: 13, 
    marginTop: 8, 
    lineHeight: 18,
    letterSpacing: 0.1
  },
  
  // Enhanced Tides Section
  tidesSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { 
    color: '#E8ECF1', 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 16, 
    letterSpacing: -0.3 
  },
  tidesContainer: { flexDirection: 'row', gap: 12 },
  tideCard: { 
    flex: 1, 
    backgroundColor: '#121A2B', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#1E2A44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  tideHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 6 
  },
  tideType: { color: '#72E5A2', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  tideHeight: { color: '#E8ECF1', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  tideTime: { color: '#9BB0CC', fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },
  
  // Enhanced Debug Container
  debugContainer: { paddingHorizontal: 20, marginBottom: 20 },
  debugTxt: { 
    color: '#FFB0B0', 
    fontSize: 12, 
    backgroundColor: '#1A1A1A', 
    padding: 12, 
    borderRadius: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    borderWidth: 1,
    borderColor: '#333'
  },

  // Enhanced Modal Styles
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(6,10,18,0.75)', 
    justifyContent: 'center', 
    padding: 24 
  },
  modalCard: { 
    backgroundColor: '#121A2B', 
    borderRadius: 24, 
    paddingVertical: 16, 
    borderWidth: 1, 
    borderColor: '#233355', 
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { 
    color: '#E8ECF1', 
    fontSize: 18, 
    fontWeight: '700', 
    paddingHorizontal: 20, 
    paddingBottom: 12,
    letterSpacing: -0.2
  },
  modalItem: { paddingHorizontal: 20, paddingVertical: 16 },
  modalItemText: { 
    color: '#E5EEF9', 
    fontSize: 16, 
    fontWeight: '600',
    letterSpacing: -0.1
  },
  modalSubText: { 
    color: '#8DA0BE', 
    fontSize: 13, 
    marginTop: 4,
    letterSpacing: 0.2
  },
  separator: { height: 1, backgroundColor: '#1E2A44', marginHorizontal: 20 },
  modalClose: { 
    alignSelf: 'center', 
    marginTop: 12, 
    marginBottom: 16, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 16, 
    backgroundColor: '#1A2440', 
    borderWidth: 1.5, 
    borderColor: '#2A3A63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  modalCloseText: { 
    color: '#DCE8FA', 
    fontWeight: '600', 
    fontSize: 15,
    letterSpacing: 0.2
  },
});
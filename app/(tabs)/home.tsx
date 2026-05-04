import { FishingTheme } from '@/constants/FishingTheme';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '../../components/Closebutton';

// Types
type Buoy = { id: string; name: string; lat: number; lon: number; region: string };
type Obs = { time?: string; wtmpC?: number; atmpC?: number; presHpa?: number };
type TideData = { time: string; height: number; type: 'high' | 'low' };
type WindData = { speed: number; direction: number; gust?: number };
type MoonPhase = {
  phase: string;
  illumination: number;
  age: number;
  nextNew: string;
  nextFull: string;
};

// ─── Comprehensive US NOAA Tide Stations ────────────────────────────────────
const ALL_BUOYS: Buoy[] = [
  // New England
  { id: '8418150', name: 'Portland, ME', lat: 43.66, lon: -70.25, region: 'New England' },
  { id: '8419317', name: 'Wells, ME', lat: 43.32, lon: -70.56, region: 'New England' },
  { id: '8423898', name: 'Fort Point, NH', lat: 43.07, lon: -70.71, region: 'New England' },
  { id: '8443970', name: 'Boston, MA', lat: 42.35, lon: -71.05, region: 'New England' },
  { id: '8447386', name: 'Fall River, MA', lat: 41.70, lon: -71.16, region: 'New England' },
  { id: '8447930', name: 'Woods Hole, MA', lat: 41.52, lon: -70.67, region: 'New England' },
  { id: '8449130', name: 'Nantucket, MA', lat: 41.29, lon: -70.10, region: 'New England' },
  { id: '8452660', name: 'Newport, RI', lat: 41.50, lon: -71.33, region: 'New England' },
  { id: '8454000', name: 'Providence, RI', lat: 41.81, lon: -71.40, region: 'New England' },
  { id: '8461490', name: 'New London, CT', lat: 41.36, lon: -72.09, region: 'New England' },
  { id: '8465705', name: 'New Haven, CT', lat: 41.28, lon: -72.91, region: 'New England' },
  { id: '8467150', name: 'Bridgeport, CT', lat: 41.17, lon: -73.18, region: 'New England' },

  // Mid-Atlantic
  { id: '8510560', name: 'Montauk, NY', lat: 41.05, lon: -71.96, region: 'Mid-Atlantic' },
  { id: '8516945', name: 'Kings Point, NY', lat: 40.81, lon: -73.77, region: 'Mid-Atlantic' },
  { id: '8518750', name: 'Battery, NY', lat: 40.70, lon: -74.01, region: 'Mid-Atlantic' },
  { id: '8519483', name: 'Bergen Point, NJ', lat: 40.64, lon: -74.14, region: 'Mid-Atlantic' },
  { id: '8530973', name: 'Sandy Hook, NJ', lat: 40.47, lon: -74.01, region: 'Mid-Atlantic' },
  { id: '8534720', name: 'Atlantic City, NJ', lat: 39.36, lon: -74.42, region: 'Mid-Atlantic' },
  { id: '8536110', name: 'Cape May, NJ', lat: 38.97, lon: -74.96, region: 'Mid-Atlantic' },
  { id: '8545240', name: 'Philadelphia, PA', lat: 39.93, lon: -75.14, region: 'Mid-Atlantic' },
  { id: '8551762', name: 'Delaware City, DE', lat: 39.58, lon: -75.59, region: 'Mid-Atlantic' },
  { id: '8557380', name: 'Lewes, DE', lat: 38.78, lon: -75.12, region: 'Mid-Atlantic' },
  { id: '8570283', name: 'Ocean City Inlet, MD', lat: 38.33, lon: -75.09, region: 'Mid-Atlantic' },
  { id: '8571892', name: 'Cambridge, MD', lat: 38.57, lon: -76.07, region: 'Mid-Atlantic' },
  { id: '8574680', name: 'Baltimore, MD', lat: 39.27, lon: -76.58, region: 'Mid-Atlantic' },
  { id: '8638610', name: 'Sewells Point, VA', lat: 36.95, lon: -76.33, region: 'Mid-Atlantic' },
  { id: '8639348', name: 'Money Point, VA', lat: 36.78, lon: -76.30, region: 'Mid-Atlantic' },

  // Southeast Atlantic
  { id: '8651370', name: 'Duck, NC', lat: 36.18, lon: -75.75, region: 'Southeast Atlantic' },
  { id: '8654467', name: 'Oregon Inlet, NC', lat: 35.80, lon: -75.55, region: 'Southeast Atlantic' },
  { id: '8656483', name: 'Beaufort, NC', lat: 34.72, lon: -76.67, region: 'Southeast Atlantic' },
  { id: '8658120', name: 'Wilmington, NC', lat: 34.23, lon: -77.95, region: 'Southeast Atlantic' },
  { id: '8661070', name: 'Springmaid Pier, SC', lat: 33.65, lon: -78.92, region: 'Southeast Atlantic' },
  { id: '8665530', name: 'Charleston, SC', lat: 32.78, lon: -79.93, region: 'Southeast Atlantic' },
  { id: '8670870', name: 'Fort Pulaski, GA', lat: 32.03, lon: -80.90, region: 'Southeast Atlantic' },
  { id: '8720030', name: 'Fernandina Beach, FL', lat: 30.67, lon: -81.47, region: 'Southeast Atlantic' },
  { id: '8720218', name: 'Mayport, FL', lat: 30.40, lon: -81.43, region: 'Southeast Atlantic' },
  { id: '8721604', name: 'Trident Pier, FL', lat: 28.42, lon: -80.59, region: 'Southeast Atlantic' },
  { id: '8722670', name: 'Lake Worth Pier, FL', lat: 26.61, lon: -80.03, region: 'Southeast Atlantic' },
  { id: '8723214', name: 'Virginia Key, FL', lat: 25.73, lon: -80.16, region: 'Southeast Atlantic' },
  { id: '8724580', name: 'Key West, FL', lat: 24.55, lon: -81.81, region: 'Southeast Atlantic' },

  // Gulf Coast
  { id: '8725110', name: 'Naples, FL', lat: 26.13, lon: -81.81, region: 'Gulf Coast' },
  { id: '8726520', name: 'St. Petersburg, FL', lat: 27.76, lon: -82.63, region: 'Gulf Coast' },
  { id: '8727520', name: 'Cedar Key, FL', lat: 29.13, lon: -83.03, region: 'Gulf Coast' },
  { id: '8728690', name: 'Apalachicola, FL', lat: 29.73, lon: -84.98, region: 'Gulf Coast' },
  { id: '8729108', name: 'Panama City, FL', lat: 30.15, lon: -85.67, region: 'Gulf Coast' },
  { id: '8729840', name: 'Pensacola, FL', lat: 30.40, lon: -87.21, region: 'Gulf Coast' },
  { id: '8735180', name: 'Dauphin Island, AL', lat: 30.25, lon: -88.07, region: 'Gulf Coast' },
  { id: '8741533', name: 'Bay Waveland, MS', lat: 30.33, lon: -89.32, region: 'Gulf Coast' },
  { id: '8747437', name: 'Bay St. Louis, MS', lat: 30.32, lon: -89.33, region: 'Gulf Coast' },
  { id: '8760922', name: 'Pilots Station East, LA', lat: 28.93, lon: -89.41, region: 'Gulf Coast' },
  { id: '8761724', name: 'Grand Isle, LA', lat: 29.26, lon: -89.96, region: 'Gulf Coast' },
  { id: '8764044', name: 'Berwick, LA', lat: 29.67, lon: -91.24, region: 'Gulf Coast' },
  { id: '8771341', name: 'Galveston Pier 21, TX', lat: 29.31, lon: -94.79, region: 'Gulf Coast' },
  { id: '8771450', name: 'Galveston Pleasure Pier, TX', lat: 29.29, lon: -94.79, region: 'Gulf Coast' },
  { id: '8773037', name: 'Port Lavaca, TX', lat: 28.64, lon: -96.61, region: 'Gulf Coast' },
  { id: '8775870', name: 'Corpus Christi, TX', lat: 27.83, lon: -97.07, region: 'Gulf Coast' },
  { id: '8779770', name: 'Port Isabel, TX', lat: 26.06, lon: -97.22, region: 'Gulf Coast' },

  // West Coast - California
  { id: '9410230', name: 'La Jolla, CA', lat: 32.87, lon: -117.26, region: 'West Coast' },
  { id: '9410660', name: 'Los Angeles, CA', lat: 33.72, lon: -118.27, region: 'West Coast' },
  { id: '9411340', name: 'Santa Barbara, CA', lat: 34.40, lon: -119.69, region: 'West Coast' },
  { id: '9412110', name: 'Port San Luis, CA', lat: 35.17, lon: -120.75, region: 'West Coast' },
  { id: '9413450', name: 'Monterey, CA', lat: 36.61, lon: -121.89, region: 'West Coast' },
  { id: '9414290', name: 'San Francisco, CA', lat: 37.81, lon: -122.47, region: 'West Coast' },
  { id: '9414750', name: 'Alameda, CA', lat: 37.77, lon: -122.30, region: 'West Coast' },
  { id: '9415020', name: 'Point Reyes, CA', lat: 37.99, lon: -122.98, region: 'West Coast' },
  { id: '9416841', name: 'Arena Cove, CA', lat: 38.91, lon: -123.71, region: 'West Coast' },
  { id: '9418767', name: 'North Spit, CA', lat: 40.77, lon: -124.22, region: 'West Coast' },

  // West Coast - Oregon & Washington
  { id: '9431647', name: 'Port Orford, OR', lat: 42.74, lon: -124.50, region: 'Pacific Northwest' },
  { id: '9432780', name: 'Charleston, OR', lat: 43.35, lon: -124.32, region: 'Pacific Northwest' },
  { id: '9435380', name: 'South Beach, OR', lat: 44.63, lon: -124.05, region: 'Pacific Northwest' },
  { id: '9437540', name: 'Garibaldi, OR', lat: 45.56, lon: -123.92, region: 'Pacific Northwest' },
  { id: '9439040', name: 'Astoria, OR', lat: 46.21, lon: -123.77, region: 'Pacific Northwest' },
  { id: '9440422', name: 'Longview, WA', lat: 46.11, lon: -122.95, region: 'Pacific Northwest' },
  { id: '9441102', name: 'Westport, WA', lat: 46.90, lon: -124.11, region: 'Pacific Northwest' },
  { id: '9442396', name: 'La Push, WA', lat: 47.91, lon: -124.64, region: 'Pacific Northwest' },
  { id: '9444090', name: 'Port Angeles, WA', lat: 48.12, lon: -123.44, region: 'Pacific Northwest' },
  { id: '9447130', name: 'Seattle, WA', lat: 47.60, lon: -122.34, region: 'Pacific Northwest' },
  { id: '9449880', name: 'Friday Harbor, WA', lat: 48.55, lon: -123.01, region: 'Pacific Northwest' },

  // Alaska
  { id: '9451600', name: 'Ketchikan, AK', lat: 55.33, lon: -131.63, region: 'Alaska' },
  { id: '9452210', name: 'Juneau, AK', lat: 58.30, lon: -134.41, region: 'Alaska' },
  { id: '9454050', name: 'Cordova, AK', lat: 60.56, lon: -145.76, region: 'Alaska' },
  { id: '9455090', name: 'Seward, AK', lat: 60.12, lon: -149.43, region: 'Alaska' },
  { id: '9455920', name: 'Anchorage, AK', lat: 61.24, lon: -149.89, region: 'Alaska' },
  { id: '9459450', name: 'Sand Point, AK', lat: 55.34, lon: -160.50, region: 'Alaska' },
  { id: '9462450', name: 'Nikolski, AK', lat: 52.94, lon: -168.87, region: 'Alaska' },
  { id: '9468756', name: 'Nome, AK', lat: 64.50, lon: -165.44, region: 'Alaska' },

  // Hawaii
  { id: '1612340', name: 'Honolulu, HI', lat: 21.31, lon: -157.86, region: 'Hawaii' },
  { id: '1612480', name: 'Mokuoloe, HI', lat: 21.43, lon: -157.79, region: 'Hawaii' },
  { id: '1615680', name: 'Kahului, HI', lat: 20.90, lon: -156.47, region: 'Hawaii' },
  { id: '1617433', name: 'Kawaihae, HI', lat: 20.04, lon: -155.83, region: 'Hawaii' },
  { id: '1619910', name: 'Sand Island, HI', lat: 28.21, lon: -177.36, region: 'Hawaii' },

  // Great Lakes
  { id: '9044020', name: 'Huron, OH (Lake Erie)', lat: 41.40, lon: -82.54, region: 'Great Lakes' },
  { id: '9063012', name: 'Oswego, NY (Lake Ontario)', lat: 43.46, lon: -76.51, region: 'Great Lakes' },
  { id: '9063038', name: 'Rochester, NY (Lake Ontario)', lat: 43.25, lon: -77.61, region: 'Great Lakes' },
  { id: '9063053', name: 'Olcott, NY (Lake Ontario)', lat: 43.34, lon: -78.72, region: 'Great Lakes' },
  { id: '9075014', name: 'Cheboygan, MI (Lake Huron)', lat: 45.65, lon: -84.48, region: 'Great Lakes' },
  { id: '9076024', name: 'Ludington, MI (Lake Michigan)', lat: 43.95, lon: -86.45, region: 'Great Lakes' },
  { id: '9087023', name: 'Milwaukee, WI (Lake Michigan)', lat: 43.02, lon: -87.90, region: 'Great Lakes' },
  { id: '9087031', name: 'Calumet Harbor, IL (Lake Michigan)', lat: 41.73, lon: -87.54, region: 'Great Lakes' },
  { id: '9099004', name: 'Duluth, MN (Lake Superior)', lat: 46.77, lon: -92.09, region: 'Great Lakes' },
];

const REGIONS = ['New England', 'Mid-Atlantic', 'Southeast Atlantic', 'Gulf Coast', 'West Coast', 'Pacific Northwest', 'Alaska', 'Hawaii', 'Great Lakes'];

// ─── Find nearest buoy using latitude-corrected Euclidean distance ──────────
function findClosestBuoy(lat: number, lng: number, buoys: Buoy[]): Buoy {
  let closest = buoys[0];
  let minDist = Infinity;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (const b of buoys) {
    const dLat = b.lat - lat;
    const dLon = (b.lon - lng) * cosLat;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDist) {
      minDist = dist;
      closest = b;
    }
  }
  return closest;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [buoy, setBuoy] = useState<Buoy>(ALL_BUOYS[0]);
  const [obs, setObs] = useState<Obs | null>(null);
  const [recentPres, setRecentPres] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('F');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [windData, setWindData] = useState<WindData | null>(null);
  const [tideData, setTideData] = useState<TideData[]>([]);
  const [moonPhase, setMoonPhase] = useState<MoonPhase | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(false);

  const mounted = useRef(true);

  // ── Auto-select closest buoy on mount ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return; // stays on default buoy
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const nearest = findClosestBuoy(
          loc.coords.latitude,
          loc.coords.longitude,
          ALL_BUOYS
        );
        setBuoy(nearest);
      } catch (e) {
        console.warn('Could not get location for buoy selection:', e);
        // Falls through — keeps the default Portland, ME buoy
      }
    })();
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadAllData();
    const id = setInterval(() => loadAllData(), 300_000);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [buoy.id]);

  const celsiusToFahrenheit = (c: number): number => (c * 9 / 5) + 32;

  const formatTemp = (celsius: number | null | undefined): string => {
    if (celsius == null) return '--';
    const temp = tempUnit === 'F' ? celsiusToFahrenheit(celsius) : celsius;
    return `${Math.round(temp)}°${tempUnit}`;
  };

  async function loadAllData() {
    await Promise.all([loadBuoy(buoy.id), loadMarineConditions()]);
  }

  async function loadBuoy(stationId: string) {
    try {
      setLoading(true);
      setError('');
      const baseUrl = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
      const products = [
        { product: 'water_temperature' },
        { product: 'air_temperature' },
        { product: 'air_pressure' },
        { product: 'wind' },
      ];

      const result: any = { time: new Date().toISOString(), water_temp_c: null, air_temp_c: null, pressure_hpa: null };

      for (const { product } of products) {
        try {
          const url = `${baseUrl}?date=latest&station=${stationId}&product=${product}&units=metric&time_zone=gmt&application=catch_connect&format=json`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              const latest = data.data[data.data.length - 1];
              if (product === 'water_temperature' && latest.v) result.water_temp_c = parseFloat(latest.v);
              else if (product === 'air_temperature' && latest.v) result.air_temp_c = parseFloat(latest.v);
              else if (product === 'air_pressure' && latest.v) result.pressure_hpa = parseFloat(latest.v);
              else if (product === 'wind' && latest.s && latest.d) {
                setWindData({
                  speed: Math.round(parseFloat(latest.s) * 2.237),
                  direction: parseFloat(latest.d),
                  gust: latest.g ? Math.round(parseFloat(latest.g) * 2.237) : undefined,
                });
              }
            }
          }
        } catch { /* individual product failures are silent */ }
      }

      if (!mounted.current) return;
      if (result.water_temp_c === null && result.air_temp_c === null && result.pressure_hpa === null) {
        throw new Error('No data available from this station');
      }

      setObs({ time: result.time, wtmpC: result.water_temp_c, atmpC: result.air_temp_c, presHpa: result.pressure_hpa });
      if (result.pressure_hpa) setRecentPres(prev => [...prev.slice(-9), result.pressure_hpa].filter(Boolean));
    } catch (e: any) {
      if (!mounted.current) return;
      setError('Unable to connect to weather station — try another location');
      setObs(null);
    } finally {
      mounted.current && setLoading(false);
    }
  }

  async function loadMarineConditions() {
    try {
      setConditionsLoading(true);
      await loadTidePredictions(buoy.id);
      setMoonPhase(calculateMoonPhase());
    } catch { /* silent */ } finally {
      setConditionsLoading(false);
    }
  }

  async function loadTidePredictions(stationId: string) {
    try {
      const now = new Date();
      const beginDate = formatNoaaDate(now);
      const endDate = formatNoaaDate(new Date(now.getTime() + 48 * 60 * 60 * 1000));
      const url =
        `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
        `?begin_date=${beginDate}&end_date=${endDate}` +
        `&station=${stationId}&product=predictions&datum=MLLW` +
        `&interval=hilo&units=english&time_zone=lst_ldt&application=catch_connect&format=json`;

      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();

      if (data.predictions?.length > 0) {
        const upcoming = data.predictions
          .map((p: { t: string; v: string; type: string }) => ({
            time: new Date(p.t.replace(' ', 'T')).toISOString(),
            height: parseFloat(p.v),
            type: p.type === 'H' ? 'high' as const : 'low' as const,
          }))
          .filter((t: TideData) => new Date(t.time) >= now);
        if (mounted.current) setTideData(upcoming.slice(0, 6));
      }
    } catch { /* silent */ }
  }

  function formatNoaaDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}${m}${d} ${h}:${min}`;
  }

  function calculateMoonPhase(): MoonPhase {
    const now = new Date();
    const knownNewMoon = new Date('2024-01-11');
    const synodicMonth = 29.53058867;
    const daysSince = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const cyclePos = daysSince % synodicMonth;
    const age = Math.floor(cyclePos);

    let phase = '', illumination = 0;
    if (age < 1) { phase = 'New Moon'; illumination = 0; }
    else if (age < 7) { phase = 'Waxing Crescent'; illumination = age / 14; }
    else if (age < 9) { phase = 'First Quarter'; illumination = 0.5; }
    else if (age < 14) { phase = 'Waxing Gibbous'; illumination = ((age - 7) / 7) * 0.5 + 0.5; }
    else if (age < 16) { phase = 'Full Moon'; illumination = 1; }
    else if (age < 22) { phase = 'Waning Gibbous'; illumination = 1 - ((age - 15) / 7) * 0.5; }
    else if (age < 24) { phase = 'Last Quarter'; illumination = 0.5; }
    else { phase = 'Waning Crescent'; illumination = 0.5 - ((age - 22) / 7) * 0.5; }

    const daysToNextNew = synodicMonth - cyclePos;
    const daysToNextFull = age < 15 ? 15 - age : synodicMonth - age + 15;

    return {
      phase,
      illumination: Math.round(illumination * 100) / 100,
      age,
      nextNew: new Date(now.getTime() + daysToNextNew * 86400000).toISOString(),
      nextFull: new Date(now.getTime() + daysToNextFull * 86400000).toISOString(),
    };
  }

  function getWindDirection(degrees: number): string {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(degrees / 22.5) % 16];
  }

  function getFishingConditions(): { score: string; color: string; reason: string } {
    let score = 0;
    const reasons: string[] = [];
    if (obs?.presHpa) {
      if (obs.presHpa > 1020) { score += 1; reasons.push('High pressure'); }
      else if (obs.presHpa < 1000) { score -= 1; reasons.push('Low pressure'); }
    }
    if (windData) {
      if (windData.speed < 10) { score += 1; reasons.push('Light winds'); }
      else if (windData.speed > 20) { score -= 1; reasons.push('Strong winds'); }
    }
    if (moonPhase) {
      if (moonPhase.phase === 'New Moon' || moonPhase.phase === 'Full Moon') { score += 1; reasons.push('Major lunar phase'); }
      else if (moonPhase.phase === 'First Quarter' || moonPhase.phase === 'Last Quarter') { score += 0.5; reasons.push('Minor lunar phase'); }
    }
    if (tideData[0]?.type === 'high') { score += 0.5; reasons.push('Incoming high tide'); }

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

  // Filtered buoys for picker search
  const filteredBuoys = useMemo(() => {
    if (!searchQuery.trim()) return ALL_BUOYS;
    const q = searchQuery.toLowerCase();
    return ALL_BUOYS.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.id.includes(q) ||
      b.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Group filtered buoys by region
  const groupedBuoys = useMemo(() => {
    const groups: { region: string; buoys: Buoy[] }[] = [];
    const regionOrder = searchQuery.trim()
      ? [...new Set(filteredBuoys.map(b => b.region))]
      : REGIONS;

    for (const region of regionOrder) {
      const regionBuoys = filteredBuoys.filter(b => b.region === region);
      if (regionBuoys.length > 0) groups.push({ region, buoys: regionBuoys });
    }
    return groups;
  }, [filteredBuoys, searchQuery]);

  const airC = obs?.atmpC ?? null;
  const waterC = obs?.wtmpC ?? null;
  const pres = obs?.presHpa ?? null;
  const conditions = getFishingConditions();

  // Flatten grouped buoys for FlatList with section headers
  type ListItem = { type: 'header'; region: string } | { type: 'buoy'; buoy: Buoy };
  const flatListData: ListItem[] = useMemo(() => {
    const items: ListItem[] = [];
    for (const group of groupedBuoys) {
      items.push({ type: 'header', region: group.region });
      for (const b of group.buoys) items.push({ type: 'buoy', buoy: b });
    }
    return items;
  }, [groupedBuoys]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <View style={styles.headerButtons}>
          <Pressable style={styles.buoyButton} onPress={() => setPickerOpen(true)}>
            <View style={styles.buoyDot} />
            <View>
              <Text style={styles.buoyName}>{buoy.name}</Text>
              <Text style={styles.buoyId}>Station {buoy.id}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.tempToggle}
            onPress={() => setTempUnit(prev => prev === 'C' ? 'F' : 'C')}
          >
            <Text style={styles.tempToggleText}>°{tempUnit}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Fishing Conditions Card */}
        <View style={styles.forecastSection}>
          <View style={[styles.forecastCard, { borderLeftColor: conditions.color }]}>
            <View style={styles.forecastHeader}>
              <Text style={[styles.forecastScore, { color: conditions.color }]}>
                {conditions.score.toUpperCase()}
              </Text>
              <View style={[styles.conditionDot, { backgroundColor: conditions.color }]} />
            </View>
            <Text style={styles.forecastReason}>{conditions.reason || 'Calculating conditions…'}</Text>
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
          <DataCard title="BAROMETRIC PRESSURE">
            {loading && !pres ? <ActivityIndicator color={FishingTheme.colors.darkGreen} /> : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{pres != null ? pres.toFixed(1) : '—'}</Text>
                  <Text style={styles.unit}>hPa</Text>
                </View>
                <View style={[styles.badge, pressureTrend.color === 'up' ? styles.badgeUp : pressureTrend.color === 'down' ? styles.badgeDown : styles.badgeFlat]}>
                  <Text style={styles.badgeText}>{pressureTrend.icon} {pressureTrend.label.toUpperCase()}</Text>
                </View>
                <Text style={styles.timestamp}>
                  {obs?.time ? `Updated ${new Date(obs.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting update'}
                </Text>
              </>
            )}
          </DataCard>

          <DataCard title="WIND CONDITIONS">
            {conditionsLoading && !windData ? <ActivityIndicator color={FishingTheme.colors.darkGreen} /> : (
              <>
                <View style={styles.valueRow}>
                  <Text style={styles.bigValue}>{windData?.speed ?? '—'}</Text>
                  <Text style={styles.unit}>mph</Text>
                </View>
                <Text style={styles.windDirection}>
                  {windData ? `${getWindDirection(windData.direction)} (${windData.direction}°)` : 'Direction unavailable'}
                </Text>
                {windData?.gust && <Text style={styles.timestamp}>Gusts to {windData.gust} mph</Text>}
              </>
            )}
          </DataCard>

          <DataCard title="MOON PHASE">
            {!moonPhase ? <ActivityIndicator color={FishingTheme.colors.darkGreen} /> : (
              <>
                <Text style={styles.moonPhase}>{moonPhase.phase.toUpperCase()}</Text>
                <Text style={styles.moonDetails}>{Math.round(moonPhase.illumination * 100)}% illuminated</Text>
                <Text style={styles.moonDetails}>{moonPhase.age} days into cycle</Text>
                <Text style={styles.timestamp}>Next full: {new Date(moonPhase.nextFull).toLocaleDateString()}</Text>
              </>
            )}
          </DataCard>

          <DataCard title="AIR TEMPERATURE">
            {loading && airC == null ? <ActivityIndicator color={FishingTheme.colors.darkGreen} /> : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <Text style={styles.bigValue}>{formatTemp(airC)}</Text>
            )}
          </DataCard>

          <DataCard title="WATER TEMPERATURE">
            {loading && waterC == null ? <ActivityIndicator color={FishingTheme.colors.darkGreen} /> : error ? (
              <Text style={styles.unavailableText}>Data unavailable</Text>
            ) : (
              <Text style={styles.bigValue}>{formatTemp(waterC)}</Text>
            )}
          </DataCard>
        </View>

        {/* Tide Schedule */}
        <View style={styles.tideSection}>
          <Text style={styles.sectionLabel}>TIDE SCHEDULE</Text>
          {tideData.length === 0 ? (
            <View style={styles.loadingCard}><ActivityIndicator color={FishingTheme.colors.darkGreen} /></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tideScroll}>
              {tideData.slice(0, 4).map((tide, index) => (
                <View key={index} style={styles.tideCard}>
                  <View style={styles.tideHeader}>
                    <Text style={styles.tideType}>{tide.type === 'high' ? 'HIGH' : 'LOW'}</Text>
                    <Text style={styles.tideHeight}>{tide.height.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.tideUnit}>feet</Text>
                  <View style={styles.tideDivider} />
                  <Text style={styles.tideTime}>{new Date(tide.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={styles.tideDate}>{new Date(tide.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Buoy Picker Modal */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <KeyboardAvoidingView behavior="height" style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT STATION</Text>
              <CloseButton onPress={() => { setPickerOpen(false); setSearchQuery(''); }} iconName="chevron-down" />
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by city, state, or region…"
                placeholderTextColor={FishingTheme.colors.text.muted}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={flatListData}
              keyExtractor={(item, index) =>
                item.type === 'header' ? `header-${item.region}` : `buoy-${item.buoy.id}-${index}`
              }
              renderItem={({ item }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.regionHeader}>
                      <Text style={styles.regionHeaderText}>{item.region.toUpperCase()}</Text>
                    </View>
                  );
                }
                const isSelected = item.buoy.id === buoy.id;
                return (
                  <Pressable
                    onPress={() => {
                      setBuoy(item.buoy);
                      setPickerOpen(false);
                      setSearchQuery('');
                    }}
                    style={({ pressed }) => [styles.modalItem, pressed && styles.modalItemPressed, isSelected && styles.modalItemSelected]}
                  >
                    <View style={styles.modalItemContent}>
                      <View style={[styles.modalDot, isSelected && styles.modalDotSelected]} />
                      <View style={styles.modalItemText}>
                        <Text style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}>
                          {item.buoy.name}
                        </Text>
                        <Text style={styles.modalItemDetail}>
                          Station {item.buoy.id} • {item.buoy.lat.toFixed(2)}°, {item.buoy.lon.toFixed(2)}°
                        </Text>
                      </View>
                      {isSelected && <Text style={styles.selectedCheckmark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: FishingTheme.colors.background },
  header: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingBottom: FishingTheme.spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: FishingTheme.colors.border,
  },
  headerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
    flex: 1,
    marginRight: 10,
  },
  buoyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FishingTheme.colors.darkGreen },
  buoyName: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.text.primary },
  buoyId: { fontSize: 10, color: FishingTheme.colors.text.tertiary, marginTop: 1 },
  tempToggle: {
    backgroundColor: FishingTheme.colors.darkGreen,
    borderRadius: FishingTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: FishingTheme.colors.forestGreen,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempToggleText: { fontSize: 14, fontWeight: '800', color: FishingTheme.colors.cream },

  // Forecast
  forecastSection: { paddingHorizontal: FishingTheme.spacing.xl, paddingTop: FishingTheme.spacing.xl },
  forecastCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    padding: FishingTheme.spacing.lg,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    borderLeftWidth: 6,
  },
  forecastHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  forecastScore: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  conditionDot: { width: 12, height: 12, borderRadius: 6 },
  forecastReason: { fontSize: 14, color: FishingTheme.colors.text.secondary, lineHeight: 20, fontWeight: '500' },

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
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  errorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: FishingTheme.colors.status.poor },
  errorTitle: { fontSize: 12, fontWeight: '700', color: FishingTheme.colors.status.poor, letterSpacing: 0.5 },
  errorText: { fontSize: 14, color: FishingTheme.colors.text.secondary, marginBottom: 12 },
  retryButton: { backgroundColor: FishingTheme.colors.darkGreen, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  retryText: { color: FishingTheme.colors.cream, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Data Grid
  dataGrid: { paddingHorizontal: FishingTheme.spacing.xl, paddingTop: FishingTheme.spacing.xl, gap: FishingTheme.spacing.md },
  dataCard: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
    overflow: 'hidden',
  },
  dataCardTitle: {
    fontSize: 11, fontWeight: '700', color: FishingTheme.colors.cream,
    backgroundColor: FishingTheme.colors.darkGreen,
    paddingHorizontal: FishingTheme.spacing.lg, paddingVertical: FishingTheme.spacing.sm, letterSpacing: 1,
  },
  dataCardContent: { padding: FishingTheme.spacing.lg },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  bigValue: { fontSize: 36, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: -1 },
  unit: { fontSize: 16, color: FishingTheme.colors.text.tertiary, marginLeft: 6, marginBottom: 6, fontWeight: '600' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginTop: 4 },
  badgeUp: { backgroundColor: FishingTheme.colors.darkGreen },
  badgeDown: { backgroundColor: FishingTheme.colors.status.poor },
  badgeFlat: { backgroundColor: FishingTheme.colors.sageGreen },
  badgeText: { color: FishingTheme.colors.cream, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  timestamp: { fontSize: 11, color: FishingTheme.colors.text.muted, marginTop: 8 },
  windDirection: { fontSize: 16, fontWeight: '700', color: FishingTheme.colors.text.primary, marginBottom: 4 },
  moonPhase: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen, marginBottom: 8, letterSpacing: 0.5 },
  moonDetails: { fontSize: 13, color: FishingTheme.colors.text.secondary, marginBottom: 4 },
  unavailableText: { fontSize: 13, color: FishingTheme.colors.text.muted, fontStyle: 'italic' },
  sectionLabel: {
    fontSize: FishingTheme.typography.sizes.xs, fontWeight: FishingTheme.typography.weights.bold,
    color: FishingTheme.colors.text.tertiary, letterSpacing: 1, marginBottom: FishingTheme.spacing.md,
  },

  // Tides
  tideSection: { paddingLeft: FishingTheme.spacing.xl, paddingTop: FishingTheme.spacing.xl, paddingBottom: FishingTheme.spacing.lg },
  tideScroll: { paddingRight: FishingTheme.spacing.xl, gap: FishingTheme.spacing.md },
  tideCard: {
    backgroundColor: FishingTheme.colors.card, borderRadius: FishingTheme.borderRadius.md,
    padding: FishingTheme.spacing.lg, borderWidth: 2, borderColor: FishingTheme.colors.border, width: 120,
  },
  tideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 2 },
  tideType: { fontSize: 11, fontWeight: '700', color: FishingTheme.colors.darkGreen, letterSpacing: 0.5 },
  tideHeight: { fontSize: 24, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: -0.5 },
  tideUnit: { fontSize: 10, color: FishingTheme.colors.text.tertiary, marginBottom: 8 },
  tideDivider: { height: 1, backgroundColor: FishingTheme.colors.border, marginVertical: 8 },
  tideTime: { fontSize: 15, fontWeight: '700', color: FishingTheme.colors.text.primary, marginBottom: 2 },
  tideDate: { fontSize: 11, color: FishingTheme.colors.text.tertiary },
  loadingCard: {
    backgroundColor: FishingTheme.colors.card, borderRadius: FishingTheme.borderRadius.md,
    padding: 40, borderWidth: 2, borderColor: FishingTheme.colors.border, alignItems: 'center',
  },

  // Picker Modal
  modalBackdrop: { flex: 1, backgroundColor: FishingTheme.colors.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: FishingTheme.colors.cream,
    borderTopLeftRadius: FishingTheme.borderRadius.xl,
    borderTopRightRadius: FishingTheme.borderRadius.xl,
    paddingTop: FishingTheme.spacing.xl,
    paddingBottom: 40,
    maxHeight: '85%',
    borderTopWidth: 3,
    borderColor: FishingTheme.colors.darkGreen,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: FishingTheme.spacing.xl, marginBottom: FishingTheme.spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 1 },
  searchContainer: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingBottom: FishingTheme.spacing.md,
  },
  searchInput: {
    backgroundColor: FishingTheme.colors.card,
    borderRadius: FishingTheme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: FishingTheme.colors.text.primary,
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  regionHeader: {
    paddingHorizontal: FishingTheme.spacing.xl,
    paddingVertical: 8,
    backgroundColor: FishingTheme.colors.tan,
    borderBottomWidth: 1,
    borderBottomColor: FishingTheme.colors.border,
  },
  regionHeaderText: {
    fontSize: 10, fontWeight: '800', color: FishingTheme.colors.darkGreen, letterSpacing: 1.5,
  },
  modalItem: { paddingHorizontal: FishingTheme.spacing.xl, paddingVertical: FishingTheme.spacing.md },
  modalItemPressed: { backgroundColor: FishingTheme.colors.tan },
  modalItemSelected: { backgroundColor: 'rgba(47, 69, 56, 0.06)' },
  modalItemContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: FishingTheme.colors.sageGreen },
  modalDotSelected: { backgroundColor: FishingTheme.colors.darkGreen },
  modalItemText: { flex: 1 },
  modalItemName: { fontSize: 15, fontWeight: '700', color: FishingTheme.colors.darkGreen, marginBottom: 2 },
  modalItemNameSelected: { color: FishingTheme.colors.darkGreen },
  modalItemDetail: { fontSize: 11, color: FishingTheme.colors.text.tertiary },
  selectedCheckmark: { fontSize: 16, fontWeight: '800', color: FishingTheme.colors.darkGreen },
});
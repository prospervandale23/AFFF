// lib/noaa.ts - Add this new file to your project

/**
 * Fetch real-time buoy data from NOAA NDBC
 * Returns latest observation from a buoy station
 */
export async function fetchBuoyData(stationId: string) {
  try {
    const url = `https://www.ndbc.noaa.gov/data/realtime2/${stationId}.txt`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Parse NDBC format (space-delimited)
    const lines = text.trim().split('\n');
    if (lines.length < 3) throw new Error('Invalid buoy data');
    
    const headers = lines[0].split(/\s+/);
    const units = lines[1].split(/\s+/);
    const latestData = lines[2].split(/\s+/);
    
    // Map columns (typical NDBC format)
    const data: any = {};
    headers.forEach((header, i) => {
      data[header] = latestData[i];
    });
    
    // Build timestamp
    const year = data['#YY'] || data['YY'];
    const month = data['MM'];
    const day = data['DD'];
    const hour = data['hh'];
    const minute = data['mm'];
    const timeString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00Z`;
    
    return {
      time: timeString,
      water_temp_c: parseFloat(data['WTMP']) || undefined,
      air_temp_c: parseFloat(data['ATMP']) || undefined,
      pressure_hpa: parseFloat(data['PRES']) || undefined,
      wind_speed_mps: parseFloat(data['WSPD']) || undefined,
      wind_direction: parseFloat(data['WDIR']) || undefined,
      wind_gust_mps: parseFloat(data['GST']) || undefined,
    };
  } catch (error) {
    console.error('Error fetching buoy data:', error);
    throw error;
  }
}

/**
 * Fetch tide predictions from NOAA Tides & Currents API
 * Returns next 24 hours of tide predictions
 */
export async function fetchTideData(stationId: string = '8443970') {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const beginDate = today.toISOString().split('T')[0].replace(/-/g, '');
    const endDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
    
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?` +
      `product=predictions&application=FishingBuddy&` +
      `begin_date=${beginDate}&end_date=${endDate}&` +
      `datum=MLLW&station=${stationId}&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
    
    const response = await fetch(url);
    const json = await response.json();
    
    if (!json.predictions) throw new Error('No tide data available');
    
    return json.predictions.map((pred: any) => ({
      time: pred.t,
      height: parseFloat(pred.v),
      type: pred.type, // 'H' or 'L'
    }));
  } catch (error) {
    console.error('Error fetching tide data:', error);
    throw error;
  }
}

/**
 * Fetch marine forecast from NOAA National Weather Service
 * Returns wind forecast for the next few days
 */
export async function fetchMarineForecast(lat: number, lon: number) {
  try {
    // Step 1: Get the forecast grid endpoint for this location
    const pointUrl = `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    const pointResponse = await fetch(pointUrl, {
      headers: { 'User-Agent': '(FishingBuddyApp, contact@fishingbuddy.app)' }
    });
    const pointData = await pointResponse.json();
    
    if (!pointData.properties?.forecast) throw new Error('No forecast available');
    
    // Step 2: Get the actual forecast
    const forecastUrl = pointData.properties.forecast;
    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': '(FishingBuddyApp, contact@fishingbuddy.app)' }
    });
    const forecastData = await forecastResponse.json();
    
    // Extract periods (each is ~12 hours)
    const periods = forecastData.properties?.periods || [];
    
    return periods.slice(0, 7).map((period: any) => ({
      name: period.name, // "Tonight", "Wednesday", etc
      startTime: period.startTime,
      temperature: period.temperature,
      windSpeed: period.windSpeed, // e.g., "10 to 15 mph"
      windDirection: period.windDirection, // e.g., "SW"
      shortForecast: period.shortForecast,
      detailedForecast: period.detailedForecast,
    }));
  } catch (error) {
    console.error('Error fetching marine forecast:', error);
    throw error;
  }
}

/**
 * Calculate fishing score based on conditions
 * Returns score 0-100 and reasons
 */
export function calculateFishingScore(params: {
  pressure?: number;
  windSpeed?: number;
  moonPhase?: string;
  tideType?: 'H' | 'L';
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night';
}) {
  let score = 50; // Start neutral
  const reasons: string[] = [];
  
  // Barometric pressure (best: 1010-1020 hPa)
  if (params.pressure) {
    if (params.pressure >= 1015 && params.pressure <= 1020) {
      score += 15;
      reasons.push('Ideal pressure');
    } else if (params.pressure > 1020) {
      score += 5;
      reasons.push('High pressure');
    } else if (params.pressure < 1000) {
      score -= 10;
      reasons.push('Low pressure');
    }
  }
  
  // Wind (best: 5-10 mph)
  if (params.windSpeed !== undefined) {
    if (params.windSpeed < 5) {
      score += 10;
      reasons.push('Calm winds');
    } else if (params.windSpeed <= 10) {
      score += 15;
      reasons.push('Perfect wind');
    } else if (params.windSpeed > 20) {
      score -= 15;
      reasons.push('Strong winds');
    }
  }
  
  // Moon phase (best: new/full)
  if (params.moonPhase) {
    if (params.moonPhase === 'New Moon' || params.moonPhase === 'Full Moon') {
      score += 15;
      reasons.push('Major lunar phase');
    } else if (params.moonPhase.includes('Quarter')) {
      score += 8;
      reasons.push('Minor lunar phase');
    }
  }
  
  // Tide (incoming high = good)
  if (params.tideType === 'H') {
    score += 10;
    reasons.push('High tide incoming');
  }
  
  // Time of day (dawn/dusk best)
  if (params.timeOfDay === 'dawn' || params.timeOfDay === 'dusk') {
    score += 10;
    reasons.push('Prime feeding time');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Rating
  let rating = 'Fair';
  let color = '#FFB84D';
  if (score >= 80) { rating = 'Excellent'; color = '#72E5A2'; }
  else if (score >= 65) { rating = 'Good'; color = '#90EE90'; }
  else if (score < 40) { rating = 'Poor'; color = '#FF8A8A'; }
  
  return { score, rating, color, reasons };
}

/**
 * Calculate moon phase (simple algorithm)
 */
export function calculateMoonPhase() {
  const now = new Date();
  
  // Known new moon reference
  const knownNewMoon = new Date('2024-01-11');
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

// Helper to convert meters per second to mph
export function mpsToMph(mps: number): number {
  return Math.round(mps * 2.237);
}

// Helper to get wind direction name
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
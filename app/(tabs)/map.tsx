import { useFishing } from '@/contexts/FishingContext';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Sample fishing spots with depth data
const sampleFishingSpots = [
  {
    id: '1',
    name: 'Point Judith Harbor',
    coordinates: { latitude: 41.3845, longitude: -71.4814 },
    type: 'saltwater',
    species: ['Striped Bass', 'Fluke', 'Scup'],
    description: 'Popular saltwater fishing spot',
    depth: 25,
    bottomType: 'Rocky',
    distance: '2.3 miles'
  },
  {
    id: '2',
    name: 'Worden Pond',
    coordinates: { latitude: 41.4234, longitude: -71.6245 },
    type: 'freshwater',
    species: ['Bass', 'Pike', 'Perch'],
    description: 'Great freshwater bass fishing',
    depth: 18,
    bottomType: 'Weedy',
    distance: '5.1 miles'
  },
  {
    id: '3',
    name: 'Newport Harbor',
    coordinates: { latitude: 41.4901, longitude: -71.3267 },
    type: 'saltwater',
    species: ['Striped Bass', 'Bluefish'],
    description: 'Excellent striped bass fishing',
    depth: 35,
    bottomType: 'Sandy',
    distance: '8.7 miles'
  },
  {
    id: '4',
    name: 'Scituate Reservoir',
    coordinates: { latitude: 41.8234, longitude: -71.5731 },
    type: 'freshwater',
    species: ['Trout', 'Bass'],
    description: 'Peaceful trout fishing',
    depth: 45,
    bottomType: 'Rocky',
    distance: '12.4 miles'
  }
];

export default function MapScreen() {
  const { fishingType } = useFishing();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access is needed to show fishing spots near you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const filteredSpots = fishingType 
    ? sampleFishingSpots.filter(spot => spot.type === fishingType)
    : sampleFishingSpots;

  const getDepthColor = (depth: number): string => {
    if (depth < 15) return '#4A90E2';
    if (depth < 30) return '#2ECC71';
    return '#E74C3C';
  };

  const getBottomTypeIcon = (bottomType: string): string => {
    switch (bottomType) {
      case 'Rocky': return '🪨';
      case 'Sandy': return '🏖️';
      case 'Weedy': return '🌱';
      default: return '🌊';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {fishingType === 'freshwater' ? '🏞️ Freshwater' : '🌊 Saltwater'} Fishing Map
        </Text>
        <Pressable style={styles.locationButton} onPress={getCurrentLocation}>
          <Text style={styles.locationButtonText}>📍 Refresh</Text>
        </Pressable>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapOverlay}>
          <Text style={styles.mapTitle}>Interactive Map</Text>
          <Text style={styles.mapSubtitle}>Coming in Next Update</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureText}>🗺️ Real-time navigation</Text>
            <Text style={styles.featureText}>📊 Bathymetric depth contours</Text>
            <Text style={styles.featureText}>🎣 Community fishing reports</Text>
            <Text style={styles.featureText}>📍 Precise GPS coordinates</Text>
          </View>
          {userLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Your Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Fishing Spots List */}
      <View style={styles.spotsContainer}>
        <Text style={styles.spotsTitle}>
          Nearby {fishingType === 'freshwater' ? 'Freshwater' : 'Saltwater'} Spots
        </Text>
        
        <ScrollView style={styles.spotsList} showsVerticalScrollIndicator={false}>
          {filteredSpots.map((spot) => (
            <View key={spot.id} style={styles.spotCard}>
              <View style={styles.spotHeader}>
                <View style={styles.spotNameRow}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <View style={[styles.depthBadge, { backgroundColor: getDepthColor(spot.depth) }]}>
                    <Text style={styles.depthText}>{spot.depth}ft</Text>
                  </View>
                </View>
                <Text style={styles.spotDistance}>{spot.distance}</Text>
              </View>
              
              <Text style={styles.spotDescription}>{spot.description}</Text>
              
              <View style={styles.spotDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bottom:</Text>
                  <Text style={styles.detailValue}>
                    {getBottomTypeIcon(spot.bottomType)} {spot.bottomType}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Species:</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {spot.species.join(' • ')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.spotActions}>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>🧭 Navigate</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>📊 Conditions</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>💬 Reports</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.infoText}>
          📍 {filteredSpots.length} {fishingType || 'fishing'} spots found
        </Text>
        <Text style={styles.infoSubtext}>
          Interactive mapping with Navionics integration coming soon
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E8ECF1',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0B1220',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E8ECF1',
    flex: 1,
  },
  locationButton: {
    backgroundColor: '#1A2440',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  locationButtonText: {
    color: '#72E5A2',
    fontSize: 12,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#121A2B',
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapOverlay: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E8ECF1',
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 16,
    color: '#72E5A2',
    marginBottom: 16,
  },
  featuresList: {
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#9BB0CC',
    textAlign: 'center',
  },
  locationInfo: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1A2440',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 10,
    color: '#AFC3E1',
    textAlign: 'center',
  },
  spotsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8ECF1',
    marginBottom: 12,
  },
  spotsList: {
    flex: 1,
  },
  spotCard: {
    backgroundColor: '#121A2B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2A44',
  },
  spotHeader: {
    marginBottom: 8,
  },
  spotNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8ECF1',
    flex: 1,
  },
  depthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  depthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  spotDistance: {
    fontSize: 12,
    color: '#72E5A2',
    fontWeight: '600',
  },
  spotDescription: {
    fontSize: 14,
    color: '#9BB0CC',
    marginBottom: 12,
  },
  spotDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#AFC3E1',
    fontWeight: '600',
    width: 60,
  },
  detailValue: {
    fontSize: 12,
    color: '#E8ECF1',
    flex: 1,
  },
  spotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1A2440',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3A63',
  },
  actionButtonText: {
    color: '#E9F2FF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomInfo: {
    backgroundColor: '#121A2B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E2A44',
  },
  infoText: {
    color: '#E8ECF1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoSubtext: {
    color: '#9BB0CC',
    fontSize: 11,
  },
});
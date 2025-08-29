import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map View</Text>
      <Text style={styles.subtitle}>Coming soon - Interactive map of fishing spots and buddies</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8ECF1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9BB0CC',
    textAlign: 'center',
  },
});
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { FishingTheme } from '../constants/FishingTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// Pre-built skeleton for the buddy card in feeds
export function BuddyCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      {/* Photo placeholder */}
      <Skeleton height={350} borderRadius={0} />

      {/* Overlay name area */}
      <View style={styles.overlaySkeleton}>
        <Skeleton width={180} height={28} borderRadius={6} style={styles.skeletonSpacing} />
        <Skeleton width={100} height={14} borderRadius={4} style={styles.skeletonSpacing} />
        <Skeleton width={140} height={16} borderRadius={4} />
      </View>

      {/* Details */}
      <View style={styles.detailsSkeleton}>
        <Skeleton width='90%' height={16} borderRadius={4} style={styles.skeletonSpacing} />
        <Skeleton width='70%' height={16} borderRadius={4} style={styles.skeletonSpacing} />
        <Skeleton width='80%' height={16} borderRadius={4} style={{ marginBottom: 24 }} />

        <Skeleton width={120} height={11} borderRadius={3} style={styles.skeletonSpacing} />
        <Skeleton width={160} height={15} borderRadius={4} style={{ marginBottom: 16 }} />

        <Skeleton width={140} height={11} borderRadius={3} style={styles.skeletonSpacing} />
        <Skeleton width={180} height={15} borderRadius={4} />
      </View>
    </View>
  );
}

// Pre-built skeleton for a chat image message
export function ChatImageSkeleton({ isOwn }: { isOwn: boolean }) {
  return (
    <View style={[styles.chatImageSkeleton, isOwn ? styles.chatImageOwn : styles.chatImageOther]}>
      <Skeleton width={200} height={200} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: FishingTheme.colors.border,
  },
  cardSkeleton: {
    flex: 1,
    backgroundColor: FishingTheme.colors.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: FishingTheme.colors.border,
  },
  overlaySkeleton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.42)',
    // Approximate height of the real overlay
    top: 263,
  },
  detailsSkeleton: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  skeletonSpacing: {
    marginBottom: 8,
  },
  chatImageSkeleton: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  chatImageOwn: {
    alignItems: 'flex-end',
  },
  chatImageOther: {
    alignItems: 'flex-start',
  },
});
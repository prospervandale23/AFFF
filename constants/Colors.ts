// constants/Colors.ts

const darkGreen = '#2F4538';
const mutedGreen = '#8B9B8E';
const tanBackground = '#E8DCC4';
const tanBorder = '#D4C4A8';
const creamText = '#F5EFE0';

export const Colors = {
  light: {
    text: darkGreen,
    background: tanBackground,
    tint: darkGreen, // The active icon color
    icon: mutedGreen,
    tabIconDefault: mutedGreen,
    tabIconSelected: darkGreen,
    border: tanBorder,
    badgeBackground: darkGreen,
    badgeText: creamText,
  },
  dark: {
    // If you decide to add a Night Mode for early morning fishing later
    text: creamText,
    background: darkGreen,
    tint: tanBackground,
    icon: mutedGreen,
    tabIconDefault: mutedGreen,
    tabIconSelected: tanBackground,
  },
};
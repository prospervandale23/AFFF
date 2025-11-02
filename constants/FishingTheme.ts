// constants/FishingTheme.ts

export const FishingTheme = {
  colors: {
    // Main colors
    tan: '#E8DCC4',
    cream: '#F5EFE0',
    darkGreen: '#2F4538',
    forestGreen: '#3D5A4C',
    sageGreen: '#5C7A6B',
    
    // Backgrounds
    background: '#E8DCC4',
    card: '#F5EFE0',
    cardBorder: '#D4C4A8',
    
    // Text
    text: {
      primary: '#2F4538',
      secondary: '#3D5A4C',
      tertiary: '#5C7A6B',
      muted: '#8B9B8E',
    },
    
    // Accents
    accent: '#3D5A4C',
    accentLight: '#5C7A6B',
    
    // Status
    status: {
      excellent: '#2F4538',
      good: '#5C7A6B',
      fair: '#8B7355',
      poor: '#9B6B5C',
    },
    
    // Functional
    border: '#D4C4A8',
    shadow: 'rgba(47, 69, 56, 0.15)',
    overlay: 'rgba(47, 69, 56, 0.8)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  
  typography: {
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      title: 24,
      display: 28,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#2F4538',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#2F4538',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#2F4538',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

export type Theme = typeof FishingTheme;
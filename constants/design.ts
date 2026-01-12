/**
 * Design System Constants for Socius Mobile
 * 
 * This file defines the visual language of the app including:
 * - Spacing scale
 * - Typography scale
 * - Color tokens
 * - Shadow presets
 * - Border radii
 * - Animation timings
 */

// ============== SPACING SCALE ==============
// Based on 4px base unit for consistent rhythm

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
} as const;

// ============== TYPOGRAPHY ==============

export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
} as const;

export const FONT_WEIGHT = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const LINE_HEIGHT = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
} as const;

// ============== BORDER RADIUS ==============

export const RADIUS = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
} as const;

// ============== SHADOWS ==============

export const SHADOWS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
} as const;

// ============== ANIMATION TIMINGS ==============

export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
} as const;

// ============== ICON SIZES ==============

export const ICON_SIZE = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

// ============== Z-INDEX LAYERS ==============

export const Z_INDEX = {
    background: -1,
    default: 0,
    dropdown: 10,
    sticky: 20,
    modal: 30,
    toast: 40,
    tooltip: 50,
} as const;

// ============== LIGHT THEME COLORS ==============

export const LIGHT_COLORS = {
    // Primary brand colors
    primary: '#1a73e8',
    primaryLight: '#4285f4',
    primaryDark: '#1557b0',

    // Accent colors
    accent: '#34a853',
    accentLight: '#81c995',
    accentDark: '#188038',

    // Semantic colors
    success: '#34a853',
    warning: '#fbbc04',
    error: '#d93025',
    info: '#4285f4',

    // Background colors
    background: '#f8f9fa',
    backgroundSecondary: '#ffffff',
    card: '#ffffff',

    // Text colors
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#ffffff',

    // Border colors
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    borderDark: '#c0c0c0',

    // Input colors
    inputBackground: '#f0f0f0',
    inputBorder: '#e0e0e0',
    inputPlaceholder: '#999999',

    // Button colors
    buttonText: '#ffffff',
    buttonSecondaryText: '#1a73e8',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// ============== DARK THEME COLORS ==============

export const DARK_COLORS = {
    // Primary brand colors
    primary: '#4285f4',
    primaryLight: '#8ab4f8',
    primaryDark: '#1a73e8',

    // Accent colors
    accent: '#81c995',
    accentLight: '#a8dab5',
    accentDark: '#34a853',

    // Semantic colors
    success: '#81c995',
    warning: '#fdd663',
    error: '#f28b82',
    info: '#8ab4f8',

    // Background colors
    background: '#121212',
    backgroundSecondary: '#1e1e1e',
    card: '#1e1e1e',

    // Text colors
    text: '#e8eaed',
    textSecondary: '#9aa0a6',
    textTertiary: '#5f6368',
    textInverse: '#1a1a1a',

    // Border colors
    border: '#3c4043',
    borderLight: '#5f6368',
    borderDark: '#2d2d2d',

    // Input colors
    inputBackground: '#2d2d2d',
    inputBorder: '#3c4043',
    inputPlaceholder: '#5f6368',

    // Button colors
    buttonText: '#1a1a1a',
    buttonSecondaryText: '#8ab4f8',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

// ============== GRADIENT PRESETS ==============

export const GRADIENTS = {
    primary: ['#1a73e8', '#4285f4'],
    accent: ['#34a853', '#81c995'],
    sunset: ['#ff6b6b', '#feca57'],
    ocean: ['#0093E9', '#80D0C7'],
    purple: ['#667eea', '#764ba2'],
    dark: ['#1e1e1e', '#2d2d2d'],
} as const;

// ============== ROOM COLORS (Home Screen) ==============

export const ROOM_COLORS_LIGHT = {
    wall: '#f5f5dc',
    floor: '#8b7355',
    woodPlank: '#a0826d',
    woodPlankDark: '#654321',
    doorFrame: '#fff',
    doorKnob: '#ffd700',
    doorPanel: '#f0f0f0',
    deskTop: '#8d6e63',
    deskLeg: '#5d4037',
    screen: '#1976d2',
    screenBorder: '#333',
    bedFrame: '#3e2723',
    mattress: '#fff',
    pillow: '#e0e0e0',
    blanket: '#90caf9',
    chairBack: '#a0522d',
    chairSeat: '#8b4513',
    chairLeg: '#654321',
    closetDoor: '#fff',
    closetHandle: '#ccc',
    lampShade: '#e0e0e0',
    lampBase: '#8d6e63',
    rug: '#e57373',
    windowPane: '#81d4fa',
} as const;

export const ROOM_COLORS_DARK = {
    wall: '#263238',
    floor: '#3e2723',
    woodPlank: '#4e342e',
    woodPlankDark: '#3e2723',
    doorFrame: '#424242',
    doorKnob: '#ffd700',
    doorPanel: '#616161',
    deskTop: '#5d4037',
    deskLeg: '#3e2723',
    screen: '#1a237e',
    screenBorder: '#000',
    bedFrame: '#3e2723',
    mattress: '#bdbdbd',
    pillow: '#757575',
    blanket: '#1565c0',
    chairBack: '#5d4037',
    chairSeat: '#3e2723',
    chairLeg: '#3e2723',
    closetDoor: '#616161',
    closetHandle: '#bdbdbd',
    lampShade: '#ffca28',
    lampBase: '#424242',
    rug: '#455a64',
    windowPane: '#1a237e',
} as const;

// Type exports for TypeScript
export type SpacingKey = keyof typeof SPACING;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type RadiusKey = keyof typeof RADIUS;
export type ShadowKey = keyof typeof SHADOWS;
export type AnimationKey = keyof typeof ANIMATION;
export type LightColorKey = keyof typeof LIGHT_COLORS;
export type DarkColorKey = keyof typeof DARK_COLORS;

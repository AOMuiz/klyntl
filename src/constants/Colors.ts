/**
 * Klyntl Brand Colors and Theme Configuration
 *
 * A comprehensive color system designed for the Klyntl customer platform.
 * Colors are inspired by prosperity, growth, and trust - key values for financial interactions.
 */

// Brand Colors - Primary palette based on Nigerian financial context
export const BrandColors = {
  // Primary brand colors - Green symbolizing growth and prosperity
  primary: {
    main: "#2E7D32", // Forest Green - Primary brand color
    light: "#4CAF50", // Lighter green for active states
    dark: "#1B5E20", // Darker green for emphasis
    surface: "#E8F5E8", // Very light green for backgrounds
  },

  // Secondary colors - Complementary palette
  secondary: {
    main: "#1976D2", // Professional blue
    light: "#42A5F5", // Light blue for accents
    dark: "#0D47A1", // Dark blue for headers
    surface: "#E3F2FD", // Light blue backgrounds
  },

  // Success, Warning, Error states
  success: {
    main: "#388E3C",
    light: "#66BB6A",
    dark: "#2E7D32",
    surface: "#E8F5E8",
  },

  warning: {
    main: "#F57C00",
    light: "#FFB74D",
    dark: "#E65100",
    surface: "#FFF3E0",
  },

  error: {
    main: "#D32F2F",
    light: "#EF5350",
    dark: "#C62828",
    surface: "#FFEBEE",
  },

  // Neutral colors for text and backgrounds
  neutral: {
    black: "#000000",
    white: "#FFFFFF",
    gray900: "#212121",
    gray800: "#424242",
    gray700: "#616161",
    gray600: "#757575",
    gray500: "#9E9E9E",
    gray400: "#BDBDBD",
    gray300: "#E0E0E0",
    gray200: "#EEEEEE",
    gray100: "#F5F5F5",
    gray50: "#FAFAFA",
  },

  // Nigerian Naira themed colors
  currency: {
    positive: "#2E7D32", // Green for gains
    negative: "#D32F2F", // Red for losses
    neutral: "#757575", // Gray for neutral amounts
  },
};

// Theme configurations for light and dark modes
export const Colors = {
  light: {
    // Primary colors
    primary: BrandColors.primary.main,
    primaryLight: BrandColors.primary.light,
    primaryDark: BrandColors.primary.dark,
    primarySurface: BrandColors.primary.surface,

    // Secondary colors
    secondary: BrandColors.secondary.main,
    secondaryLight: BrandColors.secondary.light,
    secondaryDark: BrandColors.secondary.dark,
    secondarySurface: BrandColors.secondary.surface,

    // Background colors
    background: BrandColors.neutral.white,
    surface: BrandColors.neutral.gray50,
    surfaceVariant: BrandColors.neutral.gray100,

    // Text colors
    text: BrandColors.neutral.gray900,
    textSecondary: BrandColors.neutral.gray700,
    textTertiary: BrandColors.neutral.gray500,
    textDisabled: BrandColors.neutral.gray400,

    // Interactive elements
    tint: BrandColors.primary.main,
    icon: BrandColors.neutral.gray600,
    tabIconDefault: BrandColors.neutral.gray500,
    tabIconSelected: BrandColors.primary.main,

    // Status colors
    success: BrandColors.success.main,
    warning: BrandColors.warning.main,
    error: BrandColors.error.main,

    // Borders and dividers
    border: BrandColors.neutral.gray300,
    divider: BrandColors.neutral.gray200,

    // Currency colors
    currencyPositive: BrandColors.currency.positive,
    currencyNegative: BrandColors.currency.negative,
    currencyNeutral: BrandColors.currency.neutral,
  },

  dark: {
    // Primary colors (adjusted for dark theme)
    primary: BrandColors.primary.light,
    primaryLight: "#81C784",
    primaryDark: BrandColors.primary.main,
    primarySurface: "#1B2A1B",

    // Secondary colors
    secondary: BrandColors.secondary.light,
    secondaryLight: "#90CAF9",
    secondaryDark: BrandColors.secondary.main,
    secondarySurface: "#1A1F2E",

    // Background colors
    background: "#121212",
    surface: "#1E1E1E",
    surfaceVariant: "#2C2C2C",

    // Text colors
    text: BrandColors.neutral.white,
    textSecondary: BrandColors.neutral.gray300,
    textTertiary: BrandColors.neutral.gray400,
    textDisabled: BrandColors.neutral.gray600,

    // Interactive elements
    tint: BrandColors.primary.light,
    icon: BrandColors.neutral.gray400,
    tabIconDefault: BrandColors.neutral.gray500,
    tabIconSelected: BrandColors.primary.light,

    // Status colors (adjusted for dark theme)
    success: "#66BB6A",
    warning: "#FFB74D",
    error: "#EF5350",

    // Borders and dividers
    border: "#404040",
    divider: "#2C2C2C",

    // Currency colors
    currencyPositive: "#66BB6A",
    currencyNegative: "#EF5350",
    currencyNeutral: BrandColors.neutral.gray400,
  },
};

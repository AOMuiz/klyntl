/**
 * Klyntl Brand Colors and Theme Configuration
 *
 * A comprehensive color system designed for the Klyntl customer platform.
 * Colors are inspired by prosperity, growth, and trust - key values for financial interactions.
 */

// Brand Colors - Primary palette based on professional color system
export const BrandColors = {
  // Primary brand colors - Emerald Green representing growth and success
  primary: {
    50: "#ecfdf5", // Very light emerald
    100: "#d1fae5", // Light emerald
    200: "#a7f3d0", // Lighter emerald
    300: "#6ee7b7", // Light emerald
    400: "#34d399", // Emerald 400
    500: "#10b981", // Emerald 500
    600: "#059669", // Primary brand color (Emerald 600)
    700: "#047857", // Dark emerald
    800: "#065f46", // Darker emerald
    900: "#064e3b", // Very dark emerald
    // Legacy aliases for backward compatibility
    main: "#059669",
    light: "#10b981",
    lighter: "#34d399",
    dark: "#047857",
    darker: "#065f46",
    surface: "#ecfdf5",
  },

  // Secondary colors - Deep Blue for professional elements
  secondary: {
    50: "#f0f9ff", // Very light sky
    100: "#e0f2fe", // Light sky
    200: "#bae6fd", // Lighter sky
    300: "#7dd3fc", // Light sky
    400: "#38bdf8", // Sky 400
    500: "#0ea5e9", // Sky 500
    600: "#0284c7", // Sky 600
    700: "#0369a1", // Sky 700
    800: "#075985", // Sky 800
    900: "#0c4a6e", // Secondary brand color (Sky 900)
    // Legacy aliases for backward compatibility
    main: "#0c4a6e",
    light: "#0ea5e9",
    lighter: "#38bdf8",
    dark: "#075985",
    darker: "#0369a1",
    surface: "#f0f9ff",
  },

  // Accent colors - Purple for premium features
  accent: {
    50: "#faf5ff", // Very light purple
    100: "#f3e8ff", // Light purple
    200: "#e9d5ff", // Lighter purple
    300: "#d8b4fe", // Light purple
    400: "#c084fc", // Purple 400
    500: "#a855f7", // Purple 500
    600: "#9333ea", // Purple 600
    700: "#7c3aed", // Dark purple
    800: "#6d28d9", // Darker purple
    900: "#581c87", // Very dark purple
    // Legacy aliases for backward compatibility
    main: "#9333ea",
    light: "#a855f7",
    lighter: "#c084fc",
    dark: "#7c3aed",
    darker: "#6d28d9",
    surface: "#faf5ff",
  },

  // Success, Warning, Error states
  success: {
    50: "#f0fdf4", // Very light green
    100: "#dcfce7", // Light green
    200: "#bbf7d0", // Lighter green
    300: "#86efac", // Light green
    400: "#4ade80", // Green 400
    500: "#22c55e", // Success color (Green 500)
    600: "#16a34a", // Green 600
    700: "#15803d", // Green 700
    800: "#166534", // Green 800
    900: "#14532d", // Very dark green
    // Legacy aliases for backward compatibility
    main: "#22c55e",
    light: "#4ade80",
    lighter: "#86efac",
    dark: "#16a34a",
    darker: "#15803d",
    surface: "#f0fdf4",
  },

  warning: {
    50: "#fffbeb", // Very light amber
    100: "#fef3c7", // Light amber
    200: "#fde68a", // Lighter amber
    300: "#fcd34d", // Light amber
    400: "#fbbf24", // Amber 400
    500: "#f59e0b", // Warning color (Amber 500)
    600: "#d97706", // Amber 600
    700: "#b45309", // Amber 700
    800: "#92400e", // Amber 800
    900: "#78350f", // Very dark amber
    // Legacy aliases for backward compatibility
    main: "#f59e0b",
    light: "#fbbf24",
    lighter: "#fcd34d",
    dark: "#d97706",
    darker: "#b45309",
    surface: "#fffbeb",
  },

  error: {
    50: "#fef2f2", // Very light red
    100: "#fee2e2", // Light red
    200: "#fecaca", // Lighter red
    300: "#fca5a5", // Light red
    400: "#f87171", // Red 400
    500: "#ef4444", // Error color (Red 500)
    600: "#dc2626", // Red 600
    700: "#b91c1c", // Red 700
    800: "#991b1b", // Red 800
    900: "#7f1d1d", // Very dark red
    // Legacy aliases for backward compatibility
    main: "#ef4444",
    light: "#f87171",
    lighter: "#fca5a5",
    dark: "#dc2626",
    darker: "#b91c1c",
    surface: "#fef2f2",
  },

  // Neutral colors for text and backgrounds - Slate Gray family
  neutral: {
    black: "#000000",
    white: "#ffffff",
    gray900: "#0f172a", // Primary text (Slate 900)
    gray800: "#1e293b", // Slate 800
    gray700: "#334155", // Slate 700
    gray600: "#475569", // Secondary text (Slate 600)
    gray500: "#64748b", // Slate 500
    gray400: "#94a3b8", // Muted text (Slate 400)
    gray300: "#cbd5e1", // Slate 300
    gray200: "#e2e8f0", // Borders (Slate 200)
    gray100: "#f1f5f9", // Slate 100
    gray50: "#f8fafc", // Main background (Slate 50)
  },

  // Nigerian Naira themed colors
  currency: {
    positive: "#22c55e", // Success green
    negative: "#ef4444", // Error red
    neutral: "#64748b", // Neutral gray
  },
};

// Theme configurations for light and dark modes
export const Colors = {
  light: {
    // Primary colors - Complete shade system
    primary50: BrandColors.primary[50],
    primary100: BrandColors.primary[100],
    primary200: BrandColors.primary[200],
    primary300: BrandColors.primary[300],
    primary400: BrandColors.primary[400],
    primary500: BrandColors.primary[500],
    primary600: BrandColors.primary[600],
    primary700: BrandColors.primary[700],
    primary800: BrandColors.primary[800],
    primary900: BrandColors.primary[900],
    // Legacy aliases
    primary: BrandColors.primary.main,
    primaryLight: BrandColors.primary.light,
    primaryLighter: BrandColors.primary.lighter,
    primaryDark: BrandColors.primary.dark,
    primaryDarker: BrandColors.primary.darker,
    primarySurface: BrandColors.primary.surface,

    // Secondary colors - Complete shade system
    secondary50: BrandColors.secondary[50],
    secondary100: BrandColors.secondary[100],
    secondary200: BrandColors.secondary[200],
    secondary300: BrandColors.secondary[300],
    secondary400: BrandColors.secondary[400],
    secondary500: BrandColors.secondary[500],
    secondary600: BrandColors.secondary[600],
    secondary700: BrandColors.secondary[700],
    secondary800: BrandColors.secondary[800],
    secondary900: BrandColors.secondary[900],
    // Legacy aliases
    secondary: BrandColors.secondary.main,
    secondaryLight: BrandColors.secondary.light,
    secondaryLighter: BrandColors.secondary.lighter,
    secondaryDark: BrandColors.secondary.dark,
    secondaryDarker: BrandColors.secondary.darker,
    secondarySurface: BrandColors.secondary.surface,

    // Accent colors - Complete shade system
    accent50: BrandColors.accent[50],
    accent100: BrandColors.accent[100],
    accent200: BrandColors.accent[200],
    accent300: BrandColors.accent[300],
    accent400: BrandColors.accent[400],
    accent500: BrandColors.accent[500],
    accent600: BrandColors.accent[600],
    accent700: BrandColors.accent[700],
    accent800: BrandColors.accent[800],
    accent900: BrandColors.accent[900],
    // Legacy aliases
    accent: BrandColors.accent.main,
    accentLight: BrandColors.accent.light,
    accentLighter: BrandColors.accent.lighter,
    accentDark: BrandColors.accent.dark,
    accentDarker: BrandColors.accent.darker,
    accentSurface: BrandColors.accent.surface,

    // Background colors
    background: BrandColors.neutral.gray50,
    surface: BrandColors.neutral.white,
    surfaceVariant: BrandColors.neutral.gray100,

    // Text colors
    text: BrandColors.neutral.gray900,
    textSecondary: BrandColors.neutral.gray600,
    textTertiary: BrandColors.neutral.gray400,
    textDisabled: BrandColors.neutral.gray300,

    // Interactive elements
    tint: BrandColors.primary.main,
    icon: BrandColors.neutral.gray500,
    tabIconDefault: BrandColors.neutral.gray400,
    tabIconSelected: BrandColors.primary.main,

    // Status colors - Complete shade system
    success50: BrandColors.success[50],
    success100: BrandColors.success[100],
    success200: BrandColors.success[200],
    success300: BrandColors.success[300],
    success400: BrandColors.success[400],
    success500: BrandColors.success[500],
    success600: BrandColors.success[600],
    success700: BrandColors.success[700],
    success800: BrandColors.success[800],
    success900: BrandColors.success[900],
    // Legacy aliases
    success: BrandColors.success.main,
    successLight: BrandColors.success.light,
    successLighter: BrandColors.success.lighter,
    successDark: BrandColors.success.dark,
    successDarker: BrandColors.success.darker,

    warning50: BrandColors.warning[50],
    warning100: BrandColors.warning[100],
    warning200: BrandColors.warning[200],
    warning300: BrandColors.warning[300],
    warning400: BrandColors.warning[400],
    warning500: BrandColors.warning[500],
    warning600: BrandColors.warning[600],
    warning700: BrandColors.warning[700],
    warning800: BrandColors.warning[800],
    warning900: BrandColors.warning[900],
    // Legacy aliases
    warning: BrandColors.warning.main,
    warningLight: BrandColors.warning.light,
    warningLighter: BrandColors.warning.lighter,
    warningDark: BrandColors.warning.dark,
    warningDarker: BrandColors.warning.darker,

    error50: BrandColors.error[50],
    error100: BrandColors.error[100],
    error200: BrandColors.error[200],
    error300: BrandColors.error[300],
    error400: BrandColors.error[400],
    error500: BrandColors.error[500],
    error600: BrandColors.error[600],
    error700: BrandColors.error[700],
    error800: BrandColors.error[800],
    error900: BrandColors.error[900],
    // Legacy aliases
    error: BrandColors.error.main,
    errorLight: BrandColors.error.light,
    errorLighter: BrandColors.error.lighter,
    errorDark: BrandColors.error.dark,
    errorDarker: BrandColors.error.darker,

    // Borders and dividers
    border: BrandColors.neutral.gray200,
    divider: BrandColors.neutral.gray100,

    // Currency colors
    currencyPositive: BrandColors.currency.positive,
    currencyNegative: BrandColors.currency.negative,
    currencyNeutral: BrandColors.currency.neutral,
  },

  dark: {
    // Primary colors (adjusted for dark theme)
    primary: BrandColors.primary.main, // Keep main for visibility
    primaryLight: BrandColors.primary.light,
    primaryLighter: BrandColors.primary.lighter,
    primaryDark: BrandColors.primary.dark,
    primaryDarker: BrandColors.primary.darker,
    primarySurface: "#0a2e1f", // Dark emerald surface

    // Secondary colors
    secondary: BrandColors.secondary.light, // Lighter blue for dark backgrounds
    secondaryLight: BrandColors.secondary.lighter,
    secondaryLighter: BrandColors.secondary.main,
    secondaryDark: BrandColors.secondary.dark,
    secondaryDarker: BrandColors.secondary.darker,
    secondarySurface: "#0a1f2e", // Dark blue surface

    // Accent colors for dark mode
    accent: BrandColors.accent.main,
    accentLight: BrandColors.accent.light,
    accentLighter: BrandColors.accent.lighter,
    accentDark: BrandColors.accent.dark,
    accentDarker: BrandColors.accent.darker,
    accentSurface: "#1a1033", // Dark purple surface

    // Background colors
    background: "#0f172a", // Dark slate background
    surface: "#1e293b", // Dark surface
    surfaceVariant: "#334155", // Dark surface variant

    // Text colors
    text: BrandColors.neutral.white,
    textSecondary: BrandColors.neutral.gray300,
    textTertiary: BrandColors.neutral.gray400,
    textDisabled: BrandColors.neutral.gray500,

    // Interactive elements
    tint: BrandColors.primary.light, // Lighter for dark mode
    icon: BrandColors.neutral.gray400,
    tabIconDefault: BrandColors.neutral.gray500,
    tabIconSelected: BrandColors.primary.light,

    // Status colors - Complete shade system
    success50: BrandColors.success[50],
    success100: BrandColors.success[100],
    success200: BrandColors.success[200],
    success300: BrandColors.success[300],
    success400: BrandColors.success[400],
    success500: BrandColors.success[500],
    success600: BrandColors.success[600],
    success700: BrandColors.success[700],
    success800: BrandColors.success[800],
    success900: BrandColors.success[900],
    // Legacy aliases
    success: BrandColors.success.light, // Lighter green for dark backgrounds
    successLight: BrandColors.success.lighter,
    successLighter: BrandColors.success.main,
    successDark: BrandColors.success.dark,
    successDarker: BrandColors.success.darker,

    warning50: BrandColors.warning[50],
    warning100: BrandColors.warning[100],
    warning200: BrandColors.warning[200],
    warning300: BrandColors.warning[300],
    warning400: BrandColors.warning[400],
    warning500: BrandColors.warning[500],
    warning600: BrandColors.warning[600],
    warning700: BrandColors.warning[700],
    warning800: BrandColors.warning[800],
    warning900: BrandColors.warning[900],
    // Legacy aliases
    warning: BrandColors.warning.light, // Lighter amber for dark backgrounds
    warningLight: BrandColors.warning.lighter,
    warningLighter: BrandColors.warning.main,
    warningDark: BrandColors.warning.dark,
    warningDarker: BrandColors.warning.darker,

    error50: BrandColors.error[50],
    error100: BrandColors.error[100],
    error200: BrandColors.error[200],
    error300: BrandColors.error[300],
    error400: BrandColors.error[400],
    error500: BrandColors.error[500],
    error600: BrandColors.error[600],
    error700: BrandColors.error[700],
    error800: BrandColors.error[800],
    error900: BrandColors.error[900],
    // Legacy aliases
    error: BrandColors.error.light, // Lighter red for dark backgrounds
    errorLight: BrandColors.error.lighter,
    errorLighter: BrandColors.error.main,
    errorDark: BrandColors.error.dark,
    errorDarker: BrandColors.error.darker,

    // Borders and dividers
    border: "#475569", // Dark border
    divider: "#334155", // Dark divider

    // Currency colors
    currencyPositive: BrandColors.success.light,
    currencyNegative: BrandColors.error.light,
    currencyNeutral: BrandColors.neutral.gray400,
  },
};

/**
 * Klyntl Theme Configuration for React Native Paper
 *
 * This file configures the React Native Paper theme with Klyntl's
 * brand colors, typography, and design system.
 */

import type { MD3Theme } from "react-native-paper";
import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from "react-native-paper";
import { BrandColors, Colors } from "./Colors";
import { FontFamilies, FontSizes, FontWeights } from "./Typography";

// Configure fonts for React Native Paper
const fontConfig = {
  displayLarge: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl7,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.25,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl6,
    fontWeight: FontWeights.bold,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl5,
    fontWeight: FontWeights.bold,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl4,
    fontWeight: FontWeights.bold,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl3,
    fontWeight: FontWeights.bold,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xl2,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.medium,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

// Light theme configuration
export const KlyntlLightTheme: MD3Theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors
    primary: Colors.light.primary,
    onPrimary: BrandColors.neutral.white,
    primaryContainer: Colors.light.primarySurface,
    onPrimaryContainer: Colors.light.primaryDark,

    // Secondary colors
    secondary: Colors.light.secondary,
    onSecondary: BrandColors.neutral.white,
    secondaryContainer: Colors.light.secondarySurface,
    onSecondaryContainer: Colors.light.secondaryDark,

    // Tertiary colors (using warning colors)
    tertiary: BrandColors.warning.main,
    onTertiary: BrandColors.neutral.white,
    tertiaryContainer: BrandColors.warning.surface,
    onTertiaryContainer: BrandColors.warning.dark,

    // Error colors
    error: Colors.light.error,
    onError: BrandColors.neutral.white,
    errorContainer: BrandColors.error.surface,
    onErrorContainer: BrandColors.error.dark,

    // Background colors
    background: Colors.light.background,
    onBackground: Colors.light.text,
    surface: Colors.light.surface,
    onSurface: Colors.light.text,
    surfaceVariant: Colors.light.surfaceVariant,
    onSurfaceVariant: Colors.light.textSecondary,

    // Outline colors
    outline: Colors.light.border,
    outlineVariant: Colors.light.divider,

    // Shadow and scrim
    shadow: BrandColors.neutral.black,
    scrim: BrandColors.neutral.black,

    // Inverse colors
    inverseSurface: BrandColors.neutral.gray900,
    inverseOnSurface: BrandColors.neutral.white,
    inversePrimary: Colors.light.primaryLight,

    // Elevation surfaces
    elevation: {
      level0: "transparent",
      level1: "#F8F9FA",
      level2: "#F1F3F4",
      level3: "#E8EAED",
      level4: "#E1E3E6",
      level5: "#D9DBDE",
    },
  },
};

// Dark theme configuration
export const KlyntlDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    // Primary colors
    primary: Colors.dark.primary,
    onPrimary: BrandColors.neutral.black,
    primaryContainer: Colors.dark.primarySurface,
    onPrimaryContainer: Colors.dark.primaryLight,

    // Secondary colors
    secondary: Colors.dark.secondary,
    onSecondary: BrandColors.neutral.black,
    secondaryContainer: Colors.dark.secondarySurface,
    onSecondaryContainer: Colors.dark.secondaryLight,

    // Tertiary colors
    tertiary: BrandColors.warning.light,
    onTertiary: BrandColors.neutral.black,
    tertiaryContainer: "#2A1F0A",
    onTertiaryContainer: BrandColors.warning.light,

    // Error colors
    error: Colors.dark.error,
    onError: BrandColors.neutral.black,
    errorContainer: "#2A1313",
    onErrorContainer: Colors.dark.error,

    // Background colors
    background: Colors.dark.background,
    onBackground: Colors.dark.text,
    surface: Colors.dark.surface,
    onSurface: Colors.dark.text,
    surfaceVariant: Colors.dark.surfaceVariant,
    onSurfaceVariant: Colors.dark.textSecondary,

    // Outline colors
    outline: Colors.dark.border,
    outlineVariant: Colors.dark.divider,

    // Shadow and scrim
    shadow: BrandColors.neutral.black,
    scrim: BrandColors.neutral.black,

    // Inverse colors
    inverseSurface: BrandColors.neutral.gray100,
    inverseOnSurface: BrandColors.neutral.gray900,
    inversePrimary: Colors.light.primary,

    // Elevation surfaces
    elevation: {
      level0: "transparent",
      level1: "#1F1F1F",
      level2: "#232323",
      level3: "#272727",
      level4: "#2C2C2C",
      level5: "#2E2E2E",
    },
  },
};

// Theme selector function
export const getTheme = (isDark: boolean) => {
  return isDark ? KlyntlDarkTheme : KlyntlLightTheme;
};

// Component-specific theme overrides
export const ComponentThemes = {
  Card: {
    borderRadius: 12,
    elevation: 2,
  },

  Button: {
    borderRadius: 8,
    contentStyle: {
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
  },

  TextInput: {
    borderRadius: 8,
    contentStyle: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  },

  FAB: {
    borderRadius: 16,
  },

  Chip: {
    borderRadius: 16,
  },

  Dialog: {
    borderRadius: 16,
  },

  Snackbar: {
    borderRadius: 8,
  },
};

/**
 * Simplified Klyntl Theme Integration with React Native Paper
 *
 * This creates a bridge between our BrandColors and React Native Paper's theming system.
 * It provides both Paper-compatible themes and direct access to all color shades.
 */

import type { MD3Theme } from "react-native-paper";
import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from "react-native-paper";
import { BrandColors } from "./Colors";
import { FontFamilies, FontSizes, FontWeights } from "./Typography";

// Extended theme interface with direct shade access
export interface ExtendedKlyntlTheme extends MD3Theme {
  brandColors: typeof BrandColors;
  shades: {
    primary: typeof BrandColors.primary;
    secondary: typeof BrandColors.secondary;
    accent: typeof BrandColors.accent;
    success: typeof BrandColors.success;
    warning: typeof BrandColors.warning;
    error: typeof BrandColors.error;
    neutral: typeof BrandColors.neutral;
  };
  customColors: {
    success: string;
    onSuccess: string;
    successContainer: string;
    onSuccessContainer: string;
    warning: string;
    onWarning: string;
    warningContainer: string;
    onWarningContainer: string;
  };
}

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

// Create theme function that generates Paper-compatible themes with our colors
const createKlyntlTheme = (isDark: boolean): ExtendedKlyntlTheme => {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    fonts: configureFonts({ config: fontConfig }),

    // Direct access to all brand colors and shades
    brandColors: BrandColors,
    shades: {
      primary: BrandColors.primary,
      secondary: BrandColors.secondary,
      accent: BrandColors.accent,
      success: BrandColors.success,
      warning: BrandColors.warning,
      error: BrandColors.error,
      neutral: BrandColors.neutral,
    },

    // Custom colors for success/warning that Paper doesn't have
    customColors: {
      success: BrandColors.success[isDark ? 400 : 500],
      onSuccess: BrandColors.neutral.white,
      successContainer: BrandColors.success[isDark ? 800 : 100],
      onSuccessContainer: BrandColors.success[isDark ? 100 : 800],
      warning: BrandColors.warning[isDark ? 400 : 500],
      onWarning: BrandColors.neutral.white,
      warningContainer: BrandColors.warning[isDark ? 800 : 100],
      onWarningContainer: BrandColors.warning[isDark ? 100 : 800],
    },

    colors: {
      ...baseTheme.colors,
      // Primary colors - React Native Paper will use these automatically
      primary: BrandColors.primary[600],
      onPrimary: BrandColors.neutral.white,
      primaryContainer: BrandColors.primary[isDark ? 800 : 100],
      onPrimaryContainer: BrandColors.primary[isDark ? 100 : 800],

      // Secondary colors
      secondary: BrandColors.secondary[600],
      onSecondary: BrandColors.neutral.white,
      secondaryContainer: BrandColors.secondary[isDark ? 800 : 100],
      onSecondaryContainer: BrandColors.secondary[isDark ? 100 : 800],

      // Tertiary (accent) colors
      tertiary: BrandColors.accent[600],
      onTertiary: BrandColors.neutral.white,
      tertiaryContainer: BrandColors.accent[isDark ? 800 : 100],
      onTertiaryContainer: BrandColors.accent[isDark ? 100 : 800],

      // Error colors
      error: BrandColors.error[500],
      onError: BrandColors.neutral.white,
      errorContainer: BrandColors.error[isDark ? 800 : 100],
      onErrorContainer: BrandColors.error[isDark ? 100 : 800],

      // Background colors
      background: isDark
        ? BrandColors.neutral.gray900
        : BrandColors.neutral.gray50,
      onBackground: isDark
        ? BrandColors.neutral.gray100
        : BrandColors.neutral.gray900,
      surface: isDark ? BrandColors.neutral.gray800 : BrandColors.neutral.white,
      onSurface: isDark
        ? BrandColors.neutral.gray100
        : BrandColors.neutral.gray900,
      surfaceVariant: isDark
        ? BrandColors.neutral.gray700
        : BrandColors.neutral.gray100,
      onSurfaceVariant: isDark
        ? BrandColors.neutral.gray300
        : BrandColors.neutral.gray600,

      // Outline colors
      outline: isDark
        ? BrandColors.neutral.gray600
        : BrandColors.neutral.gray300,
      outlineVariant: isDark
        ? BrandColors.neutral.gray700
        : BrandColors.neutral.gray200,

      // Inverse colors
      inverseSurface: isDark
        ? BrandColors.neutral.gray100
        : BrandColors.neutral.gray800,
      inverseOnSurface: isDark
        ? BrandColors.neutral.gray800
        : BrandColors.neutral.gray100,
      inversePrimary: isDark
        ? BrandColors.primary[600]
        : BrandColors.primary[200],

      // Shadow and scrim
      shadow: BrandColors.neutral.black,
      scrim: BrandColors.neutral.black,

      // Elevation surfaces
      elevation: {
        level0: "transparent",
        level1: isDark
          ? BrandColors.neutral.gray800
          : BrandColors.neutral.gray50,
        level2: isDark
          ? BrandColors.neutral.gray700
          : BrandColors.neutral.gray100,
        level3: isDark
          ? BrandColors.neutral.gray600
          : BrandColors.neutral.gray200,
        level4: isDark
          ? BrandColors.neutral.gray500
          : BrandColors.neutral.gray300,
        level5: isDark
          ? BrandColors.neutral.gray400
          : BrandColors.neutral.gray400,
      },
    },
  } as ExtendedKlyntlTheme;
};

// Pre-created theme instances
export const KlyntlLightTheme = createKlyntlTheme(false);
export const KlyntlDarkTheme = createKlyntlTheme(true);

// Theme selector function
export const getKlyntlTheme = (
  colorScheme: "light" | "dark" | null | undefined
): ExtendedKlyntlTheme => {
  return colorScheme === "dark" ? KlyntlDarkTheme : KlyntlLightTheme;
};

// Theme-aware shade mapping for consistent perceived lightness
const DARK_SHADE_MAP: Record<number, number> = {
  50: 900, // Very light becomes very dark
  100: 800, // Light becomes dark
  200: 700, // Lighter becomes darker
  300: 600, // Light-medium becomes dark-medium
  400: 500, // Medium-light becomes medium-dark
  500: 400, // Medium becomes medium (inverted)
  600: 300, // Medium-dark becomes light-medium
  700: 200, // Darker becomes lighter
  800: 100, // Dark becomes light
  900: 50, // Very dark becomes very light
};

// Helper function to get theme-aware shade
export const getThemeAwareShade = (
  theme: ExtendedKlyntlTheme,
  colorFamily: keyof typeof BrandColors,
  shade: number
): string => {
  const isDark = theme.dark;
  const targetShade = isDark ? DARK_SHADE_MAP[shade] ?? shade : shade;
  const family = BrandColors[colorFamily] as any;
  return family[targetShade] || family[shade] || family.main;
};

// Create theme-aware color family object
const createThemeAwareColorFamily = (
  theme: ExtendedKlyntlTheme,
  colorFamily: keyof typeof BrandColors
) => {
  const family = BrandColors[colorFamily] as any;
  const themeAwareFamily: any = {};

  // Copy all properties first
  Object.keys(family).forEach((key) => {
    themeAwareFamily[key] = family[key];
  });

  // Override numeric shades with theme-aware versions
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].forEach((shade) => {
    if (family[shade]) {
      themeAwareFamily[shade] = getThemeAwareShade(theme, colorFamily, shade);
    }
  });

  return themeAwareFamily;
};

// Utility hook for easy color access in components
export const useKlyntlColors = (theme: ExtendedKlyntlTheme) => {
  // Safety check for theme
  if (!theme || !theme.shades) {
    console.warn(
      "Theme or theme.shades is undefined, falling back to default colors"
    );
    return {
      primary: BrandColors.primary,
      secondary: BrandColors.secondary,
      accent: BrandColors.accent,
      success: BrandColors.success,
      warning: BrandColors.warning,
      error: BrandColors.error,
      neutral: BrandColors.neutral,
      paper: theme?.colors || {},
      custom: theme?.customColors || {},
      static: {
        primary: BrandColors.primary,
        secondary: BrandColors.secondary,
        accent: BrandColors.accent,
        success: BrandColors.success,
        warning: BrandColors.warning,
        error: BrandColors.error,
        neutral: BrandColors.neutral,
      },
    };
  }

  return {
    // Theme-aware shade access - automatically inverts in dark mode!
    primary: createThemeAwareColorFamily(theme, "primary"),
    secondary: createThemeAwareColorFamily(theme, "secondary"),
    accent: createThemeAwareColorFamily(theme, "accent"),
    success: createThemeAwareColorFamily(theme, "success"),
    warning: createThemeAwareColorFamily(theme, "warning"),
    error: createThemeAwareColorFamily(theme, "error"),
    neutral: createThemeAwareColorFamily(theme, "neutral"),

    // Paper's semantic colors (these work with Paper components automatically)
    paper: theme.colors,

    // Custom colors for success/warning
    custom: theme.customColors,

    // Direct access to original shades (if you need static colors)
    static: {
      primary: theme.shades.primary,
      secondary: theme.shades.secondary,
      accent: theme.shades.accent,
      success: theme.shades.success,
      warning: theme.shades.warning,
      error: theme.shades.error,
      neutral: theme.shades.neutral,
    },
  };
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

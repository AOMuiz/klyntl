/**
 * Klyntl Typography System
 *
 * A comprehensive typography scale designed for excellent readability
 * and hierarchy across the Klyntl customer platform.
 */

import { Platform } from "react-native";

// Font families - Modern Inter font family for excellent readability and professional look
export const FontFamilies = {
  // Primary font family (Inter - modern, professional, excellent for fintech)
  regular: Platform.select({
    ios: "Inter",
    android: "Inter",
    default: "Inter",
  }),

  // Medium weight
  medium: Platform.select({
    ios: "Inter-Medium",
    android: "Inter-Medium",
    default: "Inter-Medium",
  }),

  // Bold weight
  bold: Platform.select({
    ios: "Inter-Bold",
    android: "Inter-Bold",
    default: "Inter-Bold",
  }),

  // Numbers and currency (Inter has excellent number readability)
  monospace: Platform.select({
    ios: "Inter",
    android: "Inter",
    default: "Inter",
  }),
};

// Font weights
export const FontWeights = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
};

// Font sizes following a modular scale (1.25 ratio)
export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xl2: 24,
  xl3: 28,
  xl4: 32,
  xl5: 36,
  xl6: 42,
  xl7: 48,
};

// Line heights for optimal readability
export const LineHeights = {
  xs: 14,
  sm: 16,
  base: 20,
  md: 24,
  lg: 28,
  xl: 32,
  xl2: 36,
  xl3: 40,
  xl4: 44,
  xl5: 48,
  xl6: 56,
  xl7: 64,
};

// Letter spacing for improved readability
export const LetterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
};

// Typography variants - ready-to-use text styles
export const Typography = {
  // Headings
  h1: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl6,
    lineHeight: LineHeights.xl6,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
  },

  h2: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl5,
    lineHeight: LineHeights.xl5,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
  },

  h3: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl4,
    lineHeight: LineHeights.xl4,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.normal,
  },

  h4: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes.xl3,
    lineHeight: LineHeights.xl3,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.normal,
  },

  h5: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xl2,
    lineHeight: LineHeights.xl2,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  h6: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights.xl,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  // Body text
  body1: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  body2: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  // UI text
  button: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.wide,
  },

  caption: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  overline: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.widest,
  },

  // Special purpose
  currency: {
    fontFamily: FontFamilies.monospace,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.lg,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  currencyLarge: {
    fontFamily: FontFamilies.monospace,
    fontSize: FontSizes.xl3,
    lineHeight: LineHeights.xl3,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.normal,
  },

  currencySmall: {
    fontFamily: FontFamilies.monospace,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Form elements
  input: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  label: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Navigation
  tabLabel: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Cards and lists
  cardTitle: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.lg,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  cardSubtitle: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  listItem: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  listItemSecondary: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },
};

// Utility functions for dynamic text styles
export const createTextStyle = (
  fontSize: number,
  lineHeight?: number,
  fontWeight?: keyof typeof FontWeights,
  fontFamily?: string
) => ({
  fontSize,
  lineHeight: lineHeight || fontSize * 1.4,
  fontWeight: fontWeight ? FontWeights[fontWeight] : FontWeights.regular,
  fontFamily: fontFamily || FontFamilies.regular,
});

// Responsive font size helper
export const getResponsiveFontSize = (baseSize: number, scale: number = 1) => {
  return Math.round(baseSize * scale);
};

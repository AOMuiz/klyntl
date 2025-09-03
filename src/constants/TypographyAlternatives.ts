/**
 * Alternative Typography Configurations for Klyntl
 *
 * This file provides multiple modern font configurations to choose from.
 * Each configuration offers a different personality while maintaining readability.
 */

import { Platform } from "react-native";
import {
  FontSizes,
  FontWeights,
  LetterSpacing,
  LineHeights,
} from "./Typography";

// Option 1: Inter (Currently Active) - Modern, professional, excellent for fintech
export const InterFontFamilies = {
  regular: "Inter",
  medium: "Inter-Medium",
  bold: "Inter-Bold",
  monospace: "Inter", // Inter handles numbers beautifully
};

// Option 2: System Fonts with Modern Styling - Fallback option
export const SystemFontFamilies = {
  regular: Platform.select({
    ios: "SF Pro Text",
    android: "Roboto",
    default: "System",
  }),
  medium: Platform.select({
    ios: "SF Pro Text",
    android: "Roboto_medium",
    default: "System",
  }),
  bold: Platform.select({
    ios: "SF Pro Text",
    android: "Roboto",
    default: "System",
  }),
  monospace: Platform.select({
    ios: "SF Mono",
    android: "Roboto Mono",
    default: "monospace",
  }),
};

// Option 3: Alternative Modern Font Stack (if you want to try Poppins)
export const PoppinsFontFamilies = {
  regular: "Poppins",
  medium: "Poppins-Medium",
  bold: "Poppins-Bold",
  monospace: "Poppins", // Or keep system monospace
};

// Option 4: Manrope (Alternative professional choice)
export const ManropeFontFamilies = {
  regular: "Manrope",
  medium: "Manrope-Medium",
  bold: "Manrope-Bold",
  monospace: "Manrope",
};

/**
 * Modern Typography Configurations
 *
 * These are optimized for better visual hierarchy and modern appearance
 */

// Enhanced typography with better spacing and modern proportions
export const ModernTypography = {
  // Large Headings - More impactful
  hero: {
    fontFamily: InterFontFamilies.bold,
    fontSize: FontSizes.xl7, // 48px
    lineHeight: LineHeights.xl7,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
  },

  // Page Titles
  pageTitle: {
    fontFamily: InterFontFamilies.bold,
    fontSize: FontSizes.xl4, // 32px
    lineHeight: LineHeights.xl4,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
  },

  // Section Headers
  sectionHeader: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.xl2, // 24px
    lineHeight: LineHeights.xl2,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  // Card Titles
  cardTitle: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.lg, // 18px
    lineHeight: LineHeights.lg,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Body Text - Optimized for reading
  bodyLarge: {
    fontFamily: InterFontFamilies.regular,
    fontSize: FontSizes.md, // 16px
    lineHeight: LineHeights.md, // 24px (1.5 ratio)
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  bodyRegular: {
    fontFamily: InterFontFamilies.regular,
    fontSize: FontSizes.base, // 14px
    lineHeight: LineHeights.base, // 20px
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  // UI Elements
  buttonLarge: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.md, // 16px
    lineHeight: LineHeights.md,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.wide,
  },

  buttonRegular: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.base, // 14px
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.wide,
  },

  // Labels and captions
  label: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.sm, // 12px
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.wide,
  },

  caption: {
    fontFamily: InterFontFamilies.regular,
    fontSize: FontSizes.sm, // 12px
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  // Financial/Currency displays
  currencyLarge: {
    fontFamily: InterFontFamilies.bold,
    fontSize: FontSizes.xl3, // 28px
    lineHeight: LineHeights.xl3,
    fontWeight: FontWeights.bold,
    letterSpacing: LetterSpacing.tight,
  },

  currencyMedium: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.lg, // 18px
    lineHeight: LineHeights.lg,
    fontWeight: FontWeights.semibold,
    letterSpacing: LetterSpacing.normal,
  },

  currencySmall: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.base, // 14px
    lineHeight: LineHeights.base,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Navigation
  tabLabel: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.sm, // 12px
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },

  // Form inputs
  inputText: {
    fontFamily: InterFontFamilies.regular,
    fontSize: FontSizes.md, // 16px (prevents zoom on iOS)
    lineHeight: LineHeights.md,
    fontWeight: FontWeights.regular,
    letterSpacing: LetterSpacing.normal,
  },

  inputLabel: {
    fontFamily: InterFontFamilies.medium,
    fontSize: FontSizes.sm, // 12px
    lineHeight: LineHeights.sm,
    fontWeight: FontWeights.medium,
    letterSpacing: LetterSpacing.normal,
  },
};

/**
 * Font Installation Guide for Different Options
 *
 * Inter (Current): Already installed via @expo-google-fonts/inter
 *
 * Poppins: npm install @expo-google-fonts/poppins
 * Manrope: npm install @expo-google-fonts/manrope
 * DM Sans: npm install @expo-google-fonts/dm-sans
 *
 * Then import in _layout.tsx:
 * import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
 */

// Utility function to switch font families easily
export const createTypographyWithFonts = (
  fontFamilies: typeof InterFontFamilies
) => ({
  ...ModernTypography,
  // Override all font families with the selected one
  hero: { ...ModernTypography.hero, fontFamily: fontFamilies.bold },
  pageTitle: { ...ModernTypography.pageTitle, fontFamily: fontFamilies.bold },
  sectionHeader: {
    ...ModernTypography.sectionHeader,
    fontFamily: fontFamilies.medium,
  },
  cardTitle: { ...ModernTypography.cardTitle, fontFamily: fontFamilies.medium },
  bodyLarge: {
    ...ModernTypography.bodyLarge,
    fontFamily: fontFamilies.regular,
  },
  bodyRegular: {
    ...ModernTypography.bodyRegular,
    fontFamily: fontFamilies.regular,
  },
  buttonLarge: {
    ...ModernTypography.buttonLarge,
    fontFamily: fontFamilies.medium,
  },
  buttonRegular: {
    ...ModernTypography.buttonRegular,
    fontFamily: fontFamilies.medium,
  },
  label: { ...ModernTypography.label, fontFamily: fontFamilies.medium },
  caption: { ...ModernTypography.caption, fontFamily: fontFamilies.regular },
  currencyLarge: {
    ...ModernTypography.currencyLarge,
    fontFamily: fontFamilies.bold,
  },
  currencyMedium: {
    ...ModernTypography.currencyMedium,
    fontFamily: fontFamilies.medium,
  },
  currencySmall: {
    ...ModernTypography.currencySmall,
    fontFamily: fontFamilies.medium,
  },
  tabLabel: { ...ModernTypography.tabLabel, fontFamily: fontFamilies.medium },
  inputText: {
    ...ModernTypography.inputText,
    fontFamily: fontFamilies.regular,
  },
  inputLabel: {
    ...ModernTypography.inputLabel,
    fontFamily: fontFamilies.medium,
  },
});

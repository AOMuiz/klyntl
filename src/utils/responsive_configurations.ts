// 🎯 RECOMMENDED DEFAULT CONFIGURATIONS

import { Dimensions, PixelRatio } from "react-native";

import {
  configureResponsive,
  ResponsiveConfig,
} from "./responsive_dimensions_system";

/**
 * Modern iPhone-First Design (Recommended for most apps)
 * Based on iPhone 14/15 standard size - most common target
 */
export const MODERN_IPHONE_CONFIG: ResponsiveConfig = {
  designWidth: 390, // iPhone 14/15 width
  designHeight: 844, // iPhone 14/15 height
  moderateFactor: 0.5, // Balanced scaling
  maxFontScale: 1.3, // Good accessibility without breaking layout
  minFontScale: 0.9, // Prevent fonts from getting too small
  androidFontAdjustment: 1, // Minimal Android adjustment
};

/**
 * Classic iPhone Design (iPhone 11/12/13)
 * Good for apps designed on these devices
 */
export const CLASSIC_IPHONE_CONFIG: ResponsiveConfig = {
  designWidth: 375, // iPhone 11/12/13 width
  designHeight: 812, // iPhone 11/12/13 height
  moderateFactor: 0.5,
  maxFontScale: 1.3,
  minFontScale: 0.9,
  androidFontAdjustment: 1,
};

/**
 * Android-First Design
 * Based on common Android device sizes
 */
export const ANDROID_FIRST_CONFIG: ResponsiveConfig = {
  designWidth: 360, // Common Android width (e.g., Pixel)
  designHeight: 800, // Common Android height
  moderateFactor: 0.4, // Less aggressive scaling for Android variety
  maxFontScale: 1.2, // Conservative font scaling
  minFontScale: 0.85,
  androidFontAdjustment: 0, // No adjustment for Android-first
};

/**
 * Tablet-Optimized Configuration
 * For apps that prioritize tablet experience
 */
export const TABLET_OPTIMIZED_CONFIG: ResponsiveConfig = {
  designWidth: 768, // iPad width in portrait
  designHeight: 1024, // iPad height in portrait
  moderateFactor: 0.3, // Very conservative scaling
  maxFontScale: 1.1, // Tablets don't need much font scaling
  minFontScale: 0.95,
  androidFontAdjustment: 0,
};

/**
 * Accessibility-First Configuration
 * Optimized for users with accessibility needs
 */
export const ACCESSIBILITY_CONFIG: ResponsiveConfig = {
  designWidth: 375,
  designHeight: 812,
  moderateFactor: 0.6, // More responsive to size changes
  maxFontScale: 2.0, // Allow larger font scaling
  minFontScale: 0.8,
  androidFontAdjustment: 0, // Let system handle font rendering
};

/**
 * Cross-Platform Balanced Configuration
 * Best compromise for iOS + Android
 */
export const CROSS_PLATFORM_CONFIG: ResponsiveConfig = {
  designWidth: 375, // Good middle ground
  designHeight: 812,
  moderateFactor: 0.45, // Slightly less aggressive
  maxFontScale: 1.25, // Safe for both platforms
  minFontScale: 0.9,
  androidFontAdjustment: 0.5, // Minimal Android adjustment
};

/**
 * Performance-Optimized Configuration
 * For apps where performance is critical
 */
export const PERFORMANCE_CONFIG: ResponsiveConfig = {
  designWidth: 375,
  designHeight: 812,
  moderateFactor: 0.5,
  maxFontScale: 1.15, // Less scaling = less calculations
  minFontScale: 0.95,
  androidFontAdjustment: 0,
};

// 🚀 QUICK SETUP FUNCTIONS

/**
 * Apply modern iPhone configuration (recommended for most new apps)
 */
export const useModernDefaults = () => {
  configureResponsive(MODERN_IPHONE_CONFIG);
};

/**
 * Apply cross-platform balanced configuration
 */
export const useCrossPlatformDefaults = () => {
  configureResponsive(CROSS_PLATFORM_CONFIG);
};

/**
 * Apply accessibility-focused configuration
 */
export const useAccessibilityDefaults = () => {
  configureResponsive(ACCESSIBILITY_CONFIG);
};

// 📱 DEVICE-SPECIFIC AUTO CONFIGURATION

/**
 * Automatically configure based on current device characteristics
 * This is experimental - test thoroughly!
 */
export const useAutoConfiguration = () => {
  const { width } = Dimensions.get("window");
  const pixelRatio = PixelRatio.get();

  // iPhone 14/15 Pro Max
  if (width >= 428) {
    configureResponsive({
      designWidth: 428,
      designHeight: 926,
      moderateFactor: 0.4, // Less aggressive on large phones
      maxFontScale: 1.2,
    });
  }
  // Standard modern iPhone
  else if (width >= 375) {
    configureResponsive(MODERN_IPHONE_CONFIG);
  }
  // Smaller devices
  else {
    configureResponsive({
      designWidth: 360,
      designHeight: 800,
      moderateFactor: 0.6, // More responsive on small screens
      maxFontScale: 1.4,
    });
  }
};

// 🎨 USAGE EXAMPLES FOR EACH CONFIG

export const USAGE_EXAMPLES = {
  // Most apps should start with this:
  recommended: `
    import { useModernDefaults } from './ResponsiveConfig';
    
    // In your App.tsx or root component
    useModernDefaults();
  `,

  // For apps targeting both iOS and Android equally:
  crossPlatform: `
    import { useCrossPlatformDefaults } from './ResponsiveConfig';
    
    useCrossPlatformDefaults();
  `,

  // For custom configuration:
  custom: `
    import { configureResponsive } from './ResponsiveDesignSystem';
    
    configureResponsive({
      designWidth: 414,        // Your Figma design width
      designHeight: 896,       // Your Figma design height
      moderateFactor: 0.4,     // Less aggressive scaling
      maxFontScale: 1.2,       // Conservative font scaling
    });
  `,
};

// 📊 CONFIGURATION COMPARISON TABLE
export const CONFIG_COMPARISON = {
  "Modern iPhone (Recommended)": {
    designWidth: 390,
    useCase: "New apps, iPhone 14/15 designs",
    pros: "Future-proof, matches current devices",
    cons: "Slightly larger than older designs",
  },
  "Classic iPhone": {
    designWidth: 375,
    useCase: "Existing apps, iPhone 11/12/13 designs",
    pros: "Widely tested, stable",
    cons: "Slightly outdated for newest devices",
  },
  "Cross-Platform": {
    designWidth: 375,
    useCase: "iOS + Android equal priority",
    pros: "Balanced for both platforms",
    cons: "Compromise solution",
  },
  "Android-First": {
    designWidth: 360,
    useCase: "Android-primary apps",
    pros: "Optimized for Android variety",
    cons: "May not look ideal on iPhones",
  },
};

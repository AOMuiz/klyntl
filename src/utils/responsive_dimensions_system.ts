import { useCallback, useEffect, useState } from "react";
import { Dimensions, PixelRatio, Platform, ScaledSize } from "react-native";

// Type definitions
type ScaleType = "width" | "height" | "text" | "moderate";
type DeviceType = "phone" | "tablet" | "tv";
type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

interface ResponsiveConfig {
  designWidth?: number;
  designHeight?: number;
  moderateFactor?: number;
  maxFontScale?: number;
  minFontScale?: number;
  androidFontAdjustment?: number;
}

interface DeviceInfo {
  type: DeviceType;
  isTablet: boolean;
  isLandscape: boolean;
  aspectRatio: number;
  pixelDensity: number;
  isHighDensity: boolean;
  breakpoint: Breakpoint;
}

interface FontScaleOptions {
  maxScale?: number;
  minScale?: number;
  respectAccessibility?: boolean;
}

// Advanced Responsive Utility Class
class ResponsiveDesignSystem {
  private static instance: ResponsiveDesignSystem;
  private screenDimensions: ScaledSize = Dimensions.get("window");
  private dimensionSubscription?: any;
  private cache = new Map<string, number>();
  private subscribers = new Set<() => void>();

  // Configuration
  private designWidth = 375;
  private designHeight = 812;
  private defaultModerateFactor = 0.45;
  private maxFontScale = 1.25;
  private minFontScale = 0.85;
  private androidFontAdjustment = 1;

  // Breakpoints
  private readonly breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
  } as const;

  constructor() {
    this.setupDimensionListener();
  }

  public static getInstance(): ResponsiveDesignSystem {
    if (!ResponsiveDesignSystem.instance) {
      ResponsiveDesignSystem.instance = new ResponsiveDesignSystem();
    }
    return ResponsiveDesignSystem.instance;
  }

  /**
   * Sets up dimension change listener with compatibility for different RN versions
   */
  private setupDimensionListener = (): void => {
    const changeHandler = ({ window }: { window: ScaledSize }) => {
      this.screenDimensions = window;
      this.clearCache();
      this.notifySubscribers();
    };

    // Use the modern API (RN 0.65+)
    this.dimensionSubscription = Dimensions.addEventListener(
      "change",
      changeHandler
    );
  };

  /**
   * Cleanup dimension listener and clear cache
   */
  public cleanup = (): void => {
    if (this.dimensionSubscription?.remove) {
      this.dimensionSubscription.remove();
    }
    this.clearCache();
    this.subscribers.clear();
  };

  // Subscription management for hooks
  public subscribe = (callback: () => void): (() => void) => {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  };

  private notifySubscribers = (): void => {
    this.subscribers.forEach((callback) => callback());
  };

  // Getters for current screen dimensions
  private get screenWidth(): number {
    return this.screenDimensions.width;
  }

  private get screenHeight(): number {
    return this.screenDimensions.height;
  }

  /**
   * Configure the responsive system
   * @param config - Configuration options
   */
  public configure = (config: Partial<ResponsiveConfig>): void => {
    if (config.designWidth) this.designWidth = config.designWidth;
    if (config.designHeight) this.designHeight = config.designHeight;
    if (config.moderateFactor)
      this.defaultModerateFactor = config.moderateFactor;
    if (config.maxFontScale) this.maxFontScale = config.maxFontScale;
    if (config.minFontScale) this.minFontScale = config.minFontScale;
    if (config.androidFontAdjustment !== undefined)
      this.androidFontAdjustment = config.androidFontAdjustment;
    this.clearCache();
    this.notifySubscribers();
  };

  // Cache management
  private clearCache = (): void => {
    this.cache.clear();
  };

  private getCachedValue = (key: string, calculator: () => number): number => {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const value = calculator();
    this.cache.set(key, value);
    return value;
  };

  // Utility methods
  private validateInput = (value: number, methodName: string): void => {
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error(`${methodName}: Expected a valid number, got ${value}`);
    }
  };

  /**
   * Clamp a value between min and max
   */
  public clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  /**
   * Interpolate between two ranges
   */
  public interpolate = (
    value: number,
    inputRange: [number, number],
    outputRange: [number, number]
  ): number => {
    const [inputMin, inputMax] = inputRange;
    const [outputMin, outputMax] = outputRange;

    const ratio = (value - inputMin) / (inputMax - inputMin);
    return outputMin + ratio * (outputMax - outputMin);
  };

  /**
   * Scale based on screen height percentage
   */
  public hper = (percent: number): number => {
    this.validateInput(percent, "hper");
    const key = `hper_${percent}_${this.screenHeight}`;
    return this.getCachedValue(key, () =>
      PixelRatio.roundToNearestPixel((this.screenHeight * percent) / 100)
    );
  };

  /**
   * Scale based on screen width percentage
   */
  public wper = (percent: number): number => {
    this.validateInput(percent, "wper");
    const key = `wper_${percent}_${this.screenWidth}`;
    return this.getCachedValue(key, () =>
      PixelRatio.roundToNearestPixel((this.screenWidth * percent) / 100)
    );
  };

  /**
   * Scale based on width relative to design width
   */
  public scale = (size: number): number => {
    this.validateInput(size, "scale");
    const key = `scale_${size}_${this.screenWidth}`;
    return this.getCachedValue(key, () => {
      const [shortDimension] =
        this.screenWidth < this.screenHeight
          ? [this.screenWidth, this.screenHeight]
          : [this.screenHeight, this.screenWidth];
      const scaleWidth = shortDimension / this.designWidth;
      return PixelRatio.roundToNearestPixel(size * scaleWidth);
    });
  };

  /**
   * Scale based on height relative to design height
   */
  public verticalScale = (size: number): number => {
    this.validateInput(size, "verticalScale");
    const key = `verticalScale_${size}_${this.screenHeight}`;
    return this.getCachedValue(key, () => {
      const [, longDimension] =
        this.screenWidth < this.screenHeight
          ? [this.screenWidth, this.screenHeight]
          : [this.screenHeight, this.screenWidth];
      const scaleHeight = longDimension / this.designHeight;
      return PixelRatio.roundToNearestPixel(size * scaleHeight);
    });
  };

  /**
   * Moderate scaling - blend between original size and scaled size
   */
  public moderateScale = (
    size: number,
    factor = this.defaultModerateFactor
  ): number => {
    this.validateInput(size, "moderateScale");
    const key = `moderateScale_${size}_${factor}_${this.screenWidth}`;
    return this.getCachedValue(key, () => {
      const scaledSize = this.scale(size);
      return size + (scaledSize - size) * factor;
    });
  };

  /**
   * Moderate vertical scaling
   */
  public moderateVerticalScale = (
    size: number,
    factor = this.defaultModerateFactor
  ): number => {
    this.validateInput(size, "moderateVerticalScale");
    const key = `moderateVerticalScale_${size}_${factor}_${this.screenHeight}`;
    return this.getCachedValue(key, () => {
      const scaledSize = this.verticalScale(size);
      return size + (scaledSize - size) * factor;
    });
  };

  /**
   * Enhanced font scaling with accessibility support
   */
  public fontSize = (size: number, options?: FontScaleOptions): number => {
    this.validateInput(size, "fontSize");
    const {
      maxScale = this.maxFontScale,
      minScale = this.minFontScale,
      respectAccessibility = true,
    } = options || {};

    const key = `fontSize_${size}_${maxScale}_${minScale}_${respectAccessibility}_${this.screenWidth}`;
    return this.getCachedValue(key, () => {
      let scale = this.screenWidth / this.designWidth;

      if (respectAccessibility) {
        const fontScale = PixelRatio.getFontScale();
        scale *= Math.min(fontScale, maxScale);
      }

      scale = this.clamp(scale, minScale, maxScale);
      const newSize = size * scale;

      return Platform.OS === "ios"
        ? Math.round(PixelRatio.roundToNearestPixel(newSize))
        : Math.round(PixelRatio.roundToNearestPixel(newSize)) -
            this.androidFontAdjustment;
    });
  };

  /**
   * Responsive sizing based on orientation
   */
  public responsiveSize = (
    portraitSize: number,
    landscapeSize?: number
  ): number => {
    this.validateInput(portraitSize, "responsiveSize");
    const key = `responsiveSize_${portraitSize}_${landscapeSize}_${this.screenWidth}_${this.screenHeight}`;
    return this.getCachedValue(key, () => {
      const isPortrait = this.screenHeight > this.screenWidth;
      if (landscapeSize && !isPortrait) {
        return this.scale(landscapeSize);
      }
      return this.scale(portraitSize);
    });
  };

  /**
   * Get current breakpoint based on screen width
   */
  public getBreakpoint = (): Breakpoint => {
    const width = this.screenWidth;
    if (width >= this.breakpoints.xl) return "xl";
    if (width >= this.breakpoints.lg) return "lg";
    if (width >= this.breakpoints.md) return "md";
    if (width >= this.breakpoints.sm) return "sm";
    return "xs";
  };

  /**
   * Detect device type with improved logic
   */
  public getDeviceType = (): DeviceType => {
    // Check for TV first (most accurate)
    if (Platform.isTV || (Platform as any).isTVOS) return "tv";

    const shortDimension = Math.min(this.screenWidth, this.screenHeight);
    const longDimension = Math.max(this.screenWidth, this.screenHeight);

    // Updated thresholds for modern devices
    if (shortDimension <= 428 && longDimension <= 926) {
      // iPhone 14 Pro Max dimensions
      return "phone";
    }

    return "tablet";
  };

  /**
   * Get comprehensive device information
   */
  public getDeviceInfo = (): DeviceInfo => {
    const { width, height } = this.screenDimensions;
    const shortDimension = Math.min(width, height);
    const longDimension = Math.max(width, height);
    const aspectRatio = longDimension / shortDimension;
    const pixelDensity = PixelRatio.get();

    return {
      type: this.getDeviceType(),
      isTablet: shortDimension >= 768,
      isLandscape: width > height,
      aspectRatio,
      pixelDensity,
      isHighDensity: pixelDensity >= 3,
      breakpoint: this.getBreakpoint(),
    };
  };

  /**
   * Scale spacing values
   */
  public spacing = (baseSpacing: number): number => {
    return this.scale(baseSpacing);
  };

  /**
   * Dynamic scaling with type specification
   */
  public dynamicScale = (value: number, type: ScaleType = "width"): number => {
    this.validateInput(value, "dynamicScale");

    switch (type) {
      case "width":
        return this.scale(value);
      case "height":
        return this.verticalScale(value);
      case "text":
        return this.fontSize(value);
      case "moderate":
        return this.moderateScale(value);
      default:
        return value;
    }
  };

  // Convenience methods for breakpoint checks
  public isSmallScreen = (): boolean => {
    return this.getBreakpoint() === "xs";
  };

  public isMediumScreen = (): boolean => {
    return ["sm", "md"].includes(this.getBreakpoint());
  };

  public isLargeScreen = (): boolean => {
    return ["lg", "xl"].includes(this.getBreakpoint());
  };

  public isXLScreen = (): boolean => {
    return this.getBreakpoint() === "xl";
  };

  /**
   * Responsive value selection based on breakpoint with improved fallback logic
   */
  public responsiveValue = <T>(
    values: Partial<Record<Breakpoint, T>>
  ): T | undefined => {
    const currentBreakpoint = this.getBreakpoint();
    const currentBreakpointValue = this.breakpoints[currentBreakpoint];

    // First, try to find exact match
    if (values[currentBreakpoint] !== undefined) {
      return values[currentBreakpoint];
    }

    // Find the closest smaller breakpoint
    const availableBreakpoints = Object.keys(values) as Breakpoint[];
    const validBreakpoints = availableBreakpoints
      .filter((bp) => this.breakpoints[bp] <= currentBreakpointValue)
      .sort((a, b) => this.breakpoints[b] - this.breakpoints[a]); // Descending order

    if (validBreakpoints.length > 0) {
      return values[validBreakpoints[0]];
    }

    // Fallback to smallest available value
    const smallestBreakpoint = availableBreakpoints.sort(
      (a, b) => this.breakpoints[a] - this.breakpoints[b]
    )[0];

    return values[smallestBreakpoint];
  };

  // Screen dimension getters
  public getScreenWidth = (): number => this.screenWidth;
  public getScreenHeight = (): number => this.screenHeight;
  public getScreenDimensions = (): ScaledSize => this.screenDimensions;
}

// Create a single instance
const responsiveInstance = ResponsiveDesignSystem.getInstance();

// React Hooks for reactive responsive design
/**
 * Hook that provides responsive utilities and auto-updates on screen changes
 */
export const useResponsive = () => {
  const [, forceUpdate] = useState({});

  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    const unsubscribe = responsiveInstance.subscribe(triggerUpdate);
    return unsubscribe;
  }, [triggerUpdate]);

  return {
    // Core scaling methods
    scale: responsiveInstance.scale,
    verticalScale: responsiveInstance.verticalScale,
    moderateScale: responsiveInstance.moderateScale,
    moderateVerticalScale: responsiveInstance.moderateVerticalScale,
    fontSize: responsiveInstance.fontSize,
    spacing: responsiveInstance.spacing,

    // Percentage methods
    hper: responsiveInstance.hper,
    wper: responsiveInstance.wper,

    // Dynamic scaling
    ds: (value: number, type?: ScaleType) =>
      responsiveInstance.dynamicScale(value, type),

    // Device info (reactive)
    deviceInfo: responsiveInstance.getDeviceInfo(),
    breakpoint: responsiveInstance.getBreakpoint(),

    // Screen checks
    isSmallScreen: responsiveInstance.isSmallScreen(),
    isMediumScreen: responsiveInstance.isMediumScreen(),
    isLargeScreen: responsiveInstance.isLargeScreen(),
    isXLScreen: responsiveInstance.isXLScreen(),

    // Responsive utilities
    responsiveSize: responsiveInstance.responsiveSize,
    responsiveValue: responsiveInstance.responsiveValue,

    // Screen dimensions
    screenWidth: responsiveInstance.getScreenWidth(),
    screenHeight: responsiveInstance.getScreenHeight(),
  };
};

/**
 * Hook for device information that updates on screen changes
 */
export const useDeviceInfo = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState(() =>
    responsiveInstance.getDeviceInfo()
  );

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(responsiveInstance.getDeviceInfo());
    };

    const unsubscribe = responsiveInstance.subscribe(updateDeviceInfo);
    return unsubscribe;
  }, []);

  return deviceInfo;
};

/**
 * Hook for breakpoint that updates on screen changes
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState(() =>
    responsiveInstance.getBreakpoint()
  );

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(responsiveInstance.getBreakpoint());
    };

    const unsubscribe = responsiveInstance.subscribe(updateBreakpoint);
    return unsubscribe;
  }, []);

  return breakpoint;
};

// Export individual functions with proper context

/**
 * Dynamic scaling function - the Swiss Army knife of responsive scaling
 * @param value - The value to scale
 * @param type - Scaling type: 'width' (default), 'height', 'text', or 'moderate'
 * @example
 * ds(16) // Scale based on width
 * ds(16, 'text') // Scale as font size
 * ds(16, 'moderate') // Moderate scaling for icons/borders
 */
export const ds = (value: number, type?: ScaleType) =>
  responsiveInstance.dynamicScale(value, type);

/**
 * Scale differently based on device orientation
 * @param portraitSize - Size to use in portrait mode
 * @param landscapeSize - Optional size to use in landscape mode
 * @example
 * responsiveSize(300, 400) // 300 in portrait, 400 in landscape
 */
export const responsiveSize = (portraitSize: number, landscapeSize?: number) =>
  responsiveInstance.responsiveSize(portraitSize, landscapeSize);

/**
 * Get different values based on current breakpoint
 * @param values - Object with breakpoint keys and corresponding values
 * @example
 * responsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 }) // Returns appropriate value for current screen
 */
export const responsiveValue = <T>(values: Partial<Record<Breakpoint, T>>) =>
  responsiveInstance.responsiveValue(values);

// Legacy exports (maintained for backward compatibility)

/**
 * Width percentage scaling - scales based on screen width relative to design width
 * @param value - Value to scale
 * @example wp(100) // Scale 100 units based on width
 */
export const wp = (value: number) => responsiveInstance.scale(value);

/**
 * Height percentage scaling - scales based on screen height relative to design height
 * @param value - Value to scale
 * @example hp(50) // Scale 50 units based on height
 */
export const hp = (value: number) => responsiveInstance.verticalScale(value);

/**
 * Moderate scaling - blend between original and scaled size
 * @param value - Value to scale
 * @param factor - Scaling factor (0-1), defaults to 0.5
 * @example ms(24, 0.3) // Gentle scaling for icons that shouldn't get too big
 */
export const ms = (value: number, factor?: number) =>
  responsiveInstance.moderateScale(value, factor);

/**
 * Moderate vertical scaling
 * @param value - Value to scale vertically
 * @param factor - Scaling factor (0-1), defaults to 0.5
 */
export const mvs = (value: number, factor?: number) =>
  responsiveInstance.moderateVerticalScale(value, factor);

/**
 * Height percentage - get percentage of screen height
 * @param percent - Percentage value (0-100)
 * @example hper(50) // 50% of screen height
 */
export const hper = (percent: number) => responsiveInstance.hper(percent);

/**
 * Width percentage - get percentage of screen width
 * @param percent - Percentage value (0-100)
 * @example wper(90) // 90% of screen width
 */
export const wper = (percent: number) => responsiveInstance.wper(percent);

// Enhanced exports

/**
 * Font size scaling with accessibility support
 * @param size - Base font size
 * @param options - Font scaling options
 * @example
 * fontSize(16) // Standard responsive font
 * fontSize(16, { maxScale: 1.2, respectAccessibility: true })
 */
export const fontSize = (size: number, options?: FontScaleOptions) =>
  responsiveInstance.fontSize(size, options);

/**
 * Spacing utility - scale spacing values consistently
 * @param value - Spacing value to scale
 * @example spacing(16) // Consistent padding/margin scaling
 */
export const spacing = (value: number) => responsiveInstance.spacing(value);

/**
 * Get comprehensive device information
 * @returns DeviceInfo object with type, orientation, breakpoint, etc.
 */
export const getDeviceInfo = () => responsiveInstance.getDeviceInfo();

/**
 * Get current breakpoint (xs, sm, md, lg, xl)
 * @returns Current breakpoint based on screen width
 */
export const getBreakpoint = () => responsiveInstance.getBreakpoint();

/**
 * Check if current screen is small (xs breakpoint)
 * @returns Boolean indicating if screen is small
 */
export const isSmallScreen = () => responsiveInstance.isSmallScreen();

/**
 * Check if current screen is medium (sm or md breakpoint)
 * @returns Boolean indicating if screen is medium
 */
export const isMediumScreen = () => responsiveInstance.isMediumScreen();

/**
 * Check if current screen is large (lg or xl breakpoint)
 * @returns Boolean indicating if screen is large
 */
export const isLargeScreen = () => responsiveInstance.isLargeScreen();

/**
 * Check if current screen is extra large (xl breakpoint)
 * @returns Boolean indicating if screen is extra large
 */
export const isXLScreen = () => responsiveInstance.isXLScreen();

// Screen dimensions

/**
 * Get current screen width
 * @returns Current screen width in pixels
 */
export const screenWidth = () => responsiveInstance.getScreenWidth();

/**
 * Get current screen height
 * @returns Current screen height in pixels
 */
export const screenHeight = () => responsiveInstance.getScreenHeight();

// Configuration

/**
 * Configure the responsive system
 * @param config - Configuration options for design dimensions, scaling factors, etc.
 * @example
 * configureResponsive({
 *   designWidth: 414,
 *   designHeight: 896,
 *   maxFontScale: 1.5
 * })
 */
export const configureResponsive = (config: Partial<ResponsiveConfig>) =>
  responsiveInstance.configure(config);

/**
 * Cleanup responsive system (remove listeners, clear cache)
 * Call this when your app unmounts to prevent memory leaks
 */
export const cleanupResponsive = () => responsiveInstance.cleanup();

// Main instance export (single convention)
export default responsiveInstance;

// Type exports
export type {
  Breakpoint,
  DeviceInfo,
  DeviceType,
  FontScaleOptions,
  ResponsiveConfig,
  ScaleType,
};

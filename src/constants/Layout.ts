/**
 * Klyntl Spacing and Layout System
 *
 * Consistent spacing, layout dimensions, and design tokens
 * for the Klyntl customer platform.
 */

// Base spacing unit (8px grid system)
export const BASE_SPACING = 8;

// Spacing scale based on 8px grid
export const Spacing = {
  xs: BASE_SPACING * 0.5, // 4px
  sm: BASE_SPACING * 1, // 8px
  md: BASE_SPACING * 2, // 16px
  lg: BASE_SPACING * 3, // 24px
  xl: BASE_SPACING * 4, // 32px
  xl2: BASE_SPACING * 6, // 48px
  xl3: BASE_SPACING * 8, // 64px
  xl4: BASE_SPACING * 10, // 80px
  xl5: BASE_SPACING * 12, // 96px
  xl6: BASE_SPACING * 16, // 128px
};

// Border radius values
export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xl2: 20,
  xl3: 24,
  full: 9999,
};

// Shadow definitions
export const Shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl2: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Layout dimensions
export const Layout = {
  // Safe areas and margins
  safeAreaPadding: Spacing.md,
  screenMargin: Spacing.md,
  sectionSpacing: Spacing.xl,

  // Component dimensions
  buttonHeight: 48,
  inputHeight: 48,
  tabBarHeight: 56,
  headerHeight: 56,
  fabSize: 56,
  avatarSizeSmall: 32,
  avatarSizeMedium: 48,
  avatarSizeLarge: 64,

  // Card and container dimensions
  cardMinHeight: 80,
  cardMaxWidth: 400,
  containerMaxWidth: 768,

  // Touch targets (minimum 44px for accessibility)
  touchTargetMinSize: 44,

  // List items
  listItemHeight: 56,
  listItemHeightCompact: 48,
  listItemHeightExtended: 72,

  // Dividers and borders
  dividerHeight: 1,
  borderWidth: 1,
  focusBorderWidth: 2,
};

// Opacity values
export const Opacity = {
  disabled: 0.38,
  inactive: 0.6,
  pressed: 0.8,
  overlay: 0.5,
  backdrop: 0.7,
};

// Animation durations (in milliseconds)
export const AnimationDuration = {
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slowest: 800,
};

// Animation easing curves
export const AnimationEasing = {
  linear: "linear",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

// Z-index scale
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  tooltip: 300,
  overlay: 400,
  modal: 500,
  toast: 600,
  debug: 999,
};

// Breakpoints for responsive design
export const Breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

// Icon sizes
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xl2: 40,
  xl3: 48,
};

// Common layout patterns
export const LayoutPatterns = {
  // Flex patterns
  flexCenter: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  flexBetween: {
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },

  flexStart: {
    justifyContent: "flex-start" as const,
    alignItems: "center" as const,
  },

  flexEnd: {
    justifyContent: "flex-end" as const,
    alignItems: "center" as const,
  },

  // Container patterns
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenMargin,
  },

  containerCentered: {
    flex: 1,
    paddingHorizontal: Layout.screenMargin,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },

  // Card patterns
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },

  cardCompact: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Shadows.sm,
  },

  // Row patterns
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },

  rowBetween: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },

  // Section patterns
  section: {
    marginBottom: Layout.sectionSpacing,
  },

  sectionHeader: {
    marginBottom: Spacing.md,
  },
};

// Utility functions
export const getSpacing = (...values: (keyof typeof Spacing)[]) => {
  return values.map((value) => Spacing[value]);
};

export const getLayoutSize = (size: keyof typeof Layout) => {
  return Layout[size];
};

export const getShadow = (level: keyof typeof Shadows) => {
  return Shadows[level];
};

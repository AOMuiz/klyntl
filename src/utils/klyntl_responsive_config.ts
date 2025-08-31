/**
 * Klyntl Responsive Design System Configuration
 *
 * Complete setup for Klyntl's responsive design system with typography integration
 */

import { FontSizes, getTheme, LineHeights, Typography } from "@/constants";
import {
  configureResponsive,
  fontSize,
  ResponsiveConfig,
  wp as scale,
  spacing,
} from "./responsive_dimensions_system";

// 🎯 KLYNTL OPTIMAL CONFIGURATION
export const KLYNTL_RESPONSIVE_CONFIG: ResponsiveConfig = {
  designWidth: 390, // iPhone 14/15 standard (modern target)
  designHeight: 844, // iPhone 14/15 height
  moderateFactor: 0.45, // Slightly conservative for financial UI
  maxFontScale: 1.4, // Strong accessibility support for banking
  minFontScale: 0.9, // Ensure text remains readable
  androidFontAdjustment: 0.5, // Subtle Android adjustment
};

/**
 * Initialize Klyntl responsive design system
 * Call this once in your App.tsx root component
 */
export const initializeKlyntlDesignSystem = () => {
  configureResponsive(KLYNTL_RESPONSIVE_CONFIG);
};

// 📝 RESPONSIVE TYPOGRAPHY SYSTEM
// Integrates Typography with responsive scaling

/**
 * Responsive typography variants that scale with screen size
 * These automatically apply responsive scaling to the base typography
 */
export const ResponsiveTypography = {
  // Headings - scale responsively for mobile/tablet
  h1: {
    ...Typography.h1,
    fontSize: fontSize(FontSizes.xl6, { maxScale: 1.2 }), // Limit scaling for large headings
    lineHeight: fontSize(LineHeights.xl6, { maxScale: 1.2 }),
  },

  h2: {
    ...Typography.h2,
    fontSize: fontSize(FontSizes.xl5, { maxScale: 1.25 }),
    lineHeight: fontSize(LineHeights.xl5, { maxScale: 1.25 }),
  },

  h3: {
    ...Typography.h3,
    fontSize: fontSize(FontSizes.xl4, { maxScale: 1.3 }),
    lineHeight: fontSize(LineHeights.xl4, { maxScale: 1.3 }),
  },

  h4: {
    ...Typography.h4,
    fontSize: fontSize(FontSizes.xl3),
    lineHeight: fontSize(LineHeights.xl3),
  },

  h5: {
    ...Typography.h5,
    fontSize: fontSize(FontSizes.xl2),
    lineHeight: fontSize(LineHeights.xl2),
  },

  h6: {
    ...Typography.h6,
    fontSize: fontSize(FontSizes.xl),
    lineHeight: fontSize(LineHeights.xl),
  },

  // Body text - full responsive scaling for readability
  body1: {
    ...Typography.body1,
    fontSize: fontSize(FontSizes.md),
    lineHeight: fontSize(LineHeights.md),
  },

  body2: {
    ...Typography.body2,
    fontSize: fontSize(FontSizes.base),
    lineHeight: fontSize(LineHeights.base),
  },

  // UI elements - moderate scaling to maintain usability
  button: {
    ...Typography.button,
    fontSize: fontSize(FontSizes.base, { maxScale: 1.2 }),
    lineHeight: fontSize(LineHeights.base, { maxScale: 1.2 }),
  },

  caption: {
    ...Typography.caption,
    fontSize: fontSize(FontSizes.sm),
    lineHeight: fontSize(LineHeights.sm),
  },

  overline: {
    ...Typography.overline,
    fontSize: fontSize(FontSizes.xs, { maxScale: 1.1 }),
    lineHeight: fontSize(LineHeights.xs, { maxScale: 1.1 }),
  },

  // Financial/Currency - monospace with conservative scaling
  currency: {
    ...Typography.currency,
    fontSize: fontSize(FontSizes.lg, { maxScale: 1.15 }),
    lineHeight: fontSize(LineHeights.lg, { maxScale: 1.15 }),
  },

  currencyLarge: {
    ...Typography.currencyLarge,
    fontSize: fontSize(FontSizes.xl3, { maxScale: 1.1 }),
    lineHeight: fontSize(LineHeights.xl3, { maxScale: 1.1 }),
  },

  currencySmall: {
    ...Typography.currencySmall,
    fontSize: fontSize(FontSizes.base, { maxScale: 1.2 }),
    lineHeight: fontSize(LineHeights.base, { maxScale: 1.2 }),
  },

  // Form elements
  input: {
    ...Typography.input,
    fontSize: fontSize(FontSizes.md),
    lineHeight: fontSize(LineHeights.md),
  },

  label: {
    ...Typography.label,
    fontSize: fontSize(FontSizes.sm),
    lineHeight: fontSize(LineHeights.sm),
  },

  // Navigation
  tabLabel: {
    ...Typography.tabLabel,
    fontSize: fontSize(FontSizes.sm, { maxScale: 1.1 }),
    lineHeight: fontSize(LineHeights.sm, { maxScale: 1.1 }),
  },

  // Cards and lists
  cardTitle: {
    ...Typography.cardTitle,
    fontSize: fontSize(FontSizes.lg),
    lineHeight: fontSize(LineHeights.lg),
  },

  cardSubtitle: {
    ...Typography.cardSubtitle,
    fontSize: fontSize(FontSizes.base),
    lineHeight: fontSize(LineHeights.base),
  },

  listItem: {
    ...Typography.listItem,
    fontSize: fontSize(FontSizes.md),
    lineHeight: fontSize(LineHeights.md),
  },

  listItemSecondary: {
    ...Typography.listItemSecondary,
    fontSize: fontSize(FontSizes.sm),
    lineHeight: fontSize(LineHeights.sm),
  },
};

// 📏 RESPONSIVE SPACING SYSTEM
// Consistent spacing that scales with screen size

export const ResponsiveSpacing = {
  // Micro spacing
  xs: spacing(4), // 4px base
  sm: spacing(8), // 8px base
  md: spacing(12), // 12px base

  // Standard spacing
  base: spacing(16), // 16px base (most common)
  lg: spacing(20), // 20px base
  xl: spacing(24), // 24px base

  // Large spacing
  xl2: spacing(32), // 32px base
  xl3: spacing(40), // 40px base
  xl4: spacing(48), // 48px base
  xl5: spacing(64), // 64px base
  xl6: spacing(80), // 80px base
};

// 🎨 RESPONSIVE COMPONENT DIMENSIONS
// Common UI component sizes that scale appropriately

export const ResponsiveComponents = {
  // Button dimensions
  button: {
    height: scale(44), // Touch-friendly height
    minWidth: scale(88), // Minimum button width
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    borderRadius: scale(8),
  },

  buttonSmall: {
    height: scale(36),
    minWidth: scale(72),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(8),
    borderRadius: scale(6),
  },

  buttonLarge: {
    height: scale(52),
    minWidth: scale(120),
    paddingHorizontal: spacing(24),
    paddingVertical: spacing(16),
    borderRadius: scale(10),
  },

  // Input fields
  input: {
    height: scale(48),
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(14),
    borderRadius: scale(8),
    borderWidth: scale(1),
  },

  inputSmall: {
    height: scale(40),
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(10),
    borderRadius: scale(6),
    borderWidth: scale(1),
  },

  // Cards
  card: {
    borderRadius: scale(12),
    padding: spacing(16),
    margin: spacing(8),
    elevation: 2,
  },

  cardLarge: {
    borderRadius: scale(16),
    padding: spacing(24),
    margin: spacing(12),
    elevation: 4,
  },

  // Icons
  icon: {
    small: scale(16),
    medium: scale(20),
    large: scale(24),
    xlarge: scale(32),
  },

  // Avatar sizes
  avatar: {
    small: scale(32),
    medium: scale(40),
    large: scale(56),
    xlarge: scale(80),
  },

  // Navigation
  tabBar: {
    height: scale(56),
    iconSize: scale(24),
  },

  header: {
    height: scale(56),
    paddingHorizontal: spacing(16),
  },

  // Modals and overlays
  modal: {
    borderRadius: scale(16),
    padding: spacing(24),
    margin: spacing(16),
  },

  bottomSheet: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
  },

  // Financial specific components
  currencyDisplay: {
    padding: spacing(16),
    borderRadius: scale(8),
    minHeight: scale(60),
  },

  transactionItem: {
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(12),
    minHeight: scale(64),
  },

  accountCard: {
    borderRadius: scale(12),
    padding: spacing(20),
    margin: spacing(8),
    minHeight: scale(120),
  },
};

// 🔧 RESPONSIVE UTILITIES FOR KLYNTL
// Custom utilities specific to financial app needs

/**
 * Get responsive dimensions for common Klyntl components
 */
export const getKlyntlComponentSize = (
  component: keyof typeof ResponsiveComponents
) => {
  return ResponsiveComponents[component];
};

/**
 * Currency amount text style with proper scaling
 * @param amount - The currency amount
 * @param variant - 'small' | 'medium' | 'large'
 */
export const getCurrencyTextStyle = (
  variant: "small" | "medium" | "large" = "medium"
) => {
  const styles = {
    small: ResponsiveTypography.currencySmall,
    medium: ResponsiveTypography.currency,
    large: ResponsiveTypography.currencyLarge,
  };

  return styles[variant];
};

/**
 * Get responsive padding for container types
 * @param type - Container type: 'screen' | 'card' | 'modal' | 'section'
 */
export const getContainerPadding = (
  type: "screen" | "card" | "modal" | "section"
) => {
  const paddingMap = {
    screen: ResponsiveSpacing.base, // 16px scaled
    card: ResponsiveSpacing.md, // 12px scaled
    modal: ResponsiveSpacing.xl, // 24px scaled
    section: ResponsiveSpacing.lg, // 20px scaled
  };

  return paddingMap[type];
};

/**
 * Get responsive margin for layout elements
 * @param size - Margin size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 */
export const getResponsiveMargin = (size: keyof typeof ResponsiveSpacing) => {
  return ResponsiveSpacing[size];
};

// 🎨 COMPLETE KLYNTL DESIGN TOKENS
// Everything you need for consistent Klyntl design

export const KlyntlDesignTokens = {
  // Typography
  typography: ResponsiveTypography,

  // Spacing
  spacing: ResponsiveSpacing,

  // Components
  components: ResponsiveComponents,

  // Utilities
  utils: {
    fontSize,
    spacing,
    scale,
    getCurrencyTextStyle,
    getContainerPadding,
    getResponsiveMargin,
    getKlyntlComponentSize,
  },

  // Theme functions
  theme: {
    getTheme,
    light: () => getTheme(false),
    dark: () => getTheme(true),
  },
};

// 🚀 QUICK SETUP FUNCTION
/**
 * Complete Klyntl design system initialization
 * Call this once in your App.tsx
 *
 * @example
 * import { setupKlyntlDesignSystem } from './design-system';
 *
 * export default function App() {
 *   setupKlyntlDesignSystem();
 *   return <YourApp />;
 * }
 */
export const setupKlyntlDesignSystem = () => {
  // Initialize responsive system
  initializeKlyntlDesignSystem();

  console.log("✅ Klyntl Design System initialized with responsive scaling");
  console.log("📱 Design base: 390x844 (iPhone 14/15)");
  console.log("🎨 Typography: System fonts with responsive scaling");
  console.log("📐 Spacing: 16px base with responsive scaling");
};

// 📖 USAGE EXAMPLES FOR KLYNTL DEVELOPERS

export const KLYNTL_USAGE_EXAMPLES = {
  // 1. Basic component styling
  basicUsage: `
import { ResponsiveTypography, ResponsiveSpacing, ResponsiveComponents } from './KlyntlDesign';

const TransactionCard = () => (
  <View style={ResponsiveComponents.accountCard}>
    <Text style={ResponsiveTypography.cardTitle}>Account Balance</Text>
    <Text style={ResponsiveTypography.currencyLarge}>$1,234.56</Text>
    <Text style={ResponsiveTypography.caption}>Last updated today</Text>
  </View>
);
  `,

  // 2. Using responsive utilities
  utilityUsage: `
import { getContainerPadding, getCurrencyTextStyle } from './KlyntlDesign';

const AccountScreen = () => (
  <ScrollView style={{ padding: getContainerPadding('screen') }}>
    <Text style={getCurrencyTextStyle('large')}>$5,678.90</Text>
  </ScrollView>
);
  `,

  // 3. Custom responsive styles
  customStyles: `
import { fontSize, spacing, scale } from './ResponsiveDesignSystem';

const styles = StyleSheet.create({
  customCard: {
    padding: spacing(20),          // 20px scaled
    borderRadius: scale(12),       // 12px scaled
    marginVertical: spacing(8),    // 8px scaled
  },
  customText: {
    fontSize: fontSize(18),        // 18px with accessibility scaling
    lineHeight: fontSize(24),      // 24px line height scaled
  },
});
  `,

  // 4. Responsive component with hooks
  hookUsage: `
import { useResponsive } from './ResponsiveDesignSystem';
import { ResponsiveTypography } from './KlyntlDesign';

const AdaptiveTransactionList = () => {
  const { isSmallScreen, responsiveValue } = useResponsive();
  
  const columns = responsiveValue({
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
  });
  
  return (
    <FlatList
      numColumns={columns}
      data={transactions}
      renderItem={({ item }) => (
        <View style={{
          flex: 1,
          margin: isSmallScreen ? spacing(4) : spacing(8),
        }}>
          <Text style={ResponsiveTypography.listItem}>
            {item.description}
          </Text>
          <Text style={ResponsiveTypography.currency}>
            {item.amount}
          </Text>
        </View>
      )}
    />
  );
};
  `,
};

// 🎯 KLYNTL-SPECIFIC BREAKPOINT BEHAVIOR
// Financial apps often need specific responsive behavior

/**
 * Klyntl-optimized breakpoint configurations
 * Tailored for financial app UI patterns
 */
export const KlyntlBreakpoints = {
  // Transaction list columns
  transactionColumns: {
    xs: 1, // Single column on phones
    sm: 1, // Still single on small tablets
    md: 2, // Two columns on medium tablets
    lg: 3, // Three columns on large tablets
    xl: 4, // Four columns on very large screens
  },

  // Account card grid
  accountCardGrid: {
    xs: 1, // One card per row on phone
    sm: 2, // Two cards on small tablet
    md: 2, // Still two on medium
    lg: 3, // Three on large tablet
    xl: 4, // Four on desktop-like screens
  },

  // Dashboard widget layout
  dashboardWidgets: {
    xs: 1, // Stack vertically on phone
    sm: 2, // 2x2 grid on tablet
    md: 3, // 3 column layout
    lg: 4, // 4 column layout
    xl: 5, // 5 column for large screens
  },

  // Navigation patterns
  bottomTabIcons: {
    xs: scale(20), // Smaller icons on small screens
    sm: scale(22),
    md: scale(24),
    lg: scale(26),
    xl: scale(28),
  },
};

// 💡 DESIGN SYSTEM HELPERS
// Utility functions for common Klyntl design patterns

/**
 * Generate consistent card styles for Klyntl
 * @param variant - Card variant: 'default' | 'elevated' | 'outlined'
 * @param size - Card size: 'small' | 'medium' | 'large'
 */
export const createKlyntlCardStyle = (
  variant: "default" | "elevated" | "outlined" = "default",
  size: "small" | "medium" | "large" = "medium"
) => {
  const baseStyle = {
    borderRadius: scale(12),
    backgroundColor: "white", // This would use theme colors in practice
  };

  const sizeStyles = {
    small: {
      padding: spacing(12),
      margin: spacing(6),
    },
    medium: {
      padding: spacing(16),
      margin: spacing(8),
    },
    large: {
      padding: spacing(24),
      margin: spacing(12),
    },
  };

  const variantStyles = {
    default: {},
    elevated: {
      elevation: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: scale(4),
    },
    outlined: {
      borderWidth: scale(1),
      borderColor: "#E0E0E0", // This would use theme colors
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

/**
 * Generate responsive button styles for Klyntl
 * @param variant - Button variant: 'primary' | 'secondary' | 'text'
 * @param size - Button size: 'small' | 'medium' | 'large'
 */
export const createKlyntlButtonStyle = (
  variant: "primary" | "secondary" | "text" = "primary",
  size: "small" | "medium" | "large" = "medium"
) => {
  const sizeMap = {
    small: ResponsiveComponents.buttonSmall,
    medium: ResponsiveComponents.button,
    large: ResponsiveComponents.buttonLarge,
  };

  const textStyle = {
    small: ResponsiveTypography.caption,
    medium: ResponsiveTypography.button,
    large: ResponsiveTypography.h6,
  };

  return {
    container: sizeMap[size],
    text: textStyle[size],
  };
};

// 📱 DEVICE-SPECIFIC OPTIMIZATIONS
// Klyntl-specific optimizations for different device types

export const KlyntlDeviceOptimizations = {
  // Phone optimizations
  phone: {
    maxCardWidth: scale(350),
    preferredPadding: ResponsiveSpacing.base,
    compactSpacing: ResponsiveSpacing.sm,
  },

  // Tablet optimizations
  tablet: {
    maxCardWidth: scale(400),
    preferredPadding: ResponsiveSpacing.lg,
    expandedSpacing: ResponsiveSpacing.xl,
    useMultiColumn: true,
  },

  // Large screen optimizations
  desktop: {
    maxContentWidth: scale(1200),
    sidebarWidth: scale(280),
    preferredPadding: ResponsiveSpacing.xl2,
  },
};

// Export everything
export default KlyntlDesignTokens;

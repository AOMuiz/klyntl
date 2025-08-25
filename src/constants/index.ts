/**
 * Klyntl Design System
 *
 * Central export for all design tokens, themes, and utilities.
 * Import from this file to access the complete design system.
 */

// Colors and branding
export * from "./Colors";

// Typography system
export * from "./Typography";

// Theme configuration
export * from "./Theme";

// Layout and spacing
export * from "./Layout";

// Theme provider component
export { KlyntlThemeProvider, useAppTheme } from "../components/ThemeProvider";

// Re-export common Paper components with theme applied
export {
  ActivityIndicator,
  Appbar,
  // Data display
  Avatar,
  Badge,
  Banner,
  // Navigation
  BottomNavigation,
  Button,
  Caption,
  // Layout components
  Card,
  Checkbox,
  Chip,
  DataTable,
  Dialog,
  Divider,
  FAB,
  Headline,
  IconButton,
  List,
  // Selection controls
  Menu,
  // Utils
  Provider as PaperProvider,
  Paragraph,
  Portal,
  // Progress indicators
  ProgressBar,
  RadioButton,
  // Feedback components
  Snackbar,
  Subheading,
  Surface,
  Switch,
  // Display components
  Text,
  // Input components
  TextInput,
  Title,
  TouchableRipple,
} from "react-native-paper";

// Common style utilities
export const StyleUtils = {
  // Apply theme-aware styles
  applyTheme: (lightStyles: any, darkStyles: any, isDark: boolean) => {
    return isDark ? { ...lightStyles, ...darkStyles } : lightStyles;
  },

  // Create responsive styles
  createResponsiveStyle: (
    baseStyle: any,
    breakpoint: number,
    responsiveStyle: any
  ) => {
    // This would need to be implemented based on screen dimensions
    return baseStyle;
  },

  // Merge spacing utilities
  mergeSpacing: (horizontal?: number, vertical?: number) => ({
    paddingHorizontal: horizontal,
    paddingVertical: vertical,
  }),

  // Apply shadow based on elevation
  applyShadow: (elevation: number, isDark: boolean = false) => {
    const shadowColor = isDark ? "#000000" : "#000000";
    return {
      shadowColor,
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: elevation,
      elevation,
    };
  },
};

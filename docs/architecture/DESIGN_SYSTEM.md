# Klyntl Design System

A comprehensive design system for the Klyntl customer platform, built with React Native Paper and following Material Design 3 principles.

## Overview

The Klyntl Design System provides a consistent visual language and user experience across the entire application. It includes brand colors, typography, spacing, layout utilities, and themed components.

## Features

- 🎨 **Brand-Consistent Colors** - Nigerian business-focused color palette
- 📝 **Typography System** - Hierarchical text styles with excellent readability
- 📏 **8px Grid System** - Consistent spacing and layout
- 🌙 **Dark Mode Support** - Automatic light/dark theme switching
- 📱 **Mobile-First** - Optimized for React Native and Expo
- ♿ **Accessibility** - WCAG compliant design tokens
- 🧩 **Component Library** - Pre-styled React Native Paper components

## Installation

The design system is already set up in this project. To use it in your components:

```tsx
import { useAppTheme, KlyntlThemeProvider } from "@/constants";
import { Text, Button, Card } from "react-native-paper";
```

## Core Concepts

### Colors

The color system is built around Nigerian business context with green symbolizing growth and prosperity:

```tsx
import { BrandColors, Colors } from "@/constants/Colors";

// Complete shade system - All 10 shades available
BrandColors.primary[50]; // #ecfdf5 - Very light
BrandColors.primary[100]; // #d1fae5 - Light
BrandColors.primary[200]; // #a7f3d0 - Lighter
BrandColors.primary[300]; // #6ee7b7 - Light
BrandColors.primary[400]; // #34d399 - Medium light
BrandColors.primary[500]; // #10b981 - Medium
BrandColors.primary[600]; // #059669 - Main (Primary)
BrandColors.primary[700]; // #047857 - Medium dark
BrandColors.primary[800]; // #065f46 - Dark
BrandColors.primary[900]; // #064e3b - Very dark

// Legacy aliases still work for backward compatibility
BrandColors.primary.main; // #059669 - Same as [600]
BrandColors.primary.light; // #10b981 - Same as [500]
BrandColors.primary.dark; // #047857 - Same as [700]

BrandColors.secondary.main; // #0c4a6e - Deep Blue
BrandColors.secondary.light; // #FF8A65 - Light variant
BrandColors.secondary.lighter; // #FFAB91 - Lighter variant
BrandColors.secondary.dark; // #E64A19 - Dark variant
BrandColors.secondary.darker; // #BF360C - Darker variant
BrandColors.secondary.surface; // #FFF3E0 - Background surface

BrandColors.accent.main; // #9333ea - Premium purple
BrandColors.accent.light; // #BA68C8 - Light variant
BrandColors.accent.lighter; // #CE93D8 - Lighter variant
BrandColors.accent.dark; // #7B1FA2 - Dark variant
BrandColors.accent.darker; // #4A148C - Darker variant
BrandColors.accent.surface; // #F3E5F5 - Background surface
```

### Typography

Hierarchical typography system with platform-optimized fonts:

```tsx
import { Typography } from "@/constants/Typography";

// Usage in styles
const styles = StyleSheet.create({
  title: Typography.h2,
  body: Typography.body1,
  currency: Typography.currency,
});
```

### Spacing & Layout

8px grid system for consistent spacing:

```tsx
import { Spacing, Layout, LayoutPatterns } from "@/constants/Layout";

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md, // 16px
    ...LayoutPatterns.flexBetween,
  },
  avatar: {
    width: Layout.avatarSizeMedium, // 48px
  },
});
```

## Usage Examples

### Using the Theme Provider

Wrap your app with the theme provider:

```tsx
import { KlyntlThemeProvider } from "@/constants";

export default function App() {
  return (
    <KlyntlThemeProvider>
      <YourAppContent />
    </KlyntlThemeProvider>
  );
}
```

### Accessing Theme in Components

```tsx
import { useAppTheme } from "@/constants";

export function MyComponent() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello Klyntl!</Text>
    </View>
  );
}
```

### Using Pre-styled Components

```tsx
import { Card, Button, Text } from "react-native-paper";

export function CustomerCard({ customer }) {
  return (
    <Card>
      <Card.Content>
        <Text variant="titleMedium">{customer.name}</Text>
        <Text variant="bodySmall">{customer.phone}</Text>
        <Button mode="contained">View Details</Button>
      </Card.Content>
    </Card>
  );
}
```

## Design Tokens

### Colors

- **Primary**: Professional Emerald Green with **complete 10-shade system** (50-900)
- **Secondary**: Deep Blue with **complete 10-shade system** (50-900)
- **Accent**: Premium Purple with **complete 10-shade system** (50-900)
- **Success**: Professional Green with **complete 10-shade system** (50-900)
- **Warning**: Amber with **complete 10-shade system** (50-900)
- **Error**: Red with **complete 10-shade system** (50-900)
- **Neutral**: Comprehensive Slate Gray scale (50-900)

### Typography Scale

- **Display**: 48px, 42px, 36px - Large headings
- **Headline**: 32px, 28px, 24px - Section headings
- **Title**: 20px, 16px, 14px - Card titles, labels
- **Body**: 16px, 14px - Main content text
- **Label**: 14px, 12px, 10px - UI elements

### Spacing Scale (8px grid)

- **xs**: 4px - Tight spacing
- **sm**: 8px - Small spacing
- **md**: 16px - Medium spacing (base)
- **lg**: 24px - Large spacing
- **xl**: 32px - Extra large spacing
- **xl2+**: 48px+ - Section spacing

## Component Guidelines

### Cards

- Use `BorderRadius.lg` (12px) for cards
- Apply `Shadows.md` for elevation
- Maintain `Spacing.md` internal padding

### Buttons

- Minimum touch target: 44px
- Use `Typography.button` for text
- Apply theme colors for consistency

### Text Input

- Use consistent border radius
- Apply proper spacing for labels
- Maintain accessibility contrast

### Currency Display

- Use `Typography.currency` for amounts
- Apply semantic colors (green for positive, red for negative)
- Use monospace font for alignment

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Leverage the theme context** for dynamic color switching
3. **Follow the 8px grid** for spacing consistency
4. **Use semantic color names** (primary, secondary, error) over hex values
5. **Test in both light and dark modes**
6. **Ensure minimum touch targets** (44px) for accessibility
7. **Use appropriate typography hierarchy**

## Customization

To customize the design system, modify the files in `/src/constants/`:

- `Colors.ts` - Brand colors and theme colors
- `Typography.ts` - Font families, sizes, and text styles
- `Layout.ts` - Spacing, dimensions, and layout patterns
- `Theme.ts` - React Native Paper theme configuration

## Contributing

When adding new design tokens:

1. Follow the existing naming conventions
2. Ensure light and dark mode variants
3. Add proper TypeScript types
4. Update this documentation
5. Test with existing components

## Support

For questions about the design system, please refer to:

- React Native Paper documentation
- Material Design 3 guidelines
- This README and inline code comments

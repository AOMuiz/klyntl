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

// Brand colors
BrandColors.primary.main; // #2E7D32 - Forest Green
BrandColors.secondary.main; // #1976D2 - Professional Blue
BrandColors.currency.positive; // #2E7D32 - For gains
BrandColors.currency.negative; // #D32F2F - For losses
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

- **Primary**: Forest Green (#2E7D32) - Main brand color
- **Secondary**: Professional Blue (#1976D2) - Accent color
- **Success**: Green variants for positive states
- **Warning**: Orange variants for attention
- **Error**: Red variants for errors
- **Neutral**: Gray scale for text and backgrounds

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

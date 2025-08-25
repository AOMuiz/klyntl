# Klyntl Design System Setup Guide

## ✅ Setup Complete!

React Native Paper has been successfully configured with a comprehensive design system for the Klyntl customer platform.

## What's Been Added

### 1. **Comprehensive Color System** (`/src/constants/Colors.ts`)

- Nigerian business-focused brand colors (Forest Green primary)
- Light and dark mode support
- Semantic color tokens (success, warning, error)
- Currency-specific colors for financial displays

### 2. **Typography System** (`/src/constants/Typography.ts`)

- Platform-optimized font families
- Hierarchical text styles (h1-h6, body, labels)
- Special currency formatting styles
- Consistent spacing and line heights

### 3. **Layout & Spacing** (`/src/constants/Layout.ts`)

- 8px grid system for consistent spacing
- Predefined border radius values
- Shadow definitions for elevation
- Common layout patterns and utilities

### 4. **React Native Paper Theme** (`/src/constants/Theme.ts`)

- Custom Material Design 3 theme
- Branded color integration
- Font configuration for Paper components
- Component-specific styling overrides

### 5. **Theme Provider** (`/src/components/ThemeProvider.tsx`)

- React context for theme access
- Automatic light/dark mode detection
- Consistent theme application across app

### 6. **Design System Demo** (`/src/components/DesignSystemDemo.tsx`)

- Visual reference for all design tokens
- Component usage examples
- Interactive demo of the design system

## How to Use

### 1. Import Design Tokens

```tsx
import { BrandColors, Colors, Typography, Spacing, Layout } from "@/constants";
```

### 2. Use Theme Context

```tsx
import { useAppTheme } from "@/constants";

function MyComponent() {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello!</Text>
    </View>
  );
}
```

### 3. Use React Native Paper Components

```tsx
import { Card, Button, Text } from "react-native-paper";

function CustomerCard() {
  return (
    <Card>
      <Card.Content>
        <Text variant="titleMedium">Customer Name</Text>
        <Button mode="contained">Action</Button>
      </Card.Content>
    </Card>
  );
}
```

## Key Features

### 🎨 **Brand Colors**

- **Primary**: `#2E7D32` (Forest Green) - Growth and prosperity
- **Secondary**: `#1976D2` (Professional Blue) - Trust and reliability
- **Currency Positive**: Green tones for gains
- **Currency Negative**: Red tones for losses

### 📝 **Typography Hierarchy**

- **Display**: Large headings (36px-48px)
- **Headline**: Section headings (24px-32px)
- **Title**: Card titles (14px-20px)
- **Body**: Content text (14px-16px)
- **Currency**: Monospace for amounts

### 📏 **Spacing System**

- **xs**: 4px - Tight spacing
- **sm**: 8px - Small spacing
- **md**: 16px - Base spacing
- **lg**: 24px - Large spacing
- **xl**: 32px+ - Section spacing

## Quick Start Examples

### Customer Card Component

```tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Avatar } from "react-native-paper";
import { useAppTheme, Spacing, Typography, Layout } from "@/constants";

export function CustomerCard({ customer }) {
  const { colors } = useAppTheme();

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.row}>
          <Avatar.Text size={Layout.avatarSizeMedium} label="JD" />
          <View style={styles.info}>
            <Text variant="titleMedium">{customer.name}</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {customer.phone}
            </Text>
          </View>
          <Text
            style={[Typography.currency, { color: colors.currencyPositive }]}
          >
            ₦{customer.totalSpent.toLocaleString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
});
```

### Form Component

```tsx
import React from "react";
import { View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { Spacing } from "@/constants";

export function CustomerForm() {
  return (
    <View style={{ padding: Spacing.md }}>
      <Text variant="headlineSmall">Add Customer</Text>

      <TextInput
        label="Customer Name"
        mode="outlined"
        style={{ marginTop: Spacing.md }}
      />

      <TextInput
        label="Phone Number"
        mode="outlined"
        style={{ marginTop: Spacing.sm }}
      />

      <Button mode="contained" style={{ marginTop: Spacing.lg }}>
        Save Customer
      </Button>
    </View>
  );
}
```

## Next Steps

1. **Update existing components** to use the new design system
2. **Test dark mode** by changing device settings
3. **Customize colors** in `Colors.ts` if needed
4. **Add new components** following the established patterns
5. **Review the demo component** for implementation examples

## Files Created/Modified

- ✅ `/src/constants/Colors.ts` - Brand color system
- ✅ `/src/constants/Typography.ts` - Typography scale
- ✅ `/src/constants/Layout.ts` - Spacing and layout
- ✅ `/src/constants/Theme.ts` - React Native Paper theme
- ✅ `/src/constants/index.ts` - Design system exports
- ✅ `/src/components/ThemeProvider.tsx` - Theme context
- ✅ `/src/components/DesignSystemDemo.tsx` - Demo component
- ✅ `/src/app/_layout.tsx` - Updated with theme provider
- ✅ `/src/components/CustomerCard.tsx` - Updated to use design system
- ✅ `/DESIGN_SYSTEM.md` - Comprehensive documentation
- ✅ Package dependencies updated

## Resources

- [React Native Paper Documentation](https://reactnativepaper.com/)
- [Material Design 3](https://m3.material.io/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)

Your Klyntl design system is now ready to use! 🎉

/**
 * Example: How to use the Simplified Klyntl Theme System
 *
 * This demonstrates the simplified approach to theming that integrates
 * seamlessly with React Native Paper while providing access to all color shades.
 */

import {
  ExtendedKlyntlTheme,
  getKlyntlTheme,
  useKlyntlColors,
} from "@/constants/KlyntlTheme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  PaperProvider,
  Text,
  useTheme,
} from "react-native-paper";

// 1. Setup your app with the Klyntl theme
export const App = () => {
  const colorScheme = useColorScheme();
  const theme = getKlyntlTheme(colorScheme);

  return (
    <PaperProvider theme={theme}>
      <ExampleComponent />
    </PaperProvider>
  );
};

// 2. Use the theme in components - Three different approaches:

// Approach A: Use Paper's built-in theming (automatic color handling)
const PaperComponentExample = () => {
  // Paper components automatically use theme.colors.primary, secondary, etc.
  return (
    <View style={{ padding: 16 }}>
      <Button mode="contained">Primary Button</Button>
      <Button mode="outlined" style={{ marginTop: 8 }}>
        Secondary Button
      </Button>
      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium">
            This card uses Paper&apos;s automatic theming
          </Text>
          <Text variant="bodyMedium">
            Colors are automatically applied from your theme!
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

// Approach B: Access specific color shades for custom styling
const CustomStyledComponent = () => {
  const theme = useTheme<ExtendedKlyntlTheme>();
  const colors = useKlyntlColors(theme);

  return (
    <View style={{ padding: 16 }}>
      {/* Use any shade from any color family */}
      <View style={[styles.lightCard, { backgroundColor: colors.primary[50] }]}>
        <Text style={{ color: colors.primary[900] }}>
          Very light primary background
        </Text>
      </View>

      <View
        style={[styles.mediumCard, { backgroundColor: colors.secondary[200] }]}
      >
        <Text style={{ color: colors.secondary[800] }}>
          Light secondary background
        </Text>
      </View>

      <View style={[styles.darkCard, { backgroundColor: colors.accent[700] }]}>
        <Text style={{ color: colors.accent[50] }}>Dark accent background</Text>
      </View>

      {/* Custom success/warning colors */}
      <View
        style={[
          styles.statusCard,
          { backgroundColor: colors.custom.successContainer },
        ]}
      >
        <Text style={{ color: colors.custom.onSuccessContainer }}>
          Success message
        </Text>
      </View>
    </View>
  );
};

// Approach C: Access brand colors directly for maximum flexibility
const BrandColorComponent = () => {
  const theme = useTheme<ExtendedKlyntlTheme>();

  return (
    <View style={{ padding: 16 }}>
      {/* Direct access to brand colors */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.brandColors.primary[100] },
        ]}
      >
        <Text style={{ color: theme.brandColors.primary[800] }}>
          Direct brand color access
        </Text>
      </View>

      {/* Mix Paper colors with brand colors */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.brandColors.primary[300],
            borderWidth: 1,
          },
        ]}
      >
        <Text style={{ color: theme.colors.onSurface }}>
          Mixed theming approach
        </Text>
      </View>
    </View>
  );
};

// Complete example component
const ExampleComponent = () => {
  return (
    <View style={{ flex: 1 }}>
      <PaperComponentExample />
      <CustomStyledComponent />
      <BrandColorComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  lightCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  mediumCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  darkCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
});

/*
Key Benefits of This Simplified Approach:

1. **React Native Paper Integration**: Paper components automatically use your theme colors
2. **Direct Shade Access**: Easy access to any shade of any color family
3. **Type Safety**: Full TypeScript support with autocomplete
4. **Simplified API**: No more complex color mapping - just use theme.shades.primary[500]
5. **Backward Compatibility**: Works with existing Paper components without changes
6. **Flexible**: Can mix Paper theming with direct brand color access

Usage Summary:
- Use Paper components normally - they automatically get your brand colors
- For custom components, use `useKlyntlColors(theme)` for easy shade access
- For maximum control, access `theme.brandColors` directly
- Custom colors (success/warning) are available via `theme.customColors`
*/

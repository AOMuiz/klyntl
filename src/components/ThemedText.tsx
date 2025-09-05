import { useThemeColor } from "@/hooks/useThemeColor";
import { fontSize } from "@/utils/responsive_dimensions_system";
import { StyleSheet, Text, type TextProps } from "react-native";

// Uncomment and adjust the import according to your theme setup
import type { ExtendedKlyntlTheme } from "@/constants/KlyntlTheme";
import { useTheme } from "react-native-paper";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "link"
    | "caption"
    | "button"
    | "h1"
    | "h2"
    | "h3"
    | "body1"
    | "body2";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  // Recommended (optional) change — keep current implementation but consider using
  // React Native Paper's theme as the default color source so ThemedText always
  // follows the app Paper theme (forcedTheme, system theme, and runtime toggles).
  // To apply this, you can uncomment the example below and import `useTheme`
  // from 'react-native-paper' and `ExtendedKlyntlTheme` from your theme constants.

  const paperTheme = useTheme<ExtendedKlyntlTheme>();
  const paperDefault = paperTheme?.colors?.onBackground;
  // Keep existing useThemeColor behavior for explicit overrides
  const colorFromProps = useThemeColor(
    { light: lightColor, dark: darkColor },
    "text"
  );
  // Prefer explicit prop colors, otherwise fall back to Paper theme's onBackground
  const color = colorFromProps ?? paperDefault;

  // const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        styles[type], // much cleaner mapping
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Standard text variants
  default: {
    fontSize: fontSize(16), // Proper responsive text scaling
    lineHeight: fontSize(24), // Scaled line height
    fontWeight: "400",
  },

  defaultSemiBold: {
    fontSize: fontSize(16),
    lineHeight: fontSize(24),
    fontWeight: "600",
  },

  // Headings with proper scaling limits
  title: {
    fontSize: fontSize(32, { maxScale: 1.2 }), // Limit large text scaling
    lineHeight: fontSize(40, { maxScale: 1.2 }),
    fontWeight: "700",
  },

  subtitle: {
    fontSize: fontSize(20, { maxScale: 1.25 }),
    lineHeight: fontSize(28, { maxScale: 1.25 }),
    fontWeight: "600",
  },

  // UI elements with conservative scaling
  link: {
    fontSize: fontSize(16),
    lineHeight: fontSize(24),
    fontWeight: "500",
    color: "#0a7ea4", // You might want to move this to theme colors
  },

  caption: {
    fontSize: fontSize(12),
    lineHeight: fontSize(16),
    fontWeight: "400",
  },

  button: {
    fontSize: fontSize(16, { maxScale: 1.1 }), // Buttons shouldn't scale too much
    lineHeight: fontSize(24, { maxScale: 1.1 }),
    fontWeight: "500",
    letterSpacing: 0.25,
  },

  // Extended heading variants
  h1: {
    fontSize: fontSize(28, { maxScale: 1.15 }),
    lineHeight: fontSize(36, { maxScale: 1.15 }),
    fontWeight: "700",
  },

  h2: {
    fontSize: fontSize(24, { maxScale: 1.2 }),
    lineHeight: fontSize(32, { maxScale: 1.2 }),
    fontWeight: "700",
  },

  h3: {
    fontSize: fontSize(20, { maxScale: 1.25 }),
    lineHeight: fontSize(28, { maxScale: 1.25 }),
    fontWeight: "600",
  },

  body1: {
    fontSize: fontSize(16),
    lineHeight: fontSize(24),
    fontWeight: "400",
  },

  body2: {
    fontSize: fontSize(14),
    lineHeight: fontSize(20),
    fontWeight: "400",
  },
});

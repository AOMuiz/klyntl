import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  // Strip known navigation/listing props that should not be forwarded to a View
  // (Some navigators or list renderers may pass `index` or similar props)
  // so we avoid accidentally attaching them to native elements.
  const { index, ...safeProps } = otherProps as any;

  return <View style={[{ backgroundColor }, style]} {...safeProps} />;
}

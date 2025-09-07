import React from "react";
import { Text, View, type ViewProps } from "react-native";

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
  const { index, children, ...safeProps } = otherProps as any;

  // Recursively wrap raw text nodes (string/number) anywhere in the children tree
  const wrapChild = (child: any, key?: number): any => {
    if (child === null || child === undefined) return child;

    if (typeof child === "string" || typeof child === "number") {
      return <Text key={key}>{child}</Text>;
    }

    if (Array.isArray(child)) {
      return React.Children.map(child, (c, i) => wrapChild(c, i));
    }

    if (React.isValidElement(child)) {
      // If this is already a Text element, don't wrap its children again
      if (child.type === Text) return child;

      const childProps = (child as any).props;
      const wrappedChildren = wrapChild(childProps?.children);

      // If children didn't change, return original element to avoid unnecessary cloning
      if (wrappedChildren === childProps?.children) return child;

      return React.cloneElement(child, undefined, wrappedChildren);
    }

    // Other (functions, booleans, etc.) — return as-is
    return child;
  };

  const renderedChildren = wrapChild(children);

  return (
    <View style={[{ backgroundColor }, style]} {...safeProps}>
      {renderedChildren}
    </View>
  );
}

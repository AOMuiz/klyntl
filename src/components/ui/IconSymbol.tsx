// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<
  SymbolViewProps["name"],
  ComponentProps<typeof MaterialIcons>["name"]
>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping
 * Only map SF Symbol names you actually use.
 */
const MAPPING = {
  // Core navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",

  // Tab icons
  "person.2.fill": "group", // Customers
  "chart.bar.fill": "bar-chart", // Analytics
  "list.bullet": "list", // Transactions
  "storefront.fill": "store", // Store

  // Common actions
  plus: "add",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "arrow.down.circle.fill": "arrow-downward",
  "creditcard.fill": "credit-card",
  link: "link",
  "shippingbox.fill": "local-shipping",
  sparkles: "auto-fix-high",
  "person.badge.plus": "person-add",
  "building.2": "business",
  trash: "delete",
  pencil: "edit",
  "circle.fill": "circle",
  "exclamationmark.triangle": "warning",

  // Transaction-specific icons
  "cart.fill": "shopping-cart", // Sale
  return: "undo", // Refund
  "dollarsign.circle.fill": "attach-money", // Default
  calendar: "calendar-today", // Date field                  // Description field
} as IconMapping;

/**
 * Cross-platform Icon
 * - Uses SF Symbols on iOS (via expo-symbols)
 * - Uses MaterialIcons on Android & Web
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight; // reserved for iOS usage
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}

// Fallback for using MaterialIcons on Android and web.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
export type IconSymbolName = string;

/**
 * SF Symbols → Material Icons mapping
 * Only map SF Symbol names you actually use.
 */
const MAPPING: IconMapping = {
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
  "checkmark.circle.fill": "check-circle",
  "arrow.forward.circle.fill": "arrow-forward",
  "circle.fill": "circle",
  "exclamationmark.triangle": "warning",

  // Transaction-specific icons
  "cart.fill": "shopping-cart", // Sale
  return: "undo", // Refund
  "dollarsign.circle.fill": "attach-money", // Default

  // Additional icons found in usage
  xmark: "close", // Close/cancel actions
  person: "person", // Generic person icon

  // Added mappings for SF symbols used elsewhere in the app
  "person.crop.circle": "account-circle",
  briefcase: "work",
  globe: "public",
  clock: "access-time",
  "questionmark.circle": "help-outline",
  phone: "phone",
  document: "description",
  "shield.checkerboard": "security",
  "gearshape.fill": "settings",
  bell: "notifications",
  magnifyingglass: "search",
  "chevron.down": "expand-more",
  checkmark: "check",
  "person.2": "people",
  "arrow.up.arrow.down": "swap-vert",
  "chart.line.uptrend.xyaxis": "trending-up",
  "clock.fill": "schedule",
  "arrow.uturn.left": "reply",
  "arrow.uturn.right": "reply-all",
  paperclip: "attach-file",
  "camera.fill": "photo-camera",

  // Contact method icons
  envelope: "email", // Email contact method
  message: "message", // SMS contact method

  // Homepage and signup icons
  "doc.text": "description", // Record sale button
  business: "business", // Business name input
} as IconMapping;

// Fallback icon in case mapping is missing
const FALLBACK_ICON: ComponentProps<typeof MaterialIcons>["name"] =
  "help-outline";

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
      name={
        (MAPPING[name] as ComponentProps<typeof MaterialIcons>["name"]) ??
        FALLBACK_ICON
      }
      style={style}
    />
  );
}

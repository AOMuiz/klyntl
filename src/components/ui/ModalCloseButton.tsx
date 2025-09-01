import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export type ModalCloseButtonVariant = "icon" | "text" | "cancel";

/**
 * A configurable close button for modal screens.
 *
 * Variants:
 * - "icon": Shows an icon (default: xmark)
 * - "text": Shows text (default: "Cancel")
 * - "cancel": Shows text with cancel styling (default: "Cancel")
 *
 * Examples:
 * <ModalCloseButton variant="icon" iconName="xmark" />
 * <ModalCloseButton variant="text" text="Close" />
 * <ModalCloseButton variant="cancel" text="Cancel" textColor="#FF3B30" />
 * <ModalCloseButton onPress={() => customCloseLogic()} />
 */
interface ModalCloseButtonProps {
  onPress?: () => void;
  variant?: ModalCloseButtonVariant;
  iconName?: string;
  iconSize?: number;
  iconColor?: string;
  text?: string;
  textColor?: string;
  style?: any;
}

export function ModalCloseButton({
  onPress,
  variant = "icon",
  iconName = "xmark",
  iconSize = 20,
  iconColor = "#007AFF",
  text = "Cancel",
  textColor = "#007AFF",
  style,
}: ModalCloseButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const baseStyle = {
    marginLeft: 16,
    padding: 8,
    ...style,
  };

  if (variant === "text" || variant === "cancel") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={baseStyle}
        accessibilityLabel={variant === "cancel" ? "Cancel" : "Close"}
      >
        <Text style={{ color: textColor, fontSize: 16, fontWeight: "500" }}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default icon variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={baseStyle}
      accessibilityLabel="Close"
    >
      <IconSymbol name={iconName as any} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

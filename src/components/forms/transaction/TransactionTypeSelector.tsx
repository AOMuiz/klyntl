import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { TransactionType } from "@/types/transaction";
import { hp } from "@/utils/responsive_dimensions_system";
import { TouchableOpacity, View, useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";

interface TransactionTypeSelectorProps {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  descriptions: Record<TransactionType, string>;
}

export const TransactionTypeSelector: React.FC<
  TransactionTypeSelectorProps
> = ({ value, onChange, descriptions }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "sale":
        return "cart.fill";
      case "payment":
        return "creditcard.fill";
      case "credit":
        return "clock.fill";
      case "refund":
        return "return";
      default:
        return "dollarsign.circle.fill";
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case "sale":
        return Colors[isDark ? "dark" : "light"].success;
      case "payment":
        return Colors[isDark ? "dark" : "light"].secondary;
      case "credit":
        return Colors[isDark ? "dark" : "light"].warning;
      case "refund":
        return Colors[isDark ? "dark" : "light"].error;
      default:
        return Colors[isDark ? "dark" : "light"].textTertiary;
    }
  };

  return (
    <View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {(["sale", "payment", "credit", "refund"] as TransactionType[]).map(
          (type) => (
            <TouchableOpacity
              key={type}
              style={[
                {
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: hp(12),
                  paddingHorizontal: hp(8),
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: theme.colors.outline,
                  gap: 6,
                },
                value === type && { borderWidth: 2 },
                value === type && {
                  backgroundColor: getTypeColor(type) + "20",
                  borderColor: getTypeColor(type),
                },
              ]}
              onPress={() => onChange(type)}
            >
              <IconSymbol
                name={getTypeIcon(type)}
                size={20}
                color={value === type ? getTypeColor(type) : "#8E8E93"}
              />
              <ThemedText
                style={[
                  { fontWeight: "600", fontSize: 13 },
                  value === type && { color: getTypeColor(type) },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          )
        )}
      </View>
      {/* Show meaning below selection */}
      <ThemedText
        type="body2"
        style={{
          marginTop: hp(8),
          color: theme.colors.onSurfaceVariant,
        }}
      >
        {descriptions[value]}
      </ThemedText>
    </View>
  );
};

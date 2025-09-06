import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { TransactionType } from "@/types/transaction";
import { formatCurrency } from "@/utils/currency";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import {
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  onQuickAmountSelect: (amount: number) => void;
  error?: string;
  transactionType: TransactionType;
  showPreview?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  onQuickAmountSelect,
  error,
  transactionType,
  showPreview = true,
}) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const formatAmountInput = (text: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    return numericValue;
  };

  const quickAmountPresets = [500, 1000, 2000, 5000, 10000];

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

  const getPreviewLabel = (type: TransactionType) => {
    switch (type) {
      case "refund":
        return "Refund Amount";
      case "payment":
        return "Payment Received";
      case "credit":
        return "Credit Amount";
      default:
        return "Sale Amount";
    }
  };

  return (
    <View>
      {/* Label removed: FormField provides the field label to avoid duplicates */}

      <TextInput
        mode="outlined"
        value={value}
        onChangeText={(text) => onChange(formatAmountInput(text))}
        error={!!error}
        style={{ backgroundColor: theme.colors.elevation.level1 }}
        keyboardType="numeric"
        placeholder="0.00"
        left={<TextInput.Icon icon="currency-ngn" />}
      />

      {showPreview && value && !error && (
        <View
          style={{
            alignItems: "center",
            marginTop: hp(12),
            padding: wp(16),
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 12,
          }}
        >
          <ThemedText
            style={[
              { fontSize: 24, fontWeight: "bold", textAlign: "center" },
              { color: getTypeColor(transactionType) },
            ]}
          >
            {formatCurrency(Number(value))}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 12,
              color: theme.colors.onSurfaceVariant,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {getPreviewLabel(transactionType)}
          </ThemedText>
        </View>
      )}

      {/* Error UI removed here — FormField will render errors */}

      {/* Quick Amount Presets */}
      <View style={{ marginBottom: 16 }}>
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: "600",
            marginBottom: 8,
            color: theme.colors.onSurface,
            opacity: 0.8,
          }}
        >
          Quick amounts:
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 8 }}
        >
          {quickAmountPresets.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                {
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: "transparent",
                },
                value === preset.toString() && {
                  backgroundColor: theme.colors.primaryContainer,
                  borderColor: theme.colors.primary,
                },
              ]}
              onPress={() => onQuickAmountSelect(preset)}
            >
              <ThemedText
                style={[
                  {
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.colors.onSurfaceVariant,
                  },
                  value === preset.toString() && {
                    color: theme.colors.primary,
                  },
                ]}
              >
                {formatCurrency(preset)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

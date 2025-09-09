import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { PaymentMethod, TransactionType } from "@/types/transaction";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { useMemo } from "react";
import {
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  transactionType: TransactionType;
  showMore: boolean;
  onToggleMore: () => void;
  descriptions: Record<PaymentMethod, string>;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  transactionType,
  showMore,
  onToggleMore,
  descriptions,
}) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const paymentMethodConfig = {
    cash: {
      label: "Cash",
      icon: "dollarsign.circle.fill" as const,
      color: Colors[isDark ? "dark" : "light"].success,
    },
    bank_transfer: {
      label: "Bank Transfer",
      icon: "building.2" as const,
      color: Colors[isDark ? "dark" : "light"].secondary,
    },
    credit: {
      label: "On Credit",
      icon: "creditcard.fill" as const,
      color: Colors[isDark ? "dark" : "light"].warning,
    },
    pos_card: {
      label: "Card",
      icon: "creditcard.fill" as const,
      color: Colors[isDark ? "dark" : "light"].primary,
    },
    mixed: {
      label: "Mixed",
      icon: "dollarsign.circle.fill" as const,
      color: Colors[isDark ? "dark" : "light"].accent,
    },
  };

  const commonMethods: PaymentMethod[] = ["cash", "bank_transfer"];
  const additionalMethods: PaymentMethod[] = ["pos_card"];

  if (transactionType !== "payment" && transactionType !== "refund") {
    commonMethods.push("credit");
    additionalMethods.push("mixed");
  }
  // Note: For payment transactions, only cash, bank_transfer, pos_card are allowed
  // Mixed payments don't make sense for payments received from customers

  return (
    <View>
      {/* Segmented Control for Common Payment Methods */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {commonMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              {
                flex: 1,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: hp(8),
              },
              value === method && { borderWidth: 2 },
              value === method && {
                backgroundColor: paymentMethodConfig[method].color + "20",
                borderColor: paymentMethodConfig[method].color,
              },
            ]}
            onPress={() => onChange(method)}
          >
            <IconSymbol
              name={paymentMethodConfig[method].icon}
              size={20}
              color={
                value === method ? paymentMethodConfig[method].color : "#8E8E93"
              }
            />
            <ThemedText
              style={[
                {
                  fontSize: wp(12),
                  fontWeight: "500",
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                },
                value === method && {
                  color: paymentMethodConfig[method].color,
                  fontWeight: "600",
                },
              ]}
            >
              {paymentMethodConfig[method].label}
            </ThemedText>
          </TouchableOpacity>
        ))}

        {/* More Options */}
        <TouchableOpacity
          style={[
            {
              flex: 1,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              minHeight: hp(8),
            },
            showMore && { borderWidth: 2 },
            showMore && {
              backgroundColor: theme.colors.primaryContainer,
            },
          ]}
          onPress={onToggleMore}
        >
          <IconSymbol
            name="chevron.down"
            size={20}
            color={showMore ? theme.colors.primary : "#8E8E93"}
          />
          <ThemedText
            style={[
              {
                fontSize: wp(12),
                fontWeight: "500",
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              },
              showMore && {
                color: theme.colors.primary,
                fontWeight: "600",
              },
            ]}
          >
            More
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Additional Payment Methods (shown when "More" is selected) */}
      {showMore && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outlineVariant,
          }}
          contentContainerStyle={{ flexDirection: "row", gap: 8 }}
        >
          {additionalMethods.map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                {
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: hp(8),
                },
                value === method && { borderWidth: 2 },
                value === method && {
                  backgroundColor: paymentMethodConfig[method].color + "20",
                },
              ]}
              onPress={() => onChange(method)}
            >
              <IconSymbol
                name={paymentMethodConfig[method].icon}
                size={20}
                color={
                  value === method
                    ? paymentMethodConfig[method].color
                    : "#8E8E93"
                }
              />
              <ThemedText
                style={[
                  {
                    fontSize: wp(12),
                    fontWeight: "500",
                    color: theme.colors.onSurfaceVariant,
                    textAlign: "center",
                  },
                  value === method && {
                    color: paymentMethodConfig[method].color,
                    fontWeight: "600",
                  },
                ]}
              >
                {paymentMethodConfig[method].label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Show meaning below selection */}
      <ThemedText
        style={{
          marginTop: hp(8),
          color: theme.colors.onSurfaceVariant,
        }}
      >
        {descriptions[value || "cash"]}
      </ThemedText>
    </View>
  );
};

// Simplified Payment Method Selector
const SimplePaymentMethodSelector: React.FC<{
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  transactionType: TransactionType;
  showDebtOption: boolean;
}> = ({ value, onChange, transactionType, showDebtOption }) => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getMethodConfig = (method: PaymentMethod) => {
    const configs = {
      cash: {
        label: "Cash",
        icon: "banknote",
        color: Colors[isDark ? "dark" : "light"].success,
      },
      bank_transfer: {
        label: "Transfer",
        icon: "building.2",
        color: Colors[isDark ? "dark" : "light"].secondary,
      },
      pos_card: {
        label: "Card/POS",
        icon: "creditcard",
        color: Colors[isDark ? "dark" : "light"].primary,
      },
      credit: {
        label: "Credit (Debt)",
        icon: "clock",
        color: Colors[isDark ? "dark" : "light"].warning,
      },
      mixed: {
        label: "Partial Payment",
        icon: "plus.minus",
        color: Colors[isDark ? "dark" : "light"].accent,
      },
    };
    return configs[method];
  };

  // Determine available methods based on transaction type
  const availableMethods: PaymentMethod[] = useMemo(() => {
    if (transactionType === "payment") {
      return ["cash", "bank_transfer", "pos_card"];
    }
    if (transactionType === "sale") {
      const methods: PaymentMethod[] = ["cash", "bank_transfer", "pos_card"];
      if (showDebtOption) methods.push("credit", "mixed");
      return methods;
    }
    // For credit/refund, only cash/transfer make sense
    return ["cash", "bank_transfer"];
  }, [transactionType, showDebtOption]);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {availableMethods.map((method) => {
          const config = getMethodConfig(method);
          const isSelected = value === method;

          return (
            <TouchableOpacity
              key={method}
              style={[
                {
                  flex: method === "credit" ? 1 : 0,
                  minWidth: wp(80),
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                  alignItems: "center",
                  gap: 4,
                },
                isSelected && {
                  backgroundColor: config.color + "15",
                  borderColor: config.color,
                },
              ]}
              onPress={() => onChange(method)}
            >
              <IconSymbol
                name={config.icon}
                size={20}
                color={
                  isSelected ? config.color : theme.colors.onSurfaceVariant
                }
              />
              <ThemedText
                style={[
                  { fontSize: 12, fontWeight: "500", textAlign: "center" },
                  isSelected && { color: config.color, fontWeight: "600" },
                ]}
              >
                {config.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

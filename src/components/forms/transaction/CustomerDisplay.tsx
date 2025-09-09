import { ThemedText } from "@/components/ThemedText";
import { Customer } from "@/types/customer";
import { getCustomerInitials } from "@/utils/helpers";
import { fontSize, hp, wp } from "@/utils/responsive_dimensions_system";
import { View } from "react-native";
import { useTheme } from "react-native-paper";

interface CustomerDisplayProps {
  customer: Customer;
  showEditWarning?: boolean;
}

export const CustomerDisplay: React.FC<CustomerDisplayProps> = ({
  customer,
  showEditWarning = false,
}) => {
  const theme = useTheme();

  return (
    <View>
      {/* Customer info display */}
      <View
        style={{
          padding: wp(12),
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        <View
          style={{
            width: wp(40),
            height: hp(40),
            borderRadius: wp(20),
            backgroundColor: theme.colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: wp(12),
          }}
        >
          <ThemedText
            style={{
              color: theme.colors.onPrimary,
              fontSize: fontSize(14),
              fontWeight: "bold",
            }}
          >
            {getCustomerInitials(customer.name)}
          </ThemedText>
        </View>

        <View style={{ flex: 1 }}>
          <ThemedText
            style={{
              fontSize: fontSize(16),
              fontWeight: "600",
              color: theme.colors.onSurface,
            }}
          >
            {customer.name}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: fontSize(12),
              color: theme.colors.onSurfaceVariant,
              marginTop: 2,
            }}
          >
            Transaction Owner
          </ThemedText>
        </View>
      </View>

      {/* Warning message for edit mode */}
      {showEditWarning && (
        <View
          style={{
            marginTop: hp(8),
            padding: wp(10),
            backgroundColor: theme.colors.secondaryContainer,
            borderRadius: 6,
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.secondary,
          }}
        >
          <ThemedText
            style={{
              fontSize: fontSize(12),
              color: theme.colors.onSecondaryContainer,
              fontStyle: "italic",
            }}
          >
            💡 Customer cannot be changed when editing existing transactions to
            maintain proper business records.
          </ThemedText>
        </View>
      )}
    </View>
  );
};

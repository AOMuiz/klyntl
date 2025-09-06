import { ThemedText } from "@/components/ThemedText";
import { Customer } from "@/types/customer";
import { getCustomerInitials } from "@/utils/helpers";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

interface CustomerSelectorProps {
  customers: Customer[];
  selectedId: string;
  onSelect: (customerId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredCustomers: Customer[];
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  filteredCustomers,
}) => {
  const theme = useTheme();

  return (
    <View>
      <ThemedText
        style={{
          fontSize: wp(16),
          fontWeight: "600",
          marginBottom: 8,
          color: theme.colors.onSurface,
        }}
      >
        Customer *
      </ThemedText>

      {/* Search Input */}
      <TextInput
        mode="outlined"
        placeholder="Search customers..."
        value={searchQuery}
        onChangeText={onSearchChange}
        style={{
          backgroundColor: theme.colors.elevation.level1,
          marginBottom: 12,
        }}
        left={<TextInput.Icon icon="magnify" />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 100 }}
      >
        {filteredCustomers.map((customer) => (
          <TouchableOpacity
            key={customer.id}
            style={[
              {
                alignItems: "center",
                marginRight: wp(12),
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: "lightgray",
                borderStyle: "dashed",
                minWidth: wp(80),
                borderRadius: 5,
              },
              selectedId === customer.id && {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primaryContainer,
              },
            ]}
            onPress={() => onSelect(customer.id)}
          >
            <View
              style={[
                {
                  width: wp(40),
                  height: hp(40),
                  borderRadius: wp(20),
                  backgroundColor: theme.colors.primary,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 4,
                },
                selectedId === customer.id && {
                  backgroundColor: "#007AFF",
                },
              ]}
            >
              <ThemedText
                style={{
                  color: theme.colors.onPrimary,
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                {getCustomerInitials(customer.name)}
              </ThemedText>
            </View>
            <ThemedText
              style={[
                {
                  fontSize: 12,
                  textAlign: "center",
                  maxWidth: 70,
                  color: theme.colors.onSurface,
                },
                selectedId === customer.id && {
                  fontWeight: "700",
                  color: theme.colors.primary,
                },
              ]}
              numberOfLines={1}
            >
              {customer.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

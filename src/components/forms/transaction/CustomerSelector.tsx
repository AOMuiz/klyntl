import { ThemedText } from "@/components/ThemedText";
import { Customer } from "@/types/customer";
import { getCustomerInitials } from "@/utils/helpers";
import { hp, wp } from "@/utils/responsive_dimensions_system";
import { useEffect, useRef } from "react";
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
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to selected customer when component mounts or selectedId changes
  useEffect(() => {
    if (selectedId && scrollViewRef.current) {
      const selectedIndex = filteredCustomers.findIndex(
        (customer) => customer.id === selectedId
      );

      if (selectedIndex !== -1) {
        // Calculate approximate position (customer width + margin)
        const customerWidth = wp(80) + wp(12);
        const scrollPosition = selectedIndex * customerWidth;

        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollPosition - wp(40)), // Center the selected customer
          animated: true,
        });
      }
    }
  }, [selectedId, filteredCustomers]);

  return (
    <View>
      {/* Label removed: FormField provides the field label to avoid duplicates */}

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
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 120 }} // Increased height to accommodate indicator
      >
        {filteredCustomers.map((customer) => {
          const isSelected = selectedId === customer.id;

          return (
            <View key={customer.id} style={{ position: "relative" }}>
              <TouchableOpacity
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
                  isSelected && {
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
                    isSelected && {
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
                    isSelected && {
                      fontWeight: "700",
                      color: theme.colors.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {customer.name}
                </ThemedText>
              </TouchableOpacity>

              {/* Active customer indicator */}
              {isSelected && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -8,
                    left: "50%",
                    transform: [{ translateX: -wp(6) }],
                    backgroundColor: theme.colors.primary,
                    borderRadius: wp(6),
                    width: wp(12),
                    height: hp(3),
                  }}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Selected customer info below */}
      {selectedId && (
        <View
          style={{
            marginTop: hp(8),
            padding: wp(12),
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: wp(24),
              height: hp(24),
              borderRadius: wp(12),
              backgroundColor: theme.colors.primary,
              justifyContent: "center",
              alignItems: "center",
              marginRight: wp(8),
            }}
          >
            <ThemedText
              style={{
                color: theme.colors.onPrimary,
                fontSize: 10,
                fontWeight: "bold",
              }}
            >
              {getCustomerInitials(
                filteredCustomers.find((c) => c.id === selectedId)?.name || ""
              )}
            </ThemedText>
          </View>
          <View>
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.colors.onSurface,
              }}
            >
              {filteredCustomers.find((c) => c.id === selectedId)?.name}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 10,
                color: theme.colors.onSurfaceVariant,
              }}
            >
              Currently selected
            </ThemedText>
          </View>
        </View>
      )}
    </View>
  );
};

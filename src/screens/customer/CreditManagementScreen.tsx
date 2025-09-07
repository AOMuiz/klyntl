import { CreditManagement } from "@/components/CreditManagement";
import { useCustomer } from "@/hooks/useCustomers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Appbar, Text } from "react-native-paper";

export default function CreditManagementScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();
  const { data: customer, isLoading, error } = useCustomer(customerId);

  const handleClose = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleClose} />
          <Appbar.Content title="Credit Management" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <Text>Loading customer information...</Text>
        </View>
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleClose} />
          <Appbar.Content title="Credit Management" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text>Customer not found or error loading data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleClose} />
        <Appbar.Content title="Credit Management" />
      </Appbar.Header>
      <CreditManagement customer={customer} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

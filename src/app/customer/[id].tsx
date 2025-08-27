import CustomerDetailScreen from "@/screens/customer/CustomerDetailScreen";
import { useLocalSearchParams } from "expo-router";

export default function CustomerDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null; // or some error component
  }

  return <CustomerDetailScreen customerId={id} />;
}

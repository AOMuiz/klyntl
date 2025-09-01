import AddTransactionScreen from "@/screens/transaction/AddTransactionScreen";
import { useLocalSearchParams } from "expo-router";

export default function AddTransactionRoute() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();

  return <AddTransactionScreen customerId={customerId} />;
}

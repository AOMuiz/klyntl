import EditTransactionScreen from "@/screens/transaction/EditTransactionScreen";
import { useLocalSearchParams } from "expo-router";

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null; // or some error component
  }

  return <EditTransactionScreen transactionId={id} />;
}

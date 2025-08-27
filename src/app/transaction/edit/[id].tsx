import EditTransactionScreen from "@/screens/transaction/EditTransactionScreen";
import { useLocalSearchParams } from "expo-router";

export default function AddTransactionRoute() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  return <EditTransactionScreen transactionId={transactionId} />;
}

import EditCustomerScreen from "@/screens/customer/EditCustomerScreen";
import { useLocalSearchParams } from "expo-router";

export default function EditCustomerRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null; // or some error component
  }

  return <EditCustomerScreen customerId={id} />;
}

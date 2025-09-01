import { ProductForm } from "@/components/product/ProductForm";
import { ThemedView } from "@/components/ThemedView";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddProductModal() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <ProductForm onProductCreated={() => router.back()} />
      </ThemedView>
    </SafeAreaView>
  );
}

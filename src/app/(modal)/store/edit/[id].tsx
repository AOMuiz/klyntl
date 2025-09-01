import { EditProductForm } from "@/components/product/EditProductForm";
import { ThemedView } from "@/components/ThemedView";
import { useProducts } from "@/hooks/useProducts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, SafeAreaView, View } from "react-native";

export default function EditProductModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, isLoading } = useProducts();

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  const product = products?.find((p: any) => String(p.id) === String(id));
  if (!product) return <View style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1 }}>
        <EditProductForm
          product={product}
          onProductUpdated={() => router.back()}
          onCancel={() => router.back()}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

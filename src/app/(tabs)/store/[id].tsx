import { ProductDetails } from "@/components/product/ProductDetails";
import { useProducts } from "@/hooks/useProducts";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products, isLoading } = useProducts();

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const product = products?.find((p: any) => String(p.id) === String(id));

  if (!product) return <View style={{ flex: 1 }} />;

  return (
    <ProductDetails
      product={product}
      onEdit={() => router.push(`/(modal)/store/edit/${product.id}`)}
      onDelete={() => {
        // optional: implement deletion inside modal or via hook
      }}
      onClose={() => router.back()}
    />
  );
}

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface ProductListProps {
  onProductPress?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  showActions?: boolean;
}

export function ProductList({
  onProductPress,
  onEditProduct,
  onDeleteProduct,
  showActions = true,
}: ProductListProps) {
  const {
    products,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    deleteProduct,
    isDeleting,
  } = useProducts();

  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );

  const handleDeleteProduct = (product: Product) => {
    if (onDeleteProduct) {
      onDeleteProduct(product);
    } else {
      setDeletingProductId(product.id);
      Alert.alert(
        "Delete Product",
        `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setDeletingProductId(null),
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              deleteProduct(product.id);
              setDeletingProductId(null);
            },
          },
        ]
      );
    }
  };

  const theme = useColorScheme();
  const colors = Colors[theme ?? "light"];

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.surfaceVariant }]}
      onPress={() => onProductPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <ThemedText type="defaultSemiBold" style={styles.productName}>
          {item.name}
        </ThemedText>
        <ThemedText style={[styles.productPrice, { color: colors.success }]}>
          ₦{item.price.toLocaleString()}
        </ThemedText>
      </View>

      {item.description && (
        <ThemedText
          style={[styles.productDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </ThemedText>
      )}

      <View style={styles.productDetails}>
        {item.sku && (
          <ThemedText style={[styles.sku, { color: colors.textSecondary }]}>
            SKU: {item.sku}
          </ThemedText>
        )}
        <View style={styles.stockInfo}>
          <ThemedText
            style={[
              styles.stockText,
              {
                color:
                  item.stockQuantity <= item.lowStockThreshold
                    ? colors.warning
                    : colors.success,
              },
            ]}
          >
            Stock: {item.stockQuantity}
          </ThemedText>
          {item.category && (
            <ThemedText
              style={[
                styles.category,
                {
                  backgroundColor: colors.surface,
                  color: colors.textSecondary,
                },
              ]}
            >
              {item.category}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Action buttons */}
      {showActions && (
        <ThemedView
          style={[styles.actionButtons, { borderTopColor: colors.border }]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.success + "20",
                borderColor: colors.success,
              },
            ]}
            onPress={() => onEditProduct?.(item)}
          >
            <IconSymbol name="pencil" size={16} color={colors.success} />
            <ThemedText
              style={[styles.editButtonText, { color: colors.success }]}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.error + "20",
                borderColor: colors.error,
              },
            ]}
            disabled={deletingProductId === item.id}
            onPress={() => handleDeleteProduct(item)}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
            <ThemedText
              style={[styles.deleteButtonText, { color: colors.error }]}
            >
              {isDeleting ? "..." : "Delete"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {!item.isActive && (
        <View style={[styles.inactiveBadge, { backgroundColor: colors.error }]}>
          <ThemedText
            style={[styles.inactiveText, { color: colors.background }]}
          >
            Inactive
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasNextPage) return null;

    return (
      <TouchableOpacity
        style={[styles.loadMoreButton, { backgroundColor: colors.primary }]}
        onPress={() => fetchNextPage()}
        disabled={isFetchingNextPage}
      >
        <ThemedText style={[styles.loadMoreText, { color: colors.background }]}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={[styles.errorText, { color: colors.error }]}>
          Error loading products: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={{ color: colors.textSecondary }}>
          Loading products...
        </ThemedText>
      </ThemedView>
    );
  }

  if (products.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
          No products found. Add your first product to get started!
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: "relative",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sku: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  category: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: "600",
  },
  loadMoreButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

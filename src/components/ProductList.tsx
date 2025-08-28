import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types/product";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
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

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => onProductPress?.(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <ThemedText type="defaultSemiBold" style={styles.productName}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.productPrice}>
          ₦{item.price.toLocaleString()}
        </ThemedText>
      </View>

      {item.description && (
        <ThemedText style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
      )}

      <View style={styles.productDetails}>
        {item.sku && <Text style={styles.sku}>SKU: {item.sku}</Text>}
        <View style={styles.stockInfo}>
          <Text
            style={[
              styles.stockText,
              item.stockQuantity <= item.lowStockThreshold
                ? styles.lowStock
                : styles.inStock,
            ]}
          >
            Stock: {item.stockQuantity}
          </Text>
          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}
        </View>
      </View>

      {/* Action buttons */}
      {showActions && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEditProduct?.(item)}
          >
            <IconSymbol name="pencil" size={16} color="#2E7D32" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            disabled={deletingProductId === item.id}
            onPress={() => handleDeleteProduct(item)}
          >
            <IconSymbol name="trash" size={16} color="#f44336" />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? "..." : "Delete"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!item.isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveText}>Inactive</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasNextPage) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={() => fetchNextPage()}
        disabled={isFetchingNextPage}
      >
        <Text style={styles.loadMoreText}>
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </Text>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Error loading products: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Loading products...</ThemedText>
      </ThemedView>
    );
  }

  if (products.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>
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
    backgroundColor: "white",
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
    color: "#2E7D32",
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
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
    color: "#999",
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
  inStock: {
    color: "#4CAF50",
  },
  lowStock: {
    color: "#FF9800",
  },
  category: {
    fontSize: 12,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#666",
  },
  inactiveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f44336",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  loadMoreButton: {
    backgroundColor: "#2E7D32",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  loadMoreText: {
    color: "white",
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
    color: "#f44336",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#2E7D32",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#f44336",
  },
  editButtonText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#f44336",
    fontSize: 12,
    fontWeight: "600",
  },
});

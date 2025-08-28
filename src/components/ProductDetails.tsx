import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/helpers";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface ProductDetailsProps {
  product: Product;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function ProductDetails({
  product,
  onEdit,
  onDelete,
  onClose,
}: ProductDetailsProps) {
  const getStockStatus = () => {
    if (product.stockQuantity === 0)
      return { text: "Out of Stock", color: "#f44336" };
    if (product.stockQuantity <= product.lowStockThreshold)
      return { text: "Low Stock", color: "#FF9800" };
    return { text: "In Stock", color: "#4CAF50" };
  };

  const stockStatus = getStockStatus();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityLabel="Close product details"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={20} color="#666" />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.title}>
            Product Details
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onEdit}
            accessible={true}
            accessibilityLabel="Edit product details"
            accessibilityRole="button"
            style={styles.editButton}
          >
            <IconSymbol name="pencil" size={16} color="#2E7D32" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            accessible={true}
            accessibilityLabel="Delete product"
            accessibilityRole="button"
            style={styles.deleteButton}
          >
            <IconSymbol name="trash" size={16} color="#f44336" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Status */}
        {!product.isActive && (
          <View style={styles.inactiveWarning}>
            <IconSymbol
              name="exclamationmark.triangle"
              size={20}
              color="#FF9800"
            />
            <ThemedText style={styles.inactiveText}>
              This product is currently inactive and will not appear in your
              store
            </ThemedText>
          </View>
        )}

        {/* Main Info */}
        <View style={styles.section}>
          <ThemedText type="defaultSemiBold" style={styles.productName}>
            {product.name}
          </ThemedText>
          {product.description && (
            <ThemedText style={styles.description}>
              {product.description}
            </ThemedText>
          )}
        </View>

        {/* Pricing */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Pricing
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Selling Price</ThemedText>
              <ThemedText style={styles.priceValue}>
                {formatCurrency(product.price)}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Cost Price</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatCurrency(product.costPrice)}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Profit Margin</ThemedText>
              <ThemedText style={[styles.infoValue, styles.profitValue]}>
                {formatCurrency(product.price - product.costPrice)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Inventory */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Inventory
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Stock Quantity</ThemedText>
              <ThemedText
                style={[styles.infoValue, { color: stockStatus.color }]}
              >
                {product.stockQuantity} units
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Status</ThemedText>
              <View style={styles.stockStatusContainer}>
                <View
                  style={[
                    styles.stockIndicator,
                    { backgroundColor: stockStatus.color },
                  ]}
                />
                <ThemedText
                  style={[styles.stockStatusText, { color: stockStatus.color }]}
                >
                  {stockStatus.text}
                </ThemedText>
              </View>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Low Stock Alert</ThemedText>
              <ThemedText style={styles.infoValue}>
                {product.lowStockThreshold} units
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Product Information
          </ThemedText>
          <View style={styles.infoGrid}>
            {product.sku && (
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>SKU</ThemedText>
                <ThemedText style={[styles.infoValue, styles.skuValue]}>
                  {product.sku}
                </ThemedText>
              </View>
            )}
            {product.category && (
              <View style={styles.infoItem}>
                <ThemedText style={styles.infoLabel}>Category</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {product.category}
                </ThemedText>
              </View>
            )}
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Created</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(product.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Last Updated</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(product.updatedAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
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
  content: {
    flex: 1,
  },
  inactiveWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  inactiveText: {
    flex: 1,
    color: "#F57C00",
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
  },
  profitValue: {
    color: "#4CAF50",
  },
  stockStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  skuValue: {
    fontFamily: "monospace",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

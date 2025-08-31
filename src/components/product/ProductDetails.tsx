import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/helpers";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import { IconSymbol } from "../ui/IconSymbol";

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
  const theme = useColorScheme();
  const colors = Colors[theme ?? "light"];

  const getStockStatus = () => {
    if (product.stockQuantity === 0)
      return { text: "Out of Stock", color: colors.error };
    if (product.stockQuantity <= product.lowStockThreshold)
      return { text: "Low Stock", color: colors.warning };
    return { text: "In Stock", color: colors.success };
  };
  const stockStatus = getStockStatus();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessible={true}
            accessibilityLabel="Close product details"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={20} color={colors.text} />
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
            style={[
              styles.editButton,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <IconSymbol name="pencil" size={16} color={colors.success} />
            <ThemedText
              style={[styles.editButtonText, { color: colors.success }]}
            >
              Edit
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            accessible={true}
            accessibilityLabel="Delete product"
            accessibilityRole="button"
            style={[
              styles.deleteButton,
              { backgroundColor: colors.error + "20" },
            ]}
          >
            <IconSymbol name="trash" size={16} color={colors.error} />
            <ThemedText
              style={[styles.deleteButtonText, { color: colors.error }]}
            >
              Delete
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Status */}
        {!product.isActive && (
          <ThemedView
            style={[
              styles.inactiveWarning,
              { backgroundColor: colors.warning + "20" },
            ]}
          >
            <IconSymbol
              name="exclamationmark.triangle"
              size={20}
              color={colors.warning}
            />
            <ThemedText
              style={[styles.inactiveText, { color: colors.warning }]}
            >
              This product is currently inactive and will not appear in your
              store
            </ThemedText>
          </ThemedView>
        )}

        {/* Main Info */}
        <ThemedView
          style={[styles.section, { borderBottomColor: colors.border }]}
        >
          <ThemedText type="defaultSemiBold" style={styles.productName}>
            {product.name}
          </ThemedText>
          {product.description && (
            <ThemedText
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {product.description}
            </ThemedText>
          )}
        </ThemedView>

        {/* Pricing */}
        <ThemedView
          style={[styles.section, { borderBottomColor: colors.border }]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Pricing
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Selling Price
              </ThemedText>
              <ThemedText
                style={[styles.priceValue, { color: colors.success }]}
              >
                {formatCurrency(product.price)}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Cost Price
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatCurrency(product.costPrice)}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Profit Margin
              </ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.success }]}>
                {formatCurrency(product.price - product.costPrice)}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Inventory */}
        <ThemedView
          style={[styles.section, { borderBottomColor: colors.border }]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Inventory
          </ThemedText>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Stock Quantity
              </ThemedText>
              <ThemedText
                style={[styles.infoValue, { color: stockStatus.color }]}
              >
                {product.stockQuantity} units
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Status
              </ThemedText>
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
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Low Stock Alert
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {product.lowStockThreshold} units
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Product Info */}
        <ThemedView
          style={[styles.section, { borderBottomColor: colors.border }]}
        >
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Product Information
          </ThemedText>
          <View style={styles.infoGrid}>
            {product.sku && (
              <View style={styles.infoItem}>
                <ThemedText
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  SKU
                </ThemedText>
                <ThemedText
                  style={[
                    styles.infoValue,
                    styles.skuValue,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  {product.sku}
                </ThemedText>
              </View>
            )}
            {product.category && (
              <View style={styles.infoItem}>
                <ThemedText
                  style={[styles.infoLabel, { color: colors.textSecondary }]}
                >
                  Category
                </ThemedText>
                <ThemedText style={styles.infoValue}>
                  {product.category}
                </ThemedText>
              </View>
            )}
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Created
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(product.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
            <View style={styles.infoItem}>
              <ThemedText
                style={[styles.infoLabel, { color: colors.textSecondary }]}
              >
                Last Updated
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(product.updatedAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  inactiveWarning: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  inactiveText: {
    flex: 1,
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
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
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

import { ProductList } from "@/components/product/ProductList";
import ScreenContainer, {
  edgesHorizontal,
  edgesVertical,
} from "@/components/screen-container";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";

import type { Product } from "@/types/product";
import { fontSize } from "@/utils/responsive_dimensions_system";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function StoreScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [showProductList, setShowProductList] = useState(false);

  const {
    totalCount: productCount,
    isLoading: productsLoading,
    deleteProduct,
    products,
  } = useProducts();
  const { data: lowStockProducts } = useLowStockProducts();

  const handleProductPress = (product: Product) => {
    // navigate to product details in this tab stack
    router.push(`/store/${product.id}`);
  };

  const handleEditProduct = (product: Product) => {
    // open edit as modal route
    router.push(`/(modal)/store/edit/${product.id}`);
  };

  const handleAddProduct = () => {
    router.push(`/(modal)/store/add`);
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteProduct(product.id);
          },
        },
      ]
    );
  };

  const renderComingSoonFeature = (
    title: string,
    description: string,
    icon: any
  ) => (
    <View
      style={[styles.featureCard, { backgroundColor: colors.surfaceVariant }]}
    >
      <IconSymbol name={icon} size={24} color={colors.warning} />
      <View style={styles.featureInfo}>
        <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
          {title}
        </ThemedText>
        <ThemedText
          style={[styles.featureDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
      <View
        style={[styles.comingSoonBadge, { backgroundColor: colors.warning }]}
      >
        <ThemedText style={[styles.comingSoonText, { color: colors.surface }]}>
          Soon
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ScreenContainer
      scrollable={false}
      withPadding={false}
      edges={[...edgesHorizontal, ...edgesVertical]}
    >
      {showProductList ? (
        // Product List View - Uses FlatList internally
        <ThemedView style={styles.productListContainer}>
          <ThemedView
            style={[
              styles.productListHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowProductList(false)}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.text} />
              <ThemedText style={[styles.backText, { color: colors.text }]}>
                Back to Store
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddProduct}
            >
              <IconSymbol name="plus" size={16} color={colors.background} />
              <ThemedText
                style={[styles.addButtonText, { color: colors.background }]}
              >
                Add Product
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <ProductList
            onProductPress={handleProductPress}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        </ThemedView>
      ) : (
        // Store Overview - Uses ScrollView
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <ThemedText type="title" style={{ color: colors.text }}>
              Store
            </ThemedText>
            <ThemedText
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Manage your products and online presence
            </ThemedText>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={{ color: colors.text }}>
                Products
              </ThemedText>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddProduct}
              >
                <IconSymbol name="plus" size={16} color={colors.background} />
                <ThemedText
                  style={[styles.addButtonText, { color: colors.background }]}
                >
                  Add Product
                </ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.viewAllButton,
                { backgroundColor: colors.secondarySurface },
              ]}
              onPress={() => setShowProductList(true)}
            >
              <ThemedText style={{ color: colors.text }}>
                View All Products ({productCount})
              </ThemedText>
              <IconSymbol name="chevron.right" size={16} color={colors.text} />
            </TouchableOpacity>

            {/* Show low stock alerts */}
            {lowStockProducts && lowStockProducts.length > 0 && (
              <View
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: colors.warning + "20",
                    borderColor: colors.warning,
                  },
                ]}
              >
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={20}
                  color={colors.warning}
                />
                <ThemedText
                  style={[styles.alertText, { color: colors.warning }]}
                >
                  {lowStockProducts.length} product(s) running low on stock
                </ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.storeStatsCard,
                { backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={styles.statItem}>
                <ThemedText
                  style={[styles.statValue, { color: colors.secondary }]}
                >
                  0
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Orders Today
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <View style={styles.statItem}>
                <ThemedText
                  style={[styles.statValue, { color: colors.secondary }]}
                >
                  {productsLoading ? "..." : productCount}
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Active Products
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statDivider,
                  { backgroundColor: colors.divider },
                ]}
              />
              <View style={styles.statItem}>
                <ThemedText
                  style={[styles.statValue, { color: colors.currencyPositive }]}
                >
                  ₦0
                </ThemedText>
                <ThemedText
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Store Revenue
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ThemedText
              type="subtitle"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Coming Soon
            </ThemedText>

            {renderComingSoonFeature(
              "Online Store Link",
              "Share a custom link for customers to browse and order",
              "link"
            )}

            {renderComingSoonFeature(
              "Payment Integration",
              "Accept payments directly through your store",
              "creditcard.fill"
            )}

            {renderComingSoonFeature(
              "Inventory Management",
              "Track stock levels and get low inventory alerts",
              "chart.bar.fill"
            )}

            {renderComingSoonFeature(
              "Order Management",
              "Process and fulfill customer orders efficiently",
              "shippingbox.fill"
            )}
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.ctaCard,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <IconSymbol name="sparkles" size={32} color={colors.secondary} />
              <ThemedText
                type="subtitle"
                style={[styles.ctaTitle, { color: colors.text }]}
              >
                Launch Your Online Store
              </ThemedText>
              <ThemedText
                style={[styles.ctaDescription, { color: colors.textSecondary }]}
              >
                Get your products online and start selling to more customers.
                Full e-commerce features coming in the next update!
              </ThemedText>
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  Alert.alert(
                    "Coming Soon!",
                    "We'll notify you when the online store features are ready. Stay tuned!",
                    [{ text: "OK", style: "default" }]
                  );
                }}
              >
                <ThemedText
                  style={[styles.ctaButtonText, { color: colors.background }]}
                >
                  Get Notified
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    fontSize: fontSize(14),
    fontWeight: "600",
  },
  storeStatsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontWeight: "bold",
    fontSize: fontSize(20),
  },
  statLabel: {
    marginTop: 4,
    textAlign: "center",
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: fontSize(14),
    opacity: 0.7,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: fontSize(12),
    fontWeight: "600",
  },
  ctaCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 32,
  },
  ctaTitle: {
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  ctaDescription: {
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontWeight: "600",
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    gap: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSafeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  productListContainer: {
    flex: 1,
  },
  productListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

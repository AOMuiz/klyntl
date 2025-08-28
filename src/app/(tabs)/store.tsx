import { EditProductForm } from "@/components/EditProductForm";
import { ProductDetails } from "@/components/ProductDetails";
import { ProductForm } from "@/components/ProductForm";
import { ProductList } from "@/components/ProductList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLowStockProducts, useProducts } from "@/hooks/useProducts";

import type { Product } from "@/types/product";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    totalCount: productCount,
    isLoading: productsLoading,
    deleteProduct,
  } = useProducts();
  const { data: lowStockProducts } = useLowStockProducts();

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditForm(true);
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
            if (selectedProduct?.id === product.id) {
              setShowProductDetails(false);
              setSelectedProduct(null);
            }
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
        <ThemedText style={styles.comingSoonText}>Soon</ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ThemedView
        style={[styles.content, { backgroundColor: colors.background }]}
      >
        {showProductList ? (
          // Product List View - Uses FlatList internally
          <View style={styles.productListContainer}>
            <View style={styles.productListHeader}>
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
                onPress={() => setShowAddProduct(true)}
              >
                <IconSymbol name="plus" size={16} color={colors.background} />
                <ThemedText style={styles.addButtonText}>
                  Add Product
                </ThemedText>
              </TouchableOpacity>
            </View>
            <ProductList
              onProductPress={handleProductPress}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </View>
        ) : (
          // Store Overview - Uses ScrollView
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
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
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowAddProduct(true)}
                >
                  <IconSymbol name="plus" size={16} color={colors.background} />
                  <ThemedText style={styles.addButtonText}>
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
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.text}
                />
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
                    style={[
                      styles.statValue,
                      { color: colors.currencyPositive },
                    ]}
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
                <IconSymbol
                  name="sparkles"
                  size={32}
                  color={colors.secondary}
                />
                <ThemedText
                  type="subtitle"
                  style={[styles.ctaTitle, { color: colors.text }]}
                >
                  Launch Your Online Store
                </ThemedText>
                <ThemedText
                  style={[
                    styles.ctaDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get your products online and start selling to more customers.
                  Full e-commerce features coming in the next update!
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.ctaButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Coming Soon!",
                      "We'll notify you when the online store features are ready. Stay tuned!",
                      [{ text: "OK", style: "default" }]
                    );
                  }}
                >
                  <ThemedText style={styles.ctaButtonText}>
                    Get Notified
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Add Product Modal */}
        <Modal
          visible={showAddProduct}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddProduct(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAddProduct(false)}
                style={styles.modalCloseButton}
                accessibilityLabel="Close add product modal"
                accessibilityRole="button"
              >
                <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
            <ProductForm onProductCreated={() => setShowAddProduct(false)} />
          </SafeAreaView>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          visible={showEditForm && selectedProduct !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowEditForm(false);
            setSelectedProduct(null);
          }}
        >
          {selectedProduct && (
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditForm(false);
                    setSelectedProduct(null);
                  }}
                  style={styles.modalCloseButton}
                >
                  <ThemedText style={styles.modalCloseText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
              <EditProductForm
                product={selectedProduct}
                onProductUpdated={() => {
                  setShowEditForm(false);
                  setSelectedProduct(null);
                }}
                onCancel={() => {
                  setShowEditForm(false);
                  setSelectedProduct(null);
                }}
              />
            </SafeAreaView>
          )}
        </Modal>

        {/* Product Details Modal */}
        <Modal
          visible={showProductDetails && selectedProduct !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowProductDetails(false);
            setSelectedProduct(null);
          }}
        >
          {selectedProduct && (
            <ProductDetails
              product={selectedProduct}
              onEdit={() => {
                setShowProductDetails(false);
                handleEditProduct(selectedProduct);
              }}
              onDelete={() => handleDeleteProduct(selectedProduct)}
              onClose={() => {
                setShowProductDetails(false);
                setSelectedProduct(null);
              }}
            />
          )}
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
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
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
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
    fontSize: 20,
    color: "#007AFF",
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 16,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
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
    opacity: 0.7,
    fontSize: 14,
  },
  comingSoonBadge: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  ctaCard: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
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
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: "white",
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
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
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
    borderBottomColor: "#eee",
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

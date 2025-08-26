import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

import { formatCurrency } from "@/utils/helpers";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function StoreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const mockProducts = [
    {
      id: "1",
      name: "Sample Product 1",
      price: 5000,
      description: "A great product for your customers",
      inStock: true,
    },
    {
      id: "2",
      name: "Sample Product 2",
      price: 10000,
      description: "Another excellent product",
      inStock: true,
    },
    {
      id: "3",
      name: "Sample Product 3",
      price: 7500,
      description: "Premium quality item",
      inStock: false,
    },
  ];

  // ...existing code...

  const renderProductCard = (product: any) => (
    <View
      key={product.id}
      style={[styles.productCard, { backgroundColor: colors.surfaceVariant }]}
    >
      <View
        style={[
          styles.productImage,
          { backgroundColor: colors.surfaceVariant },
        ]}
      >
        <IconSymbol name="bag.fill" size={32} color={colors.tabIconDefault} />
      </View>
      <View style={styles.productInfo}>
        <ThemedText style={[styles.productName, { color: colors.text }]}>
          {product.name}
        </ThemedText>
        <ThemedText
          style={[styles.productDescription, { color: colors.textSecondary }]}
        >
          {product.description}
        </ThemedText>
        <ThemedText
          style={[styles.productPrice, { color: colors.currencyPositive }]}
        >
          {formatCurrency(product.price)}
        </ThemedText>
        <View style={styles.stockStatus}>
          <View
            style={[
              styles.stockIndicator,
              {
                backgroundColor: product.inStock
                  ? colors.success
                  : colors.error,
              },
            ]}
          />
          <ThemedText
            style={[
              styles.stockText,
              { color: product.inStock ? colors.success : colors.error },
            ]}
          >
            {product.inStock ? "In Stock" : "Out of Stock"}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <IconSymbol name="pencil" size={16} color={colors.secondary} />
      </TouchableOpacity>
    </View>
  );

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
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={16} color={colors.background} />
                <ThemedText style={styles.addButtonText}>
                  Add Product
                </ThemedText>
              </TouchableOpacity>
            </View>

            {mockProducts.map(renderProductCard)}
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ThemedText
              type="subtitle"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Store Features
            </ThemedText>

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
                  3
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
              >
                <ThemedText style={styles.ctaButtonText}>
                  Get Notified
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  productCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  productDescription: {
    opacity: 0.7,
    marginBottom: 8,
  },
  productPrice: {
    fontWeight: "bold",
    color: "#34C759",
    marginBottom: 8,
  },
  stockStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 12,
    opacity: 0.8,
  },
  editButton: {
    padding: 8,
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
});

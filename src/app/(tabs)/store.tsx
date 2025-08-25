import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function StoreScreen() {
  const colorScheme = useColorScheme();

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

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  const renderProductCard = (product: any) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productImage}>
        <IconSymbol
          name="bag.fill"
          size={32}
          color={Colors[colorScheme ?? "light"].tabIconDefault}
        />
      </View>
      <View style={styles.productInfo}>
        <ThemedText style={styles.productName}>{product.name}</ThemedText>
        <ThemedText style={styles.productDescription}>
          {product.description}
        </ThemedText>
        <ThemedText style={styles.productPrice}>
          {formatCurrency(product.price)}
        </ThemedText>
        <View style={styles.stockStatus}>
          <View
            style={[
              styles.stockIndicator,
              { backgroundColor: product.inStock ? "#34C759" : "#FF3B30" },
            ]}
          />
          <ThemedText style={styles.stockText}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </ThemedText>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton}>
        <IconSymbol name="pencil" size={16} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderComingSoonFeature = (
    title: string,
    description: string,
    icon: any
  ) => (
    <View style={styles.featureCard}>
      <IconSymbol name={icon} size={24} color="#FF9500" />
      <View style={styles.featureInfo}>
        <ThemedText style={styles.featureTitle}>{title}</ThemedText>
        <ThemedText style={styles.featureDescription}>{description}</ThemedText>
      </View>
      <View style={styles.comingSoonBadge}>
        <ThemedText style={styles.comingSoonText}>Soon</ThemedText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title">Store</ThemedText>
            <ThemedText style={styles.subtitle}>
              Manage your products and online presence
            </ThemedText>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Products</ThemedText>
              <TouchableOpacity style={styles.addButton}>
                <IconSymbol name="plus" size={16} color="white" />
                <ThemedText style={styles.addButtonText}>
                  Add Product
                </ThemedText>
              </TouchableOpacity>
            </View>

            {mockProducts.map(renderProductCard)}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Store Features
            </ThemedText>

            <View style={styles.storeStatsCard}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>0</ThemedText>
                <ThemedText style={styles.statLabel}>Orders Today</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>3</ThemedText>
                <ThemedText style={styles.statLabel}>
                  Active Products
                </ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>₦0</ThemedText>
                <ThemedText style={styles.statLabel}>Store Revenue</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
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

          <View style={styles.section}>
            <View style={styles.ctaCard}>
              <IconSymbol name="sparkles" size={32} color="#007AFF" />
              <ThemedText type="subtitle" style={styles.ctaTitle}>
                Launch Your Online Store
              </ThemedText>
              <ThemedText style={styles.ctaDescription}>
                Get your products online and start selling to more customers.
                Full e-commerce features coming in the next update!
              </ThemedText>
              <TouchableOpacity style={styles.ctaButton}>
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

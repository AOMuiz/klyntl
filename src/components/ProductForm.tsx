import { useProductCategories } from "@/hooks/useProductCategories";
import { useProducts } from "@/hooks/useProducts";
import { CreateProductInput } from "@/types/product";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ProductFormProps {
  onProductCreated?: () => void;
}

export function ProductForm({ onProductCreated }: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<CreateProductInput>>({
    name: "",
    description: "",
    price: 0,
    costPrice: 0,
    sku: "",
    category: "",
    stockQuantity: 0,
    lowStockThreshold: 5,
  });

  const { createProduct, isCreating } = useProducts();
  const { categories } = useProductCategories();

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      Alert.alert("Error", "Please fill in required fields (Name, Price)");
      return;
    }

    createProduct(
      {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice) || 0,
        sku: formData.sku,
        category: formData.category,
        stockQuantity: Number(formData.stockQuantity) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Product created successfully!");
          setFormData({
            name: "",
            description: "",
            price: 0,
            costPrice: 0,
            sku: "",
            category: "",
            stockQuantity: 0,
            lowStockThreshold: 5,
          });
          onProductCreated?.();
        },
        onError: (error) => {
          Alert.alert("Error", `Failed to create product: ${error.message}`);
        },
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Add New Product
      </ThemedText>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Product Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter product name"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>Description</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          placeholder="Enter product description"
          placeholderTextColor="#666"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Price (NGN) *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.price?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, price: Number(text) || 0 })
            }
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Cost Price (NGN)</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.costPrice?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, costPrice: Number(text) || 0 })
            }
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={styles.label}>SKU</ThemedText>
        <TextInput
          style={styles.input}
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
          placeholder="Enter SKU (optional)"
          placeholderTextColor="#666"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Stock Quantity</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.stockQuantity?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, stockQuantity: Number(text) || 0 })
            }
            placeholder="0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={styles.label}>Low Stock Alert</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.lowStockThreshold?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, lowStockThreshold: Number(text) || 5 })
            }
            placeholder="5"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Text
          style={[styles.button, isCreating && styles.buttonDisabled]}
          onPress={!isCreating ? handleSubmit : undefined}
        >
          {isCreating ? "Creating..." : "Create Product"}
        </Text>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#2E7D32",
    color: "white",
    textAlign: "center",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});

import { useProducts } from "@/hooks/useProducts";
import { Product, UpdateProductInput } from "@/types/product";
import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface EditProductFormProps {
  product: Product;
  onProductUpdated?: () => void;
  onCancel?: () => void;
}

export function EditProductForm({
  product,
  onProductUpdated,
  onCancel,
}: EditProductFormProps) {
  const [formData, setFormData] = useState<Partial<UpdateProductInput>>({
    name: product.name,
    description: product.description || "",
    price: product.price,
    costPrice: product.costPrice,
    sku: product.sku || "",
    category: product.category || "",
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    isActive: product.isActive,
  });

  const { updateProduct, isUpdating } = useProducts();

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      Alert.alert("Error", "Please fill in required fields (Name, Price)");
      return;
    }

    updateProduct(
      {
        id: product.id,
        updates: {
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          costPrice: Number(formData.costPrice) || 0,
          sku: formData.sku,
          category: formData.category,
          stockQuantity: Number(formData.stockQuantity) || 0,
          lowStockThreshold: Number(formData.lowStockThreshold) || 5,
          isActive: formData.isActive,
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Product updated successfully!");
          onProductUpdated?.();
        },
        onError: (error) => {
          Alert.alert("Error", `Failed to update product: ${error.message}`);
        },
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Edit Product
        </ThemedText>
        <View style={styles.headerButtons}>
          <Text style={styles.cancelButton} onPress={onCancel}>
            Cancel
          </Text>
          <Text
            style={[styles.saveButton, isUpdating && styles.buttonDisabled]}
            onPress={!isUpdating ? handleSubmit : undefined}
          >
            {isUpdating ? "Saving..." : "Save"}
          </Text>
        </View>
      </View>

      <View style={styles.form}>
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

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Category</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) =>
              setFormData({ ...formData, category: text })
            }
            placeholder="Enter category (optional)"
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
                setFormData({
                  ...formData,
                  lowStockThreshold: Number(text) || 5,
                })
              }
              placeholder="5"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.switchRow}>
          <ThemedText style={styles.label}>Product Active</ThemedText>
          <Switch
            value={formData.isActive}
            onValueChange={(value) =>
              setFormData({ ...formData, isActive: value })
            }
            trackColor={{ false: "#ccc", true: "#2E7D32" }}
            thumbColor={formData.isActive ? "#fff" : "#fff"}
          />
        </View>
      </View>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 16,
  },
  cancelButton: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    padding: 8,
  },
  saveButton: {
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "600",
    padding: 8,
  },
  buttonDisabled: {
    color: "#ccc",
  },
  form: {
    padding: 16,
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
});

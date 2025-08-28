import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useProductCategories } from "@/hooks/useProductCategories";
import { useProducts } from "@/hooks/useProducts";
import { CreateProductInput } from "@/types/product";
import { validateNumber, validatePositiveInteger } from "@/utils/validations";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface ProductFormProps {
  onProductCreated?: () => void;
}

export function ProductForm({ onProductCreated }: ProductFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
    if (
      !formData.name ||
      formData.price === null ||
      formData.price === undefined
    ) {
      Alert.alert("Error", "Please fill in required fields (Name, Price)");
      return;
    }

    createProduct(
      {
        name: formData.name,
        description: formData.description,
        price: validateNumber(formData.price, 0),
        costPrice: validateNumber(formData.costPrice ?? 0, 0),
        sku: formData.sku,
        category: formData.category,
        stockQuantity: validatePositiveInteger(formData.stockQuantity ?? 0, 0),
        lowStockThreshold: validatePositiveInteger(
          formData.lowStockThreshold ?? 0,
          5
        ),
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
    <ThemedView style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.formGroup}>
        <ThemedText style={[styles.label, { color: colors.text }]}>
          Product Name *
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.secondarySurface,
              color: colors.text,
            },
          ]}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter product name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={[styles.label, { color: colors.text }]}>
          Description
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              borderColor: colors.border,
              backgroundColor: colors.secondarySurface,
              color: colors.text,
            },
          ]}
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          placeholder="Enter product description"
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Price (NGN) *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.secondarySurface,
                color: colors.text,
              },
            ]}
            value={formData.price?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, price: Number(text) || 0 })
            }
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Cost Price (NGN)
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.secondarySurface,
                color: colors.text,
              },
            ]}
            value={formData.costPrice?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, costPrice: Number(text) || 0 })
            }
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <ThemedText style={[styles.label, { color: colors.text }]}>
          SKU
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.secondarySurface,
              color: colors.text,
            },
          ]}
          value={formData.sku}
          onChangeText={(text) => setFormData({ ...formData, sku: text })}
          placeholder="Enter SKU (optional)"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Stock Quantity
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.secondarySurface,
                color: colors.text,
              },
            ]}
            value={formData.stockQuantity?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, stockQuantity: Number(text) || 0 })
            }
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, styles.halfWidth]}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Low Stock Alert
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.secondarySurface,
                color: colors.text,
              },
            ]}
            value={formData.lowStockThreshold?.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, lowStockThreshold: Number(text) || 5 })
            }
            placeholder="5"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            isCreating && styles.buttonDisabled,
          ]}
          onPress={!isCreating ? handleSubmit : undefined}
        >
          <ThemedText style={[styles.buttonText, { color: colors.background }]}>
            {isCreating ? "Creating..." : "Create Product"}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

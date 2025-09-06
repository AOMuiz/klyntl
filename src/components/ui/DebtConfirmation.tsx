import { ThemedText } from "@/components/ThemedText";
import { formatCurrency } from "@/utils/currency";
import { hp, spacing, wp } from "@/utils/responsive_dimensions_system";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";

type Props = {
  amount: number | string;
  customerName?: string;
  color: string; // hex color like '#00FF00'
  variant?: "add" | "remove" | "remaining";
};

export default function DebtConfirmation({
  amount,
  customerName,
  color,
  variant = "add",
}: Props) {
  const theme = useTheme();
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = formatCurrency(Number(numeric) || 0);
  const bg = color + "20"; // light background using same color with transparency nibble

  const bodyText =
    variant === "add"
      ? `${formatted} will be added to ${customerName ?? "customer"}'s debt.`
      : variant === "remove"
      ? `${formatted} will be removed from ${
          customerName ?? "customer"
        }'s debt.`
      : `Remaining Debt: ${formatted}`;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color }]}>Confirmation</ThemedText>
        <ThemedText
          style={[styles.body, { color: theme.colors.onSurfaceVariant }]}
        >
          {bodyText}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    alignItems: "center",
  },
  accent: {
    width: 6,
    height: "100%",
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    marginRight: wp(12),
  },
  content: {
    flex: 1,
    paddingVertical: spacing(8),
  },
  title: {
    fontSize: wp(18),
    marginBottom: spacing(6),
  },
  body: {
    fontSize: wp(16),
    lineHeight: hp(22),
  },
});

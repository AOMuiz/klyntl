import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, useTheme } from "react-native-paper";

interface SimpleCustomerCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  backgroundColor: string;
  onPress?: () => void;
}

export default function SimpleCustomerCard({
  title,
  value,
  icon,
  color,
  backgroundColor,
  onPress,
}: SimpleCustomerCardProps) {
  const theme = useTheme();

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      elevation={2}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        style={styles.cardContent}
      >
        <View style={[styles.iconContainer, { backgroundColor }]}>
          <IconSymbol name={icon as any} size={24} color={color} />
        </View>

        <View style={styles.textContainer}>
          <ThemedText style={[styles.value, { color }]} numberOfLines={1}>
            {value}
          </ThemedText>
          <ThemedText
            style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {title}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
});

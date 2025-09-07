import { styles } from "@/screens/transaction/TransactionsScreen.styles";
import { TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { IconSymbol } from "../ui/IconSymbol";

export const TransactionHeader = ({
  colors,
  handleAddTransaction,
}: {
  colors: any;
  handleAddTransaction: () => void;
}) => (
  <View style={styles.headerRow}>
    <ThemedText
      type="title"
      style={[styles.headerTitle, { color: colors.paper.onSurface }]}
    >
      Transactions
    </ThemedText>
    <TouchableOpacity style={styles.addButton} onPress={handleAddTransaction}>
      <IconSymbol name="plus" size={24} color="white" />
    </TouchableOpacity>
  </View>
);

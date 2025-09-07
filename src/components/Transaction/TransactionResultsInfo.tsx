import { styles } from "@/screens/transaction/TransactionsScreen.styles";
import { Transaction, TransactionWithCustomer } from "@/types/transaction";
import { View } from "react-native";
import { Text } from "react-native-paper";

// Reusable UI Components

export const TransactionResultsInfo = ({
  filteredTransactions,
  transactions,
  colors,
}: {
  filteredTransactions: TransactionWithCustomer[];
  transactions: Transaction[];
  colors: any;
}) => {
  if (filteredTransactions.length === 0) return null;

  return (
    <View style={styles.resultsInfo}>
      <Text
        variant="bodySmall"
        style={{ color: colors.paper.onSurfaceVariant }}
      >
        Showing {filteredTransactions.length} of {transactions.length}{" "}
        transactions
        {filteredTransactions.length < transactions.length && " (filtered)"}
      </Text>
    </View>
  );
};

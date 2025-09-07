import { styles } from "@/screens/transaction/TransactionsScreen.styles";
import { TextInput, View } from "react-native";
import { IconSymbol } from "../ui/IconSymbol";

export const TransactionSearchBar = ({
  searchQuery,
  setSearchQuery,
  colors,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  colors: any;
}) => (
  <View
    style={[
      styles.searchContainer,
      { backgroundColor: colors.paper.surfaceVariant },
    ]}
  >
    <IconSymbol
      name="magnifyingglass"
      size={20}
      color={colors.paper.onSurfaceVariant}
    />
    <TextInput
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search by customer or description"
      placeholderTextColor={colors.paper.onSurfaceVariant}
      style={[styles.searchInput, { color: colors.paper.onSurface }]}
      returnKeyType="search"
    />
  </View>
);

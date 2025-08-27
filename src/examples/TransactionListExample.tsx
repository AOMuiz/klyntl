import { useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTransactions } from "../hooks/useTransactions";
import { CreateTransactionInput } from "../types/transaction";

interface TransactionListExampleProps {
  customerId?: string;
}

export function TransactionListExample({
  customerId,
}: TransactionListExampleProps) {
  const {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
    isDeleting,
    refetch,
  } = useTransactions(customerId);

  // Get customers for the dropdown (commented out for now)
  // const { customers } = useCustomers();

  const [newTransaction, setNewTransaction] = useState({
    customerId: customerId || "",
    amount: "",
    description: "",
    type: "sale" as "sale" | "refund",
  });

  const handleCreateTransaction = () => {
    if (!newTransaction.customerId || !newTransaction.amount) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const transactionData: CreateTransactionInput = {
      customerId: newTransaction.customerId,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      date: new Date().toISOString(),
      type: newTransaction.type,
    };

    createTransaction(transactionData);

    // Clear form
    setNewTransaction({
      customerId: customerId || "",
      amount: "",
      description: "",
      type: "sale",
    });
  };

  const handleDeleteTransaction = (id: string, description: string) => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete "${description}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Error: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Transactions ({transactions.length})
      </Text>

      {/* Create Transaction Form */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
          Add New Transaction
        </Text>

        {!customerId && (
          <View style={{ marginBottom: 10 }}>
            <Text>Customer:</Text>
            {/* In a real app, this would be a proper picker/dropdown */}
            <Text style={{ fontSize: 12, color: "#666" }}>
              Customer ID: {newTransaction.customerId || "Select a customer"}
            </Text>
          </View>
        )}

        <TextInput
          value={newTransaction.amount}
          onChangeText={(amount) =>
            setNewTransaction({ ...newTransaction, amount })
          }
          placeholder="Amount"
          keyboardType="numeric"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <TextInput
          value={newTransaction.description}
          onChangeText={(description) =>
            setNewTransaction({ ...newTransaction, description })
          }
          placeholder="Description"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
          }}
        />

        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() =>
              setNewTransaction({ ...newTransaction, type: "sale" })
            }
            style={{
              backgroundColor:
                newTransaction.type === "sale" ? "#007AFF" : "#ccc",
              padding: 10,
              borderRadius: 5,
              marginRight: 10,
            }}
          >
            <Text style={{ color: "white" }}>Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setNewTransaction({ ...newTransaction, type: "refund" })
            }
            style={{
              backgroundColor:
                newTransaction.type === "refund" ? "#007AFF" : "#ccc",
              padding: 10,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white" }}>Refund</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleCreateTransaction}
          disabled={isCreating}
          style={{
            backgroundColor: isCreating ? "#ccc" : "#007AFF",
            padding: 15,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>
            {isCreating ? "Creating..." : "Add Transaction"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      {isLoading ? (
        <Text>Loading transactions...</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 15,
                borderWidth: 1,
                borderColor: "#eee",
                marginBottom: 10,
                borderRadius: 5,
                backgroundColor: item.type === "refund" ? "#ffe6e6" : "#e6f7ff",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                ${item.amount} ({item.type})
              </Text>
              {item.description && <Text>{item.description}</Text>}
              <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
              <Text>Customer ID: {item.customerId}</Text>

              <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    updateTransaction({
                      id: item.id,
                      updates: { description: `${item.description} (Updated)` },
                    })
                  }
                  disabled={isUpdating}
                  style={{
                    backgroundColor: "#28a745",
                    padding: 10,
                    borderRadius: 5,
                    marginRight: 10,
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {isUpdating ? "Updating..." : "Update"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleDeleteTransaction(
                      item.id,
                      item.description || "Transaction"
                    )
                  }
                  disabled={isDeleting}
                  style={{
                    backgroundColor: "#dc3545",
                    padding: 10,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ color: "white" }}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

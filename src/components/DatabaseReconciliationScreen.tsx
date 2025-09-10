import { reconcileDeviceBalances } from "@/scripts/deviceBalanceReconciliation";
import { analyzeLinkedTransactions } from "@/scripts/linkedTransactionAnalysis";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Database Debug Screen Component
 *
 * Provides tools for database reconciliation and analysis
 */
export function DatabaseReconciliationScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleReconcileBalances = async () => {
    setIsLoading(true);

    try {
      console.log("🔄 Starting balance reconciliation...");
      const result = await reconcileDeviceBalances();

      if (result.success) {
        const { corrections = [] } = result;

        if (corrections.length === 0) {
          const message = "✅ All customer balances are correct!";
          setLastResult(message);
          Alert.alert("Balance Check Complete", "No corrections needed.");
        } else {
          const message = `✅ Fixed ${
            corrections.length
          } customer balances:\n${corrections
            .map(
              (c: any) =>
                `• ${c.name}: ₦${(c.correctOutstanding / 100).toLocaleString()}`
            )
            .join("\n")}`;
          setLastResult(message);
          Alert.alert(
            "Reconciliation Complete",
            `Fixed ${corrections.length} customers.`
          );
        }
      } else {
        const message = `❌ Reconciliation failed: ${result.error}`;
        setLastResult(message);
        Alert.alert("Reconciliation Failed", result.error || "Unknown error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLastResult(`❌ Error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeLinkedTransactions = async () => {
    setIsLoading(true);

    try {
      console.log("🔍 Analyzing linked transactions...");
      const analysis = await analyzeLinkedTransactions();

      const message = `📊 Linked Transaction Analysis:
• Total: ${analysis.totalTransactions}
• Linked: ${analysis.linkedTransactions}
• Orphaned: ${analysis.orphanedLinks}
• Missing: ${analysis.missingLinks}

${
  analysis.recommendations.length > 0
    ? "Recommendations:\n" +
      analysis.recommendations.map((r) => `• ${r}`).join("\n")
    : "✅ No issues found"
}`;

      setLastResult(message);
      Alert.alert("Analysis Complete", "Check the results below.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setLastResult(`❌ Analysis error: ${errorMessage}`);
      Alert.alert("Analysis Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setIsLoading(true);

    try {
      console.log("🏥 Running comprehensive health check...");

      // Run both checks
      await handleReconcileBalances();
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Small delay
      await handleAnalyzeLinkedTransactions();

      Alert.alert("Health Check Complete", "Database health check finished!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Health Check Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Reconciliation</Text>
        <Text style={styles.subtitle}>
          Fix balance discrepancies and analyze transaction integrity
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleReconcileBalances}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Reconciling..." : "Fix Customer Balances"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleAnalyzeLinkedTransactions}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Analyzing..." : "Analyze Linked Transactions"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.healthButton]}
          onPress={handleRunHealthCheck}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Running..." : "Run Full Health Check"}
          </Text>
        </TouchableOpacity>
      </View>

      {lastResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Last Result:</Text>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About Database Reconciliation:</Text>
        <Text style={styles.infoText}>
          • Fix Customer Balances: Recalculates and fixes customer outstanding
          and credit balances based on transaction history
        </Text>
        <Text style={styles.infoText}>
          • Analyze Linked Transactions: Checks the integrity of
          linkedTransactionId usage and identifies orphaned links
        </Text>
        <Text style={styles.infoText}>
          • Health Check: Runs all checks and provides a comprehensive database
          health assessment
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  healthButton: {
    backgroundColor: "#FF9500",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resultContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  resultText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    lineHeight: 20,
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
});

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

import { reconcileDeviceBalances } from "@/scripts/deviceBalanceReconciliation";
import { analyzeLinkedTransactions } from "@/scripts/linkedTransactionAnalysis";
import {
  analyzeDatabase,
  createDebugSnapshot,
  exportDatabase,
  shareDatabase,
} from "@/utils/database-debug";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card } from "react-native-paper";

/**
 * Debug Screen Component
 * Add this to your app for easy database debugging and export
 * You can navigate to this screen from developer settings or a hidden menu
 */
export default function DatabaseDebugScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [lastExportPath, setLastExportPath] = useState<string>("");
  const [reconciliationResult, setReconciliationResult] = useState<
    string | null
  >(null);

  const handleExportDatabase = async () => {
    setIsLoading(true);
    try {
      const exportPath = await exportDatabase();
      if (exportPath) {
        setLastExportPath(exportPath);
        Alert.alert(
          "Export Successful",
          `Database exported to:\n${exportPath}\n\nYou can now copy this file to your computer for analysis.`
        );
      } else {
        Alert.alert("Export Failed", "Could not export database");
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Export Failed", `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareDatabase = async () => {
    setIsLoading(true);
    try {
      await shareDatabase();
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Share Failed", `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setIsLoading(true);
    try {
      const snapshotPath = await createDebugSnapshot();
      Alert.alert(
        "Snapshot Created",
        `Debug snapshot saved to:\n${snapshotPath}`
      );
    } catch (error) {
      console.error("Snapshot error:", error);
      Alert.alert("Snapshot Failed", `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeDatabase = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeDatabase();
      setAnalysisResult(result);

      const { summary } = result;
      if (summary.isHealthy) {
        Alert.alert(
          "Database Healthy",
          "No issues found in database consistency check."
        );
      } else {
        Alert.alert(
          "Issues Found",
          `Found:\n• ${summary.discrepancyCount} balance discrepancies\n• ${summary.orphanedCount} orphaned transactions\n• ${summary.invalidStatusCount} invalid statuses`
        );
      }
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("Analysis Failed", `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconcileBalances = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Starting balance reconciliation...");
      const result = await reconcileDeviceBalances();

      if (result.success) {
        const { corrections = [] } = result;

        if (corrections.length === 0) {
          const message = "✅ All customer balances are correct!";
          setReconciliationResult(message);
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
          setReconciliationResult(message);
          Alert.alert(
            "Reconciliation Complete",
            `Fixed ${corrections.length} customers.`
          );
        }
      } else {
        const message = `❌ Reconciliation failed: ${result.error}`;
        setReconciliationResult(message);
        Alert.alert("Reconciliation Failed", result.error || "Unknown error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setReconciliationResult(`❌ Error: ${errorMessage}`);
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

      setReconciliationResult(message);
      Alert.alert("Analysis Complete", "Check the results below.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setReconciliationResult(`❌ Analysis error: ${errorMessage}`);
      Alert.alert("Analysis Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1, padding: 20 }}>
      <ScrollView>
        <ThemedText type="title" style={{ marginBottom: 20 }}>
          Database Debug Tools
        </ThemedText>

        <ThemedText style={{ marginBottom: 20, opacity: 0.8 }}>
          Use these tools to debug database issues, export data for analysis,
          and check data consistency.
        </ThemedText>

        <Card style={{ marginBottom: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 15 }}>
            Export & Share
          </ThemedText>

          <View style={{ gap: 10 }}>
            <Button
              onPress={handleExportDatabase}
              disabled={isLoading}
              style={{ marginBottom: 10 }}
            >
              <ThemedText>Export Database</ThemedText>
            </Button>

            <Button onPress={handleShareDatabase} disabled={isLoading}>
              <ThemedText>Share Database</ThemedText>
            </Button>
          </View>

          {lastExportPath && (
            <ThemedText style={{ fontSize: 12, marginTop: 10, opacity: 0.6 }}>
              Last export: {lastExportPath.split("/").pop()}
            </ThemedText>
          )}
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 15 }}>
            Analysis & Debugging
          </ThemedText>

          <View style={{ gap: 10 }}>
            <Button
              onPress={handleAnalyzeDatabase}
              disabled={isLoading}
              style={{ marginBottom: 10 }}
              mode="outlined"
            >
              <ThemedText>Analyze Database</ThemedText>
            </Button>

            <Button
              onPress={handleCreateSnapshot}
              disabled={isLoading}
              mode="outlined"
            >
              <ThemedText>Create Debug Snapshot</ThemedText>
            </Button>
          </View>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <ThemedText type="subtitle" style={{ marginBottom: 15 }}>
            Database Reconciliation
          </ThemedText>

          <View style={{ gap: 10 }}>
            <Button
              onPress={handleReconcileBalances}
              disabled={isLoading}
              style={{ marginBottom: 10 }}
              mode="contained"
            >
              <ThemedText>Fix Customer Balances</ThemedText>
            </Button>

            <Button
              onPress={handleAnalyzeLinkedTransactions}
              disabled={isLoading}
              mode="outlined"
            >
              <ThemedText>Analyze Linked Transactions</ThemedText>
            </Button>
          </View>
        </Card>

        {analysisResult && (
          <Card>
            <ThemedText type="subtitle" style={{ marginBottom: 15 }}>
              Analysis Results
            </ThemedText>

            <View style={{ gap: 10 }}>
              <ThemedText>
                Status:{" "}
                {analysisResult.summary.isHealthy
                  ? "✅ Healthy"
                  : "⚠️ Issues Found"}
              </ThemedText>

              <ThemedText>
                Balance Discrepancies: {analysisResult.summary.discrepancyCount}
              </ThemedText>

              <ThemedText>
                Orphaned Transactions: {analysisResult.summary.orphanedCount}
              </ThemedText>

              <ThemedText>
                Invalid Statuses: {analysisResult.summary.invalidStatusCount}
              </ThemedText>
            </View>

            {analysisResult.balanceDiscrepancies.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>
                  Balance Discrepancies:
                </ThemedText>
                {analysisResult.balanceDiscrepancies
                  .slice(0, 5)
                  .map((item: any, index: number) => (
                    <ThemedText
                      key={index}
                      style={{ fontSize: 12, marginBottom: 5 }}
                    >
                      {item.name}: Stored ₦{item.stored_balance / 100} vs
                      Computed ₦{item.computed_balance / 100}
                    </ThemedText>
                  ))}
              </View>
            )}
          </Card>
        )}

        {reconciliationResult && (
          <Card style={{ marginTop: 20 }}>
            <ThemedText type="subtitle" style={{ marginBottom: 15 }}>
              Reconciliation Results
            </ThemedText>

            <ThemedText style={{ fontFamily: "monospace", lineHeight: 20 }}>
              {reconciliationResult}
            </ThemedText>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

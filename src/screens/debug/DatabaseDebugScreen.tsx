import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

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
      </ScrollView>
    </ThemedView>
  );
}

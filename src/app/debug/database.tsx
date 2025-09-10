import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card } from "react-native-paper";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { checkAndFixCreditBalanceColumn } from "@/utils/check-credit-balance-migration";
import {
  analyzeDatabase,
  createDebugSnapshot,
  exportDatabase,
  shareDatabase,
} from "@/utils/database-debug";
import { quickFixCreditBalanceColumn } from "@/utils/quick-fix-credit-balance";

/**
 * Database Debug Screen
 * Provides comprehensive database debugging and analysis tools
 * Only available in development builds
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

  const handleCheckCreditBalanceMigration = async () => {
    setIsLoading(true);
    try {
      await checkAndFixCreditBalanceColumn();
      Alert.alert(
        "Migration Check Complete",
        "Credit balance column has been verified/fixed."
      );
    } catch (error) {
      console.error("Migration check error:", error);
      Alert.alert("Migration Check Failed", `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFixCreditBalance = async () => {
    setIsLoading(true);
    try {
      await quickFixCreditBalanceColumn();
      Alert.alert(
        "Quick Fix Complete",
        "Credit balance column has been added/fixed."
      );
    } catch (error) {
      console.error("Quick fix error:", error);
      Alert.alert("Quick Fix Failed", `Error: ${error}`);
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
          <Card.Title title="Export & Share" />
          <Card.Content>
            <View style={{ gap: 10 }}>
              <Button
                mode="contained"
                onPress={handleExportDatabase}
                disabled={isLoading}
                style={{ marginBottom: 10 }}
              >
                Export Database
              </Button>

              <Button
                mode="outlined"
                onPress={handleShareDatabase}
                disabled={isLoading}
              >
                Share Database
              </Button>
            </View>

            {lastExportPath && (
              <ThemedText style={{ fontSize: 12, marginTop: 10, opacity: 0.6 }}>
                Last export: {lastExportPath.split("/").pop()}
              </ThemedText>
            )}
          </Card.Content>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <Card.Title title="Analysis & Debugging" />
          <Card.Content>
            <View style={{ gap: 10 }}>
              <Button
                mode="contained"
                onPress={handleAnalyzeDatabase}
                disabled={isLoading}
                style={{ marginBottom: 10 }}
              >
                Analyze Database
              </Button>

              <Button
                mode="outlined"
                onPress={handleCreateSnapshot}
                disabled={isLoading}
              >
                Create Debug Snapshot
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={{ marginBottom: 20 }}>
          <Card.Title title="Database Maintenance" />
          <Card.Content>
            <View style={{ gap: 10 }}>
              <Button
                mode="contained"
                onPress={handleCheckCreditBalanceMigration}
                disabled={isLoading}
                style={{ marginBottom: 10 }}
              >
                Check Credit Balance Migration
              </Button>

              <Button
                mode="outlined"
                onPress={handleQuickFixCreditBalance}
                disabled={isLoading}
              >
                Quick Fix Credit Balance Column
              </Button>

              <ThemedText style={{ fontSize: 12, opacity: 0.8 }}>
                Check Migration: Verifies and runs full migrations if needed.
                Quick Fix: Directly adds the missing column if it doesn&apos;t
                exist.
              </ThemedText>
            </View>
          </Card.Content>
        </Card>

        {analysisResult && (
          <Card>
            <Card.Title title="Analysis Results" />
            <Card.Content>
              <View style={{ gap: 10 }}>
                <ThemedText>
                  Status:{" "}
                  {analysisResult.summary.isHealthy
                    ? "✅ Healthy"
                    : "⚠️ Issues Found"}
                </ThemedText>

                <ThemedText>
                  Balance Discrepancies:{" "}
                  {analysisResult.summary.discrepancyCount}
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
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ marginBottom: 10 }}
                  >
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
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

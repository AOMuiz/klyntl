import { useDatabase, useDatabaseHealth } from "@/services/database/hooks";
import { getCurrentVersion } from "@/services/database/migrations";
import { createDatabaseService } from "@/services/database/service";
import { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";

export function DatabaseTest() {
  const { db, isReady, error } = useDatabase();
  const { isHealthy, checkHealth } = useDatabaseHealth();
  const [status, setStatus] = useState<string>("Initializing...");
  const [version, setVersion] = useState<number>(0);
  const [tableInfo, setTableInfo] = useState<any[]>([]);

  useEffect(() => {
    if (!isReady || !db) {
      setStatus("Database not ready...");
      return;
    }

    const checkDatabase = async () => {
      try {
        // Get current version
        const currentVersion = await getCurrentVersion(db);
        setVersion(currentVersion);

        // Get table structure
        const tables = await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        const info: any[] = [];
        for (const table of tables) {
          const tableStructure = await db.getAllAsync(
            `PRAGMA table_info(${table.name})`
          );
          info.push({
            tableName: table.name,
            columns: tableStructure,
          });
        }
        setTableInfo(info);
        setStatus("Database ready!");
      } catch (err) {
        console.error("Database check failed:", err);
        setStatus("Database check failed: " + (err as Error).message);
      }
    };

    checkDatabase();
  }, [db, isReady]);

  const testDatabaseOperations = async () => {
    if (!isReady || !db) {
      Alert.alert("Error", "Database not ready");
      return;
    }

    try {
      const dbService = createDatabaseService(db);

      // Test creating a customer
      const customer = await dbService.createCustomer({
        name: "Test Customer",
        phone: "+1234567890",
        email: "test@example.com",
        company: "Test Company",
      });

      Alert.alert("Success", `Created customer: ${customer.name}`);
    } catch (err) {
      console.error("Test operation failed:", err);
      Alert.alert("Error", "Test operation failed: " + (err as Error).message);
    }
  };

  if (error) {
    return (
      <View style={{ padding: 20, backgroundColor: "#ffebee" }}>
        <Text style={{ color: "#c62828", fontSize: 16, fontWeight: "bold" }}>
          Database Error
        </Text>
        <Text style={{ color: "#c62828", marginTop: 10 }}>
          {(error as Error).message}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
        Database Status Check
      </Text>

      <View
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Status: {status}</Text>
        <Text>Ready: {isReady ? "✅" : "❌"}</Text>
        <Text>Healthy: {isHealthy ? "✅" : "❌"}</Text>
        <Text>Schema Version: {version}</Text>
      </View>

      <View
        style={{
          backgroundColor: "white",
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
        }}
      >
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Tables:</Text>
        {tableInfo.map((table, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: "600", color: "#0c4a6e" }}>
              {table.tableName}:
            </Text>
            {table.columns.map((col: any, colIndex: number) => (
              <Text key={colIndex} style={{ marginLeft: 10, fontSize: 12 }}>
                • {col.name} ({col.type})
              </Text>
            ))}
          </View>
        ))}
      </View>

      <Button
        title="Test Database Operations"
        onPress={testDatabaseOperations}
        disabled={!isReady}
      />

      <View style={{ marginTop: 10 }}>
        <Button title="Check Health" onPress={checkHealth} />
      </View>
    </ScrollView>
  );
}

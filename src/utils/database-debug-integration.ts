/**
 * Database Debug Integration Guide
 *
 * This file shows how to integrate the database debugging tools into your Klyntl app.
 */

// Example navigation setup (add to your navigation file):
/*
import { createStackNavigator } from '@react-navigation/stack';
import DatabaseDebugScreen from '@/screens/debug/DatabaseDebugScreen';

// Your existing screens
import HomeScreen from '@/screens/HomeScreen';
import CustomerListScreen from '@/screens/CustomerListScreen';
import TransactionListScreen from '@/screens/TransactionListScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      // Your existing screens
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Customers" component={CustomerListScreen} />
      <Stack.Screen name="Transactions" component={TransactionListScreen} />

      // Add the debug screen - only in development
      {__DEV__ && (
        <Stack.Screen
          name="DatabaseDebug"
          component={DatabaseDebugScreen}
          options={{
            title: 'Database Debug',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  // Add navigation logic here
                }}
                style={{ marginRight: 15 }}
              >
                <Text style={{ color: '#007AFF' }}>Debug</Text>
              </TouchableOpacity>
            ),
          }}
        />
      )}
    </Stack.Navigator>
  );
}
*/

/**
 * Developer Menu Component
 *
 * Add this to your developer settings or hidden menu:
 */
/*
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function DeveloperMenu() {
  const navigation = useNavigation();

  if (!__DEV__) return null;

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate('DatabaseDebug')}
        style={{
          backgroundColor: '#f0f0f0',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10
        }}
      >
        <Text>🗄️ Database Debug Tools</Text>
      </TouchableOpacity>
    </View>
  );
}
*/

/**
 * Settings Screen Integration
 *
 * Add this to your existing settings screen:
 */
/*
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <View>
      // Your existing settings

      {__DEV__ && (
        <TouchableOpacity
          onPress={() => navigation.navigate('DatabaseDebug')}
          style={{ padding: 15, backgroundColor: '#fff3cd', margin: 10 }}
        >
          <Text>🔧 Developer Tools</Text>
          <Text style={{ fontSize: 12, color: '#856404' }}>
            Database analysis and debugging
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
*/

/**
 * Usage Instructions:
 *
 * 1. Add the DatabaseDebugScreen to your navigation
 * 2. Navigate to it from a developer menu or settings
 * 3. Use the tools to:
 *    - Export your database
 *    - Analyze for inconsistencies
 *    - Create debug snapshots
 *    - Share database files for analysis
 *
 * 4. For command-line analysis:
 *    npm run db:analyze    # Generate SQL analysis queries
 *    npm run db:debug      # Run balance discrepancy test
 *    npm run db:generate-test  # Create test database
 *
 * 5. Export the database from the app, then analyze locally:
 *    sqlite3 exported-db.db < analysis.sql
 */

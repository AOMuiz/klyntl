/**
 * Design System Demo Component
 *
 * Demonstrates the Klyntl design system components and patterns.
 * Use this as a reference for implementing consistent UI elements.
 */

import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
  FAB,
  List,
  Surface,
  Text,
} from "react-native-paper";
import {
  BorderRadius,
  Layout,
  LayoutPatterns,
  Spacing,
} from "../constants/Layout";
import { Typography } from "../constants/Typography";
import { useAppTheme } from "./ThemeProvider";

export const DesignSystemDemo: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container}>
      {/* Colors Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Brand Colors
        </Text>
        <View style={styles.colorRow}>
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.primary }]}
          />
          <Text variant="bodyMedium">Primary</Text>
        </View>
        <View style={styles.colorRow}>
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.secondary }]}
          />
          <Text variant="bodyMedium">Secondary</Text>
        </View>
        <View style={styles.colorRow}>
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.success }]}
          />
          <Text variant="bodyMedium">Success</Text>
        </View>
        <View style={styles.colorRow}>
          <View
            style={[styles.colorSwatch, { backgroundColor: colors.error }]}
          />
          <Text variant="bodyMedium">Error</Text>
        </View>
      </Surface>

      {/* Typography Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Typography
        </Text>
        <Text variant="displaySmall">Display Small</Text>
        <Text variant="headlineMedium">Headline Medium</Text>
        <Text variant="titleLarge">Title Large</Text>
        <Text variant="titleMedium">Title Medium</Text>
        <Text variant="bodyLarge">Body Large - Main content text</Text>
        <Text variant="bodyMedium">Body Medium - Secondary content</Text>
        <Text variant="labelLarge">Label Large</Text>
        <Text variant="labelMedium">Label Medium</Text>
        <View style={styles.currencyDemo}>
          <Text
            style={[Typography.currency, { color: colors.currencyPositive }]}
          >
            ₦125,000
          </Text>
          <Text
            style={[
              Typography.currencySmall,
              { color: colors.currencyNegative },
            ]}
          >
            -₦25,000
          </Text>
        </View>
      </Surface>

      {/* Buttons Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Buttons
        </Text>
        <View style={styles.buttonRow}>
          <Button mode="contained" style={styles.button}>
            Contained
          </Button>
          <Button mode="outlined" style={styles.button}>
            Outlined
          </Button>
          <Button mode="text" style={styles.button}>
            Text
          </Button>
        </View>
        <View style={styles.buttonRow}>
          <Button mode="contained-tonal" style={styles.button}>
            Tonal
          </Button>
          <Button mode="elevated" style={styles.button}>
            Elevated
          </Button>
        </View>
      </Surface>

      {/* Cards Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Cards
        </Text>

        {/* Customer Card Example */}
        <Card style={styles.customerCard}>
          <Card.Content>
            <View style={styles.customerHeader}>
              <Avatar.Text size={Layout.avatarSizeMedium} label="JD" />
              <View style={styles.customerInfo}>
                <Text variant="titleMedium">John Doe</Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.textSecondary }}
                >
                  +234 803 123 4567
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.textTertiary }}
                >
                  Last purchase: 2 days ago
                </Text>
              </View>
              <View style={styles.customerAmount}>
                <Text
                  variant="titleSmall"
                  style={[
                    Typography.currency,
                    { color: colors.currencyPositive },
                  ]}
                >
                  ₦45,000
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: colors.textSecondary }}
                >
                  Total Spent
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium">Monthly Revenue</Text>
            <Text
              variant="displaySmall"
              style={[
                Typography.currencyLarge,
                { color: colors.currencyPositive },
              ]}
            >
              ₦2,450,000
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              +12% from last month
            </Text>
          </Card.Content>
        </Card>
      </Surface>

      {/* Chips Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Chips
        </Text>
        <View style={styles.chipRow}>
          <Chip mode="outlined">Active</Chip>
          <Chip mode="flat">Inactive</Chip>
          <Chip icon="star">Featured</Chip>
        </View>
      </Surface>

      {/* List Section */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Lists
        </Text>
        <List.Item
          title="Customer Management"
          description="Manage your customer database"
          left={(props) => <List.Icon {...props} icon="account-group" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Sales Analytics"
          description="View sales reports and insights"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Settings"
          description="Configure app preferences"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </Surface>

      {/* Spacing Demo */}
      <Surface style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Spacing Scale
        </Text>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: Spacing.xs }]} />
          <Text variant="bodySmall">xs (4px)</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: Spacing.sm }]} />
          <Text variant="bodySmall">sm (8px)</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: Spacing.md }]} />
          <Text variant="bodySmall">md (16px)</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: Spacing.lg }]} />
          <Text variant="bodySmall">lg (24px)</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: Spacing.xl }]} />
          <Text variant="bodySmall">xl (32px)</Text>
        </View>
      </Surface>

      {/* FAB positioned absolutely */}
      <FAB icon="plus" style={styles.fab} onPress={() => {}} />
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    section: {
      margin: Spacing.md,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
    },

    sectionTitle: {
      marginBottom: Spacing.md,
      color: colors.text,
    },

    // Color swatches
    colorRow: {
      ...LayoutPatterns.row,
      marginBottom: Spacing.sm,
    },

    colorSwatch: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      marginRight: Spacing.sm,
    },

    // Button layouts
    buttonRow: {
      ...LayoutPatterns.row,
      marginBottom: Spacing.sm,
      flexWrap: "wrap",
    },

    button: {
      marginRight: Spacing.sm,
      marginBottom: Spacing.sm,
    },

    // Customer card
    customerCard: {
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
    },

    customerHeader: {
      ...LayoutPatterns.row,
    },

    customerInfo: {
      flex: 1,
      marginLeft: Spacing.sm,
    },

    customerAmount: {
      alignItems: "flex-end",
    },

    // Info card
    infoCard: {
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.lg,
    },

    // Currency demo
    currencyDemo: {
      ...LayoutPatterns.row,
      marginTop: Spacing.sm,
    },

    // Chips
    chipRow: {
      ...LayoutPatterns.row,
      flexWrap: "wrap",
    },

    // Spacing demo
    spacingDemo: {
      ...LayoutPatterns.row,
      marginBottom: Spacing.sm,
      alignItems: "center",
    },

    spacingBox: {
      height: 16,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.xs,
      marginRight: Spacing.sm,
    },

    // FAB
    fab: {
      position: "absolute",
      margin: Spacing.md,
      right: 0,
      bottom: 0,
    },
  });

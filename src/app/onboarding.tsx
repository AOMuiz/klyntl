import ScreenContainer from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { wp } from "@/utils/responsive_dimensions_system";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { ThemedText } from "../components/ThemedText";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "slide1",
    icon: "account-group",
    title: "Manage Your Customers Effortlessly",
    subtitle:
      "Easily add new customers, organize your contacts, and keep track of all your client information in one place.",
  },
  {
    key: "slide2",
    icon: "cash-multiple",
    title: "Track Sales & Transactions",
    subtitle:
      "Record transactions, track payments and outstanding balances so you can focus on growing your business.",
  },
  {
    key: "slide3",
    icon: "chart-line",
    title: "Insights to Help You Grow",
    subtitle:
      "See simple reports and customer behaviour to make better decisions and increase sales.",
  },
];

const STORAGE_KEY = "hasSeenOnboarding";

export default function Onboarding() {
  const router = useRouter();
  const listRef = useRef<FlatList<any> | null>(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  // Theme colors
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(STORAGE_KEY);
        if (seen === "true") {
          router.replace("/");
          return;
        }
      } catch {
        // ignore and show onboarding
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const finishOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore write errors
    }
    router.replace("/");
  }, [router]);

  const handleNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      finishOnboarding();
    }
  }, [finishOnboarding, index]);

  const handleSkip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    router.replace("/");
  }, [router]);

  if (loading) return null;

  const styles = makeStyles(colors);

  return (
    <ScreenContainer withPadding={false}>
      <TouchableOpacity style={styles.skip} onPress={handleSkip}>
        <ThemedText style={styles.skipText}>Skip</ThemedText>
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={100}
              color={colors.primary}
              style={styles.icon}
            />
            <ThemedText style={styles.title}>{item.title}</ThemedText>
            <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            mode={index === SLIDES.length - 1 ? "contained" : "outlined"}
            onPress={handleNext}
            contentStyle={styles.getStartedContent}
            labelStyle={
              index === SLIDES.length - 1
                ? styles.getStartedLabel
                : styles.nextLabel
            }
            style={
              index === SLIDES.length - 1
                ? [styles.getStarted, { backgroundColor: colors.primary }]
                : [styles.next, { borderColor: colors.primary }]
            }
          >
            {index === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push("/login")}
            contentStyle={styles.loginContent}
            labelStyle={styles.loginLabel}
            style={[styles.login, { borderColor: colors.primary }]}
          >
            Log In
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    skip: { position: "absolute", right: 20, top: 12, zIndex: 10 },
    skipText: { color: colors.text, fontSize: wp(16), opacity: 0.7 },
    page: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    icon: { marginBottom: 12 },
    title: {
      fontSize: wp(26),
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
      color: colors.text,
    },
    subtitle: {
      fontSize: wp(16),
      textAlign: "center",
      color: colors.text,
      opacity: 0.75,
      marginTop: 12,
      paddingHorizontal: 6,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    dots: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
    dot: { width: 36, height: 8, borderRadius: 8, marginHorizontal: 6 },
    dotActive: { backgroundColor: colors.primary },
    dotInactive: { backgroundColor: colors.card || "#ececec" },
    actions: { width: "100%" },
    getStarted: {
      borderRadius: 12,
      marginBottom: 12,
    },
    next: {
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
    },
    getStartedContent: { height: 56 },
    getStartedLabel: {
      color: colors.background,
      fontSize: wp(16),
      fontWeight: "700",
    },
    nextLabel: { color: colors.primary, fontSize: wp(16), fontWeight: "700" },
    login: { borderRadius: 12 },
    loginContent: { height: 56 },
    loginLabel: { color: colors.primary, fontSize: wp(16), fontWeight: "700" },
  });
}

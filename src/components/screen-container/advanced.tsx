import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccessibilityProps,
  ActivityIndicator,
  Animated,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { Header } from "react-native/Libraries/NewAppScreen";

import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { COLORS } from "@/utils/constants";
import { hp } from "@/utils/responsive_dimensions_system";
// import analytics from '@src/services/analytics'; // Your analytics service

// Types
interface NetworkBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ScreenContainerProps extends AccessibilityProps {
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  // Basic configuration
  withPadding?: boolean;
  paddingHorizontal?: number;
  paddingVertical?: number;
  edges?: Edge[];
  statusBarStyle?: "light-content" | "dark-content";
  hideStatusBar?: boolean;
  backgroundColor?: string;
  // Loading states
  isLoading?: boolean;
  LoadingComponent?: React.ComponentType<any>;
  // Scroll handling
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  refreshable?: boolean;
  onRefresh?: () => Promise<void>;
  // Keyboard handling
  keyboardShouldAvoidView?: boolean;
  dismissKeyboardOnTap?: boolean;
  // Modal presentation
  isModal?: boolean;
  onDismissModal?: () => void;
  // Navigation
  showHeader?: boolean;
  headerProps?: any;
  // Error handling
  ErrorComponent?: React.ComponentType<any>;
  onError?: (error: Error) => void;
  // Network
  showNetworkStatus?: boolean;
  // Analytics
  screenName?: string;
  // Animation
  animated?: boolean;
  animationDuration?: number;
  // Bottom sheet
  isBottomSheet?: boolean;
  bottomSheetHeight?: number;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: {
    children: ReactNode;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error);
    }
    console.log("screen_error", { error, errorInfo });

    // analytics.logError('screen_error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text>Something went wrong.</Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

// Network Banner Component
const NetworkBanner: React.FC<NetworkBannerProps> = ({
  visible,
  onDismiss,
}) => {
  const translateY = new Animated.Value(visible ? 0 : -50);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -50,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      style={[styles.networkBanner, { transform: [{ translateY }] }]}
    >
      <Text style={styles.networkBannerText}>No Internet Connection</Text>
      <TouchableOpacity onPress={onDismiss}>
        <Text style={styles.networkBannerDismiss}>Dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  containerStyle,
  contentStyle,
  withPadding = true,
  paddingHorizontal = 16,
  paddingVertical = 16,
  edges = ["top", "left", "right", "bottom"],
  statusBarStyle: providedStatusBarStyle,
  hideStatusBar = false,
  backgroundColor,
  isLoading = false,
  LoadingComponent,
  scrollable = false,
  scrollViewProps,
  refreshable = false,
  onRefresh,
  keyboardShouldAvoidView = false,
  dismissKeyboardOnTap = true,
  isModal = false,
  onDismissModal,
  showHeader = false,
  headerProps = {},
  ErrorComponent,
  onError,
  showNetworkStatus = true,
  screenName,
  animated = false,
  animationDuration = 300,
  isBottomSheet = false,
  bottomSheetHeight,
  ...accessibilityProps
}) => {
  const isDarkMode = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showNetworkBanner, setShowNetworkBanner] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(
    new Animated.Value(isBottomSheet ? bottomSheetHeight || 300 : 0)
  ).current;

  // Network monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      if (offline && showNetworkStatus) {
        setShowNetworkBanner(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Analytics tracking
  useEffect(() => {
    if (screenName) {
      console.log("analytics", { screenName });

      //   analytics.logScreenView(screenName);
    }
    return () => {
      if (screenName) {
        console.log("analytics", { screenName });

        // analytics.logScreenExit(screenName);
      }
    };
  }, [screenName]);

  // Animation
  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }).start();
    }
  }, [animated, animationDuration]);

  // Bottom sheet gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => isBottomSheet,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 && onDismissModal) {
          onDismissModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh]);

  // Keyboard dismiss handler
  const handleTouchStart = useCallback(() => {
    if (dismissKeyboardOnTap) {
      Keyboard.dismiss();
    }
  }, [dismissKeyboardOnTap]);

  // Status bar configuration
  const statusBarStyle =
    providedStatusBarStyle ?? (isDarkMode ? "light-content" : "dark-content");
  const bgColor = backgroundColor ?? (isDarkMode ? COLORS.dark : COLORS.white);

  // Component selection based on props
  const ContentWrapper = scrollable ? ScrollView : View;
  const KeyboardWrapper =
    keyboardShouldAvoidView && Platform.OS === "ios"
      ? KeyboardAvoidingView
      : View;
  const LoaderComponent = LoadingComponent || ActivityIndicator;
  const ErrorHandler = ErrorComponent || ErrorBoundary;

  const containerAnimatedStyle = animated
    ? { opacity: fadeAnim }
    : isBottomSheet
    ? { transform: [{ translateY }] }
    : {};

  return (
    <ErrorHandler onError={onError}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor },
          containerAnimatedStyle,
          containerStyle,
        ]}
        {...panResponder.panHandlers}
        {...accessibilityProps}
      >
        <SafeAreaView edges={edges} style={styles.safeArea}>
          <StatusBar
            barStyle={statusBarStyle}
            backgroundColor={bgColor}
            hidden={hideStatusBar}
          />

          {showNetworkBanner && (
            <NetworkBanner
              visible={isOffline}
              onDismiss={() => setShowNetworkBanner(false)}
            />
          )}

          {showHeader && <Header {...headerProps} />}

          <KeyboardWrapper
            style={styles.keyboardWrapper}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ContentWrapper
              style={[
                styles.content,
                withPadding && {
                  paddingHorizontal: hp(paddingHorizontal),
                  paddingVertical: hp(paddingVertical),
                },
                contentStyle,
              ]}
              onTouchStart={handleTouchStart}
              bounces={scrollable}
              showsVerticalScrollIndicator={false}
              refreshControl={
                refreshable ? (
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[COLORS.primary[300]]}
                  />
                ) : undefined
              }
              {...(scrollable && scrollViewProps)}
            >
              {children}
            </ContentWrapper>
            theme
          </KeyboardWrapper>

          {isLoading && (
            <View style={styles.loaderContainer}>
              <LoaderComponent size="large" color={COLORS.primary[300]} />
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </ErrorHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  keyboardWrapper: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  networkBanner: {
    backgroundColor: COLORS.danger,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  networkBannerText: {
    color: COLORS.white,
  },
  networkBannerDismiss: {
    color: COLORS.white,
    textDecorationLine: "underline",
  },
});

export default ScreenContainer;

// EXAMPLE USAGE:

// Basic scrollable screen with refresh
// {
/* <ScreenContainer
  scrollable
  refreshable
  onRefresh={handleRefresh}
  screenName="HomeScreen"
>
  <YourContent />
</ScreenContainer>

// Modal presentation with bottom sheet
<ScreenContainer
  isModal
  isBottomSheet
  bottomSheetHeight={400}
  onDismissModal={handleDismiss}
  edges={['bottom']}
>
  <ModalContent />
</ScreenContainer>

// Form screen with keyboard handling
<ScreenContainer
  keyboardShouldAvoidView
  dismissKeyboardOnTap
  showNetworkStatus={false}
>
  <FormComponent />
</ScreenContainer>

// Animated screen transition
<ScreenContainer
  animated
  animationDuration={500}
  showHeader
  headerProps={{
    title: "Profile",
    leftButton: "back"
  }}
>
  <ProfileContent />
</ScreenContainer> */
// }

/**
 * Jest test setup file
 * This file is automatically run before each test
 */

import "react-native-gesture-handler/jestSetup";

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn((callback) => {
      const tx = {
        executeSql: jest.fn((sql, params, success, error) => {
          // Mock successful database operations
          if (success) {
            success(tx, { rows: { length: 0, item: jest.fn() } });
          }
        }),
      };
      callback(tx);
    }),
  })),
}));

// Mock expo-contacts
jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  getContactsAsync: jest.fn(() =>
    Promise.resolve({
      data: [
        {
          id: "1",
          name: "John Doe",
          phoneNumbers: [{ number: "+2348012345678" }],
        },
      ],
    })
  ),
  Fields: {
    Name: "name",
    PhoneNumbers: "phoneNumbers",
  },
}));

// Mock expo-linking
jest.mock("expo-linking", () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Global test helpers
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test timeouts
jest.setTimeout(10000);

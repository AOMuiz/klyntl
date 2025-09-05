import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { useAuth } from "../authStore";

// Mock AsyncStorage
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const storageMock: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storageMock[key] || null)),
  setItem: jest.fn((key: string, value: string) => {
    storageMock[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete storageMock[key];
    return Promise.resolve();
  }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear storage mock
    Object.keys(storageMock).forEach((key) => delete storageMock[key]);
  });

  it("should initialize with no user", async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should register a new user", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register(
        "john@example.com",
        "password123",
        "+1234567890",
        "John Doe",
        "John's Business"
      );
    });

    expect(result.current.user).toEqual({
      id: expect.any(String),
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      businessName: "John's Business",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockAsyncStorage.setItem).toHaveBeenCalled();
  });

  it("should login with correct credentials", async () => {
    const { result } = renderHook(() => useAuth());

    // First register a user
    await act(async () => {
      await result.current.register(
        "john@example.com",
        "password123",
        "+1234567890",
        "John Doe",
        "John's Business"
      );
    });

    // Clear the store state to simulate fresh login
    await act(async () => {
      result.current.logout();
    });

    // Now try to login
    await act(async () => {
      await result.current.login("john@example.com", "password123");
    });

    expect(result.current.user).toEqual({
      id: expect.any(String),
      name: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      businessName: "John's Business",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("should fail login with incorrect credentials", async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login("wrong@email.com", "wrongpassword");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe("Invalid email or password");
  });

  it("should logout user", async () => {
    const { result } = renderHook(() => useAuth());

    // First register and login
    await act(async () => {
      await result.current.register(
        "john@example.com",
        "password123",
        "+1234567890",
        "John Doe",
        "John's Business"
      );
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Now logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    // The persist middleware should clear the auth storage
    expect(storageMock["@klyntl_auth"]).toBeUndefined();
  });

  it("should clear error on successful operation", async () => {
    const { result } = renderHook(() => useAuth());

    // First cause an error
    await act(async () => {
      await result.current.login("wrong@email.com", "wrongpassword");
    });

    expect(result.current.error).toBe("Invalid email or password");

    // Now perform successful operation
    await act(async () => {
      await result.current.register(
        "john@example.com",
        "password123",
        "+1234567890",
        "John Doe",
        "John's Business"
      );
    });

    expect(result.current.error).toBeNull();
  });
});

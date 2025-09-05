import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { useAuthStore } from "../authStore";

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
    // Clear storage mock between tests
    Object.keys(storageMock).forEach((key) => delete storageMock[key]);
  });

  it("should initialize with no user", async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should register a new user", async () => {
    const { result } = renderHook(() => useAuthStore());

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

  it.skip("should login with correct credentials", async () => {
    const { result } = renderHook(() => useAuthStore());

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

    // Check that user was stored
    expect(storageMock["@klyntl_users"]).toBeDefined();
    const users = JSON.parse(storageMock["@klyntl_users"]);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("john@example.com");

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

  it.skip("should fail login with incorrect credentials", async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login("wrong@email.com", "wrongpassword");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe("Invalid email or password");
  });

  it("should logout user", async () => {
    const { result } = renderHook(() => useAuthStore());

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
    // The persist middleware stores the state, so we check that the user is null
    const storedAuth = storageMock["@klyntl_auth"];
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      expect(parsed.state.user).toBeNull();
      expect(parsed.state.isAuthenticated).toBe(false);
    }
  });
});

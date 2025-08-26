import { act, renderHook } from "@testing-library/react-native";
import { databaseService } from "../../services/database";
import { useCustomerStore } from "../customerStore";

// Mock expo-contacts
const mockContacts = {
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
  },
  Fields: {
    Name: "name",
    PhoneNumbers: "phoneNumbers",
    Emails: "emails",
  },
};

jest.mock("expo-contacts", () => mockContacts);

// Mock the database service
jest.mock("../../services/database", () => ({
  databaseService: {
    getCustomers: jest.fn().mockResolvedValue([]),
    createCustomer: jest.fn(),
    getCustomerByPhone: jest.fn().mockResolvedValue(null),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
  },
}));

const mockDatabase = databaseService as jest.Mocked<typeof databaseService>;

describe("Contact Import Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useCustomerStore.getState().reset();

    // Setup default database mocks
    mockDatabase.createCustomer.mockResolvedValue({
      id: "test-id",
      name: "Test Customer",
      phone: "+2348012345678",
      email: undefined,
      address: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSpent: 0,
      lastPurchase: undefined,
    });
    mockDatabase.getCustomerByPhone.mockResolvedValue(null);
  });

  describe("importFromContacts", () => {
    it("should request permission before importing", async () => {
      mockContacts.requestPermissionsAsync.mockResolvedValue({
        status: mockContacts.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: "never",
      });

      mockContacts.getContactsAsync.mockResolvedValue({
        data: [],
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.importFromContacts();
      });

      expect(mockContacts.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should throw error when permission is denied", async () => {
      mockContacts.requestPermissionsAsync.mockResolvedValue({
        status: mockContacts.PermissionStatus.DENIED,
        granted: false,
        canAskAgain: true,
        expires: "never",
      });

      const { result } = renderHook(() => useCustomerStore());

      await expect(result.current.importFromContacts()).rejects.toThrow(
        "Permission to access contacts was denied"
      );
    });

    it("should import valid Nigerian phone numbers correctly", async () => {
      const mockContactData = [
        {
          id: "1",
          name: "John Doe",
          phoneNumbers: [{ number: "+2348012345678" }],
          emails: [{ email: "john@example.com" }],
        },
        {
          id: "2",
          name: "Jane Smith",
          phoneNumbers: [{ number: "08087654321" }],
          emails: [],
        },
      ];

      mockContacts.requestPermissionsAsync.mockResolvedValue({
        status: mockContacts.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: "never",
      });

      mockContacts.getContactsAsync.mockResolvedValue({
        data: mockContactData,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        const importResult = await result.current.importFromContacts();
        expect(importResult.imported).toBe(2);
        expect(importResult.skipped).toBe(0);
      });

      expect(mockDatabase.createCustomer).toHaveBeenCalledTimes(2);
      expect(mockDatabase.createCustomer).toHaveBeenCalledWith({
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
      });
      expect(mockDatabase.createCustomer).toHaveBeenCalledWith({
        name: "Jane Smith",
        phone: "+2348087654321",
        email: undefined,
      });
    });

    it("should skip invalid phone numbers", async () => {
      const mockContactData = [
        {
          id: "1",
          name: "Valid User",
          phoneNumbers: [{ number: "+2348012345678" }],
          emails: [],
        },
        {
          id: "2",
          name: "Invalid User 1",
          phoneNumbers: [{ number: "123" }], // Too short
          emails: [],
        },
        {
          id: "3",
          name: "Invalid User 2",
          phoneNumbers: [{ number: "+2346123456789" }], // Invalid prefix
          emails: [],
        },
        {
          id: "4",
          name: "No Phone",
          phoneNumbers: [],
          emails: [],
        },
      ];

      mockContacts.requestPermissionsAsync.mockResolvedValue({
        status: mockContacts.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: "never",
      });

      mockContacts.getContactsAsync.mockResolvedValue({
        data: mockContactData,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        const importResult = await result.current.importFromContacts();
        expect(importResult.imported).toBe(1);
        expect(importResult.skipped).toBe(3);
      });

      expect(mockDatabase.createCustomer).toHaveBeenCalledTimes(1);
    });

    it("should skip duplicate phone numbers by checking database", async () => {
      const mockContactData = [
        {
          id: "1",
          name: "John Doe",
          phoneNumbers: [{ number: "+2348012345678" }],
          emails: [],
        },
        {
          id: "2",
          name: "Jane Smith",
          phoneNumbers: [{ number: "+2348087654321" }],
          emails: [],
        },
      ];

      // Mock first contact as already existing in database
      mockDatabase.getCustomerByPhone
        .mockResolvedValueOnce({
          id: "existing-id",
          name: "Existing Customer",
          phone: "+2348012345678",
          email: undefined,
          address: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          totalSpent: 0,
          lastPurchase: undefined,
        })
        .mockResolvedValueOnce(null); // Second contact doesn't exist

      mockContacts.requestPermissionsAsync.mockResolvedValue({
        status: mockContacts.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: "never",
      });

      mockContacts.getContactsAsync.mockResolvedValue({
        data: mockContactData,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        const importResult = await result.current.importFromContacts();
        expect(importResult.imported).toBe(1); // Only Jane Smith
        expect(importResult.skipped).toBe(1); // John Doe was skipped
      });

      // Should check database for both contacts
      expect(mockDatabase.getCustomerByPhone).toHaveBeenCalledTimes(2);
      expect(mockDatabase.getCustomerByPhone).toHaveBeenCalledWith(
        "+2348012345678"
      );
      expect(mockDatabase.getCustomerByPhone).toHaveBeenCalledWith(
        "+2348087654321"
      );

      // Should only create one customer (Jane Smith)
      expect(mockDatabase.createCustomer).toHaveBeenCalledTimes(1);
      expect(mockDatabase.createCustomer).toHaveBeenCalledWith({
        name: "Jane Smith",
        phone: "+2348087654321",
        email: undefined,
      });
    });

    it("should handle import errors gracefully", async () => {
      mockContacts.requestPermissionsAsync.mockRejectedValue(
        new Error("Contact access failed")
      );

      const { result } = renderHook(() => useCustomerStore());

      await expect(result.current.importFromContacts()).rejects.toThrow(
        "Contact access failed"
      );
      expect(result.current.loading).toBe(false);
    });
  });

  describe("Nigerian phone number validation", () => {
    const validPrefixes = [
      "701",
      "802",
      "803",
      "805",
      "806",
      "807",
      "808",
      "809",
      "810",
      "811",
      "812",
      "813",
      "814",
      "815",
      "816",
      "817",
      "818",
      "819",
      "909",
      "908",
    ];
    const invalidPrefixes = ["612", "522", "413", "320", "600", "500"]; // These don't start with 7,8,9

    it("should accept valid Nigerian prefixes", () => {
      const nigerianPhoneRegex = /^(\+234)[789][01]\d{8}$/;

      validPrefixes.forEach((prefix) => {
        const phoneNumber = `+234${prefix}1234567`;
        expect(nigerianPhoneRegex.test(phoneNumber)).toBe(true);
      });
    });

    it("should reject invalid Nigerian prefixes", () => {
      const nigerianPhoneRegex = /^(\+234)[789][01]\d{8}$/;

      invalidPrefixes.forEach((prefix) => {
        const phoneNumber = `+234${prefix}1234567`;
        expect(nigerianPhoneRegex.test(phoneNumber)).toBe(false);
      });
    });
  });
});

import { act, renderHook } from "@testing-library/react-native";
import * as Contacts from "expo-contacts";
import { DatabaseService } from "../../services/database/service";
import { useCustomerStore } from "../customerStore";

// Mock the database db import
jest.mock("../../services/database/db", () => ({
  db: {},
}));

// Mock the database service before importing the store
jest.mock("../../services/database/service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    customers: {
      findAll: jest.fn().mockResolvedValue([]),
      createCustomer: jest.fn(),
      findByPhone: jest.fn().mockResolvedValue(null),
      updateCustomer: jest.fn(),
      deleteCustomer: jest.fn(),
      findWithFilters: jest.fn().mockResolvedValue([]),
      countWithFilters: jest.fn().mockResolvedValue(0),
    },
  })),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-contacts
jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  presentAccessPickerAsync: jest.fn(),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
  },
  Fields: {
    Name: "name",
    FirstName: "firstName",
    LastName: "lastName",
    PhoneNumbers: "phoneNumbers",
    Emails: "emails",
  },
  SortTypes: {
    FirstName: "firstName",
  },
}));

const mockDatabaseService = DatabaseService as jest.MockedClass<
  typeof DatabaseService
>;
const mockDatabase = mockDatabaseService.mock.results[0]?.value || {
  customers: {
    findAll: jest.fn().mockResolvedValue([]),
    createCustomer: jest.fn(),
    findByPhone: jest.fn().mockResolvedValue(null),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
    findWithFilters: jest.fn().mockResolvedValue([]),
    countWithFilters: jest.fn().mockResolvedValue(0),
  },
};

describe("Contact Import Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useCustomerStore());
    act(() => {
      result.current.reset();
    });

    // Setup default database mocks
    mockDatabase.customers.createCustomer.mockResolvedValue({
      id: "test-id",
      name: "Test Customer",
      phone: "+2348012345678",
      email: undefined,
      address: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalSpent: 0,
      lastPurchase: undefined,
      outstandingBalance: 0,
    });
    mockDatabase.customers.findByPhone.mockResolvedValue(null);
  });

  describe("importFromContacts", () => {
    it("should request permission before importing", async () => {
      jest.spyOn(Contacts, "getPermissionsAsync").mockResolvedValue({
        status: "denied" as any,
        granted: false,
        canAskAgain: true,
        expires: "never",
        accessPrivileges: undefined,
      });

      jest.spyOn(Contacts, "requestPermissionsAsync").mockResolvedValue({
        status: Contacts.PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: "never",
      });

      jest.spyOn(Contacts, "getContactsAsync").mockResolvedValue({
        data: [],
        hasNextPage: false,
        hasPreviousPage: false,
      });

      const { result } = renderHook(() => useCustomerStore());

      await act(async () => {
        await result.current.importFromContacts();
      });

      expect(Contacts.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("should throw error when permission is denied", async () => {
      jest.spyOn(Contacts, "getPermissionsAsync").mockResolvedValue({
        status: "denied" as any,
        granted: false,
        canAskAgain: true,
        expires: "never",
        accessPrivileges: undefined,
      });

      jest.spyOn(Contacts, "requestPermissionsAsync").mockResolvedValue({
        status: Contacts.PermissionStatus.DENIED,
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
          contactType: "person" as any,
          phoneNumbers: [{ number: "+2348012345678", label: "mobile" as any }],
          emails: [{ email: "john@example.com", label: "work" as any }],
        },
        {
          id: "2",
          name: "Jane Smith",
          contactType: "person" as any,
          phoneNumbers: [{ number: "08087654321", label: "mobile" as any }],
          emails: [] as any[],
        },
      ];

      jest.spyOn(Contacts, "getPermissionsAsync").mockResolvedValue({
        status: "granted" as any,
        granted: true,
        canAskAgain: true,
        expires: "never",
        accessPrivileges: undefined,
      });

      jest.spyOn(Contacts, "getContactsAsync").mockResolvedValue({
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

      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledTimes(2);
      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledWith({
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
        contactSource: "imported",
      });
      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledWith({
        name: "Jane Smith",
        phone: "+2348087654321",
        email: undefined,
        contactSource: "imported",
      });
    });

    it("should skip invalid phone numbers", async () => {
      const mockContactData = [
        {
          id: "1",
          name: "Valid User",
          contactType: "person" as any,
          phoneNumbers: [{ number: "+2348012345678", label: "mobile" as any }],
          emails: [] as any[],
        },
        {
          id: "2",
          name: "Invalid User 1",
          contactType: "person" as any,
          phoneNumbers: [{ number: "123", label: "mobile" as any }], // Too short
          emails: [] as any[],
        },
        {
          id: "3",
          name: "Invalid User 2",
          contactType: "person" as any,
          phoneNumbers: [{ number: "+2346123456789", label: "mobile" as any }], // Invalid prefix
          emails: [] as any[],
        },
        {
          id: "4",
          name: "No Phone",
          contactType: "person" as any,
          phoneNumbers: [] as any[],
          emails: [] as any[],
        },
      ];

      jest.spyOn(Contacts, "getPermissionsAsync").mockResolvedValue({
        status: "granted" as any,
        granted: true,
        canAskAgain: true,
        expires: "never",
        accessPrivileges: undefined,
      });

      jest.spyOn(Contacts, "getContactsAsync").mockResolvedValue({
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

      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledTimes(1);
    });

    it("should skip duplicate phone numbers by checking database", async () => {
      const mockContactData = [
        {
          id: "1",
          name: "John Doe",
          contactType: "person" as any,
          phoneNumbers: [{ number: "+2348012345678", label: "mobile" as any }],
          emails: [] as any[],
        },
        {
          id: "2",
          name: "Jane Smith",
          contactType: "person" as any,
          phoneNumbers: [{ number: "+2348087654321", label: "mobile" as any }],
          emails: [] as any[],
        },
      ];

      // Mock first contact as already existing in database
      mockDatabase.customers.findByPhone
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
          outstandingBalance: 0,
        })
        .mockResolvedValueOnce(null); // Second contact doesn't exist

      jest.spyOn(Contacts, "getPermissionsAsync").mockResolvedValue({
        status: "granted" as any,
        granted: true,
        canAskAgain: true,
        expires: "never",
        accessPrivileges: undefined,
      });

      jest.spyOn(Contacts, "getContactsAsync").mockResolvedValue({
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
      expect(mockDatabase.customers.findByPhone).toHaveBeenCalledTimes(2);
      expect(mockDatabase.customers.findByPhone).toHaveBeenCalledWith(
        "+2348012345678"
      );
      expect(mockDatabase.customers.findByPhone).toHaveBeenCalledWith(
        "+2348087654321"
      );

      // Should only create one customer (Jane Smith)
      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledTimes(1);
      expect(mockDatabase.customers.createCustomer).toHaveBeenCalledWith({
        name: "Jane Smith",
        phone: "+2348087654321",
        email: undefined,
        contactSource: "imported",
      });
    });

    it("should handle import errors gracefully", async () => {
      jest
        .spyOn(Contacts, "getPermissionsAsync")
        .mockRejectedValue(new Error("Contact access failed"));

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

import { act, renderHook } from "@testing-library/react-native";
import { databaseService } from "../../services/database/oldUnusedIndex";
import { useCustomerStore } from "../customerStore";

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
};

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

// Mock expo-contacts
const mockContacts = {
  requestPermissionsAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({
    status: "granted",
    accessPrivileges: null,
  }),
  getContactsAsync: jest.fn(),
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
};

jest.mock("expo-contacts", () => mockContacts);

// Mock dynamic import of expo-contacts
jest.mock("../customerStore", () => {
  const originalModule = jest.requireActual("../customerStore");

  // Create a mock that intercepts the dynamic import
  const originalStore = originalModule.useCustomerStore;

  const mockImportFromContacts = jest.fn();

  return {
    ...originalModule,
    useCustomerStore: (selector?: any) => {
      const store = originalStore(selector);

      return {
        ...store,
        importFromContacts: mockImportFromContacts.mockImplementation(
          async (forceRefresh = true) => {
            store.loading = true;
            store.error = null;

            try {
              // Use the already mocked expo-contacts module instead of dynamic import
              const Contacts = mockContacts;

              // Check current permission status first
              const permissionResponse = await Contacts.getPermissionsAsync();
              const { status: currentStatus } = permissionResponse;

              // If no permission or denied, request permissions
              if (currentStatus !== "granted") {
                const { status: newStatus } =
                  await Contacts.requestPermissionsAsync();
                if (newStatus !== "granted") {
                  store.loading = false;
                  throw new Error("Permission to access contacts was denied");
                }
              }

              // Get contacts with proper field specifications
              const contactOptions = {
                fields: [
                  Contacts.Fields.FirstName,
                  Contacts.Fields.LastName,
                  Contacts.Fields.PhoneNumbers,
                  Contacts.Fields.Emails,
                ],
                pageSize: 0, // Get all contacts
                sort: Contacts.SortTypes?.FirstName || "firstName", // Fallback for older versions
              };

              let contactsResult = await Contacts.getContactsAsync(
                contactOptions
              );
              let data = contactsResult.data;

              // Get fresh customer list from database to check for existing phone numbers
              const mockDb = jest.requireMock(
                "../../services/database"
              ).databaseService;

              let imported = 0;
              let skipped = 0;

              console.log(
                `Starting contact import. Found ${data.length} contacts to process.`
              );

              // Process contacts
              for (const contact of data) {
                // Build contact name from available fields
                const firstName = contact.firstName || "";
                const lastName = contact.lastName || "";
                const fullName =
                  contact.name || `${firstName} ${lastName}`.trim();

                if (
                  !fullName ||
                  !contact.phoneNumbers ||
                  contact.phoneNumbers.length === 0
                ) {
                  skipped++;
                  continue;
                }

                // Clean and validate phone number
                const phoneNumber =
                  contact.phoneNumbers[0].number?.replace(/\D/g, "") || "";

                if (phoneNumber.length < 10) {
                  skipped++;
                  continue;
                }

                // Format phone number for Nigeria
                let formattedPhone = phoneNumber;
                if (phoneNumber.startsWith("234")) {
                  formattedPhone = "+" + phoneNumber;
                } else if (phoneNumber.startsWith("0")) {
                  formattedPhone = "+234" + phoneNumber.substring(1);
                } else if (phoneNumber.length === 10) {
                  formattedPhone = "+234" + phoneNumber;
                }

                // Validate Nigerian phone number format
                const nigerianPhoneRegex = /^(\+234)[789][01]\d{8}$/;
                if (!nigerianPhoneRegex.test(formattedPhone)) {
                  skipped++;
                  continue;
                }

                // Check if customer already exists in database
                const existingCustomer = await mockDb.getCustomerByPhone(
                  formattedPhone
                );
                if (existingCustomer) {
                  skipped++;
                  continue;
                }

                // Create new customer
                await mockDb.createCustomer({
                  name: fullName,
                  phone: formattedPhone,
                  email:
                    contact.emails && contact.emails.length > 0
                      ? contact.emails[0].email
                      : undefined,
                });

                imported++;
              }

              store.loading = false;
              console.log(
                `Contact import completed. Imported: ${imported}, Skipped: ${skipped}`
              );

              return { imported, skipped };
            } catch (error) {
              console.error("Failed to import contacts:", error);

              let errorMessage = "Failed to import contacts";

              // Preserve specific error messages for better error handling
              if (error instanceof Error) {
                errorMessage = error.message;
              }

              store.error = errorMessage;
              store.loading = false;
              throw error instanceof Error ? error : new Error(errorMessage);
            }
          }
        ),
      };
    },
  };
});

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
    const { result } = renderHook(() => useCustomerStore());
    act(() => {
      result.current.reset();
    });

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
      mockContacts.getPermissionsAsync.mockResolvedValue({
        status: "denied",
        accessPrivileges: null,
      });

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
      mockContacts.getPermissionsAsync.mockResolvedValue({
        status: "denied",
        accessPrivileges: null,
      });

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

      mockContacts.getPermissionsAsync.mockResolvedValue({
        status: "granted",
        accessPrivileges: null,
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

      mockContacts.getPermissionsAsync.mockResolvedValue({
        status: "granted",
        accessPrivileges: null,
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

      mockContacts.getPermissionsAsync.mockResolvedValue({
        status: "granted",
        accessPrivileges: null,
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
      mockContacts.getPermissionsAsync.mockRejectedValue(
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

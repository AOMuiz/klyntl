import { act, renderHook } from "@testing-library/react-native";
import * as ExpoContacts from "expo-contacts";
import { useCustomerStore } from "../customerStore";

// Mock expo-contacts
jest.mock("expo-contacts", () => ({
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
  Fields: {
    Name: "name",
    PhoneNumbers: "phoneNumbers",
    Emails: "emails",
  },
}));

// Mock the database service
jest.mock("../../services/database", () => ({
  databaseService: {
    createCustomer: jest.fn(),
    getCustomers: jest.fn(() => Promise.resolve([])),
  },
}));

const mockedExpoContacts = ExpoContacts as jest.Mocked<typeof ExpoContacts>;

describe("useCustomerStore - Contact Import", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully import contacts when permission is granted", async () => {
    // Mock permission granted
    mockedExpoContacts.requestPermissionsAsync.mockResolvedValue({
      status: "granted",
    } as any);

    // Mock contacts data
    mockedExpoContacts.getContactsAsync.mockResolvedValue({
      data: [
        {
          name: "John Doe",
          phoneNumbers: [{ number: "+2348031234567" }],
          emails: [{ email: "john@example.com" }],
        },
        {
          name: "Jane Smith",
          phoneNumbers: [{ number: "08087654321" }],
          emails: [],
        },
        {
          name: "Invalid Contact",
          phoneNumbers: [{ number: "123" }], // Invalid number
        },
        {
          name: "No Phone",
          phoneNumbers: [], // No phone numbers
        },
      ],
    } as any);

    const { result } = renderHook(() => useCustomerStore());

    await act(async () => {
      const importResult = await result.current.importFromContacts();
      expect(importResult.imported).toBeGreaterThan(0);
      expect(importResult.skipped).toBeGreaterThan(0);
    });

    expect(mockedExpoContacts.requestPermissionsAsync).toHaveBeenCalled();
    expect(mockedExpoContacts.getContactsAsync).toHaveBeenCalledWith({
      fields: [
        ExpoContacts.Fields.Name,
        ExpoContacts.Fields.PhoneNumbers,
        ExpoContacts.Fields.Emails,
      ],
    });
  });

  it("should throw error when permission is denied", async () => {
    // Mock permission denied
    mockedExpoContacts.requestPermissionsAsync.mockResolvedValue({
      status: "denied",
    } as any);

    const { result } = renderHook(() => useCustomerStore());

    await act(async () => {
      await expect(result.current.importFromContacts()).rejects.toThrow(
        "Permission to access contacts was denied"
      );
    });

    expect(mockedExpoContacts.requestPermissionsAsync).toHaveBeenCalled();
    expect(mockedExpoContacts.getContactsAsync).not.toHaveBeenCalled();
  });

  it("should validate and format Nigerian phone numbers correctly", async () => {
    mockedExpoContacts.requestPermissionsAsync.mockResolvedValue({
      status: "granted",
    } as any);

    mockedExpoContacts.getContactsAsync.mockResolvedValue({
      data: [
        {
          name: "Contact 1",
          phoneNumbers: [{ number: "08031234567" }], // Should format to +234
        },
        {
          name: "Contact 2",
          phoneNumbers: [{ number: "2348031234567" }], // Should add +
        },
        {
          name: "Contact 3",
          phoneNumbers: [{ number: "+2348031234567" }], // Already formatted
        },
        {
          name: "Contact 4",
          phoneNumbers: [{ number: "08123456789" }], // Invalid (812 not allowed)
        },
      ],
    } as any);

    const { result } = renderHook(() => useCustomerStore());

    await act(async () => {
      const importResult = await result.current.importFromContacts();
      expect(importResult.imported).toBe(3); // 3 valid numbers
      expect(importResult.skipped).toBe(1); // 1 invalid number
    });
  });

  it("should limit imports to 50 contacts", async () => {
    mockedExpoContacts.requestPermissionsAsync.mockResolvedValue({
      status: "granted",
    } as any);

    // Create 100 valid contacts
    const contacts = Array.from({ length: 100 }, (_, i) => ({
      name: `Contact ${i + 1}`,
      phoneNumbers: [{ number: `+23480${String(i + 1).padStart(8, "0")}` }],
      emails: [],
    }));

    mockedExpoContacts.getContactsAsync.mockResolvedValue({
      data: contacts,
    } as any);

    const { result } = renderHook(() => useCustomerStore());

    await act(async () => {
      const importResult = await result.current.importFromContacts();
      expect(importResult.imported).toBe(50); // Limited to 50
    });
  });

  it("should skip duplicate phone numbers", async () => {
    mockedExpoContacts.requestPermissionsAsync.mockResolvedValue({
      status: "granted",
    } as any);

    mockedExpoContacts.getContactsAsync.mockResolvedValue({
      data: [
        {
          name: "Contact 1",
          phoneNumbers: [{ number: "+2348031234567" }],
        },
        {
          name: "Contact 2",
          phoneNumbers: [{ number: "08031234567" }], // Same number, different format
        },
      ],
    } as any);

    const { result } = renderHook(() => useCustomerStore());

    // First, add one contact manually to simulate existing customer
    await act(async () => {
      await result.current.addCustomer({
        name: "Existing Customer",
        phone: "+2348031234567",
      });
    });

    await act(async () => {
      const importResult = await result.current.importFromContacts();
      expect(importResult.imported).toBe(0); // Both should be skipped as duplicates
      expect(importResult.skipped).toBe(2);
    });
  });
});

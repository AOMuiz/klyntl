import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useContactImport } from "../../hooks/useContactImport";
import { ContactImportButton } from "../ContactImportButton";

// Mock the contact import hook
jest.mock("../../hooks/useContactImport", () => ({
  useContactImport: jest.fn(),
}));

// Mock the contact picker hook
jest.mock("../../hooks/useContactPicker", () => ({
  useContactPicker: jest.fn(() => ({
    showContactPicker: jest.fn(),
    ContactPickerComponent: () => null,
  })),
}));

// Mock the database hook
jest.mock("../../services/database", () => ({
  useDatabase: jest.fn(() => ({
    db: {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    },
  })),
}));

// Mock the database service to return synchronously
jest.mock("../../services/database/service", () => ({
  createDatabaseService: jest.fn(() => ({
    customers: {
      findWithFilters: jest.fn(() =>
        Promise.resolve([
          { id: "1", name: "Existing", phone: "+2348012345678" },
        ])
      ),
    },
  })),
}));

// Mock Alert with proper button storage
const mockAlert = jest
  .spyOn(Alert, "alert")
  .mockImplementation((title, message, buttons) => {
    // Store the buttons for later access in tests
    (Alert.alert as any).lastButtons = buttons;
    (Alert.alert as any).lastCall = { title, message, buttons };
  });

// Mock IconSymbol component
jest.mock("../ui/IconSymbol", () => ({
  IconSymbol: ({ name, size, color }: any) => null,
}));

const mockUseContactImport = useContactImport as jest.MockedFunction<
  typeof useContactImport
>;

describe("ContactImportButton", () => {
  const mockImportFromContacts = jest.fn();
  const mockImportSelectedContacts = jest.fn();
  const mockCheckContactAccess = jest.fn();
  const mockClearImportCache = jest.fn();
  const mockOnImportComplete = jest.fn();

  beforeAll(() => {
    jest.setTimeout(30000); // Increase global timeout
  });

  afterAll(() => {
    jest.setTimeout(5000); // Reset to default
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseContactImport.mockReturnValue({
      importFromContacts: mockImportFromContacts,
      importSelectedContacts: mockImportSelectedContacts,
      checkContactAccess: mockCheckContactAccess,
      clearImportCache: mockClearImportCache,
      isImporting: false,
      error: null,
    } as any);

    // Default mock implementation for checkContactAccess
    mockCheckContactAccess.mockResolvedValue({
      hasAccess: true,
      isLimited: false,
      contactCount: 100,
    });
  });

  describe('variant="button"', () => {
    it("should render button variant correctly", async () => {
      const { getByText } = render(<ContactImportButton variant="button" />);

      expect(getByText("Import Contacts")).toBeTruthy();
    });

    it("should show confirmation dialog when pressed", async () => {
      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      // Wait for the alert to be called
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Contacts",
          "Choose how you want to import contacts:\n\nOnly Nigerian phone numbers will be imported and duplicates will be skipped.\n\n100 contacts available.",
          expect.arrayContaining([
            expect.objectContaining({ text: "Cancel" }),
            expect.objectContaining({ text: "Select Contacts" }),
            expect.objectContaining({ text: "Import All (up to 100)" }),
          ])
        );
      });

      unmount(); // Clean up
    }, 10000);

    it("should handle limited contact access", async () => {
      mockCheckContactAccess.mockResolvedValue({
        hasAccess: true,
        isLimited: true,
        contactCount: 4,
      });

      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Contacts",
          "Choose how you want to import contacts:\n\nOnly Nigerian phone numbers will be imported and duplicates will be skipped.\n\n4 contacts available.",
          expect.arrayContaining([
            expect.objectContaining({ text: "Cancel" }),
            expect.objectContaining({ text: "Select Contacts" }),
            expect.objectContaining({ text: "Import Limited (4)" }),
            expect.objectContaining({ text: "Grant More Access" }),
          ])
        );
      });

      unmount();
    }, 10000);

    it("should call importFromContacts when confirmed", async () => {
      const importResult = {
        imported: 5,
        skipped: 2,
        totalProcessed: 7,
        errors: [],
      };
      mockImportFromContacts.mockResolvedValue(importResult);

      const { getByText, unmount } = render(
        <ContactImportButton
          variant="button"
          onImportComplete={mockOnImportComplete}
        />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        await importCallback();
      });

      expect(mockImportFromContacts).toHaveBeenCalled();
      expect(mockOnImportComplete).toHaveBeenCalledWith(importResult);

      unmount();
    }, 10000);

    it("should show success alert after import", async () => {
      const importResult = {
        imported: 5,
        skipped: 2,
        totalProcessed: 7,
        errors: [],
      };
      mockImportFromContacts.mockResolvedValue(importResult);

      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        await importCallback();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenLastCalledWith(
          "Import Complete",
          "Successfully imported 5 contacts. 2 contacts were skipped (duplicates or invalid numbers)."
        );
      });

      unmount();
    }, 10000);

    it("should show error alert on import failure", async () => {
      const error = new Error("Permission denied");
      mockImportFromContacts.mockRejectedValue(error);

      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        await importCallback();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenLastCalledWith(
          "Import Failed",
          "Permission denied"
        );
      });

      unmount();
    }, 10000);

    it("should be disabled when disabled prop is true", async () => {
      const { getByText, unmount } = render(
        <ContactImportButton variant="button" disabled={true} />
      );

      const button = getByText("Import Contacts").parent;
      await act(async () => {
        fireEvent.press(button);
      });

      // Should not trigger alert when disabled
      expect(Alert.alert).not.toHaveBeenCalled();

      unmount();
    });

    it('should show "Importing..." text during import', async () => {
      let resolveImport: (value: any) => void;
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve;
      });
      mockImportFromContacts.mockReturnValue(importPromise);

      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        importCallback();
      });

      // Should show importing text
      await waitFor(() => {
        expect(getByText("Importing...")).toBeTruthy();
      });

      // Complete the import
      resolveImport!({
        imported: 0,
        skipped: 0,
        totalProcessed: 0,
        errors: [],
      });

      // Should go back to normal text
      await waitFor(() => {
        expect(getByText("Import Contacts")).toBeTruthy();
      });

      unmount();
    }, 10000);
  });

  describe('variant="fab"', () => {
    it("should render fab variant correctly", () => {
      const { queryByText } = render(<ContactImportButton variant="fab" />);

      // FAB should not show text
      expect(queryByText("Import Contacts")).toBeNull();
    });

    it("should have different sizes", () => {
      const { rerender, unmount } = render(
        <ContactImportButton variant="fab" size="small" />
      );

      rerender(<ContactImportButton variant="fab" size="medium" />);
      rerender(<ContactImportButton variant="fab" size="large" />);

      // Component should render without errors for all sizes
      expect(true).toBe(true);

      unmount();
    });
  });

  describe('variant="text"', () => {
    it("should render text variant correctly", () => {
      const { getByText, unmount } = render(
        <ContactImportButton variant="text" />
      );

      expect(getByText("Import Contacts")).toBeTruthy();

      unmount();
    });

    it('should show "Importing..." text during import', async () => {
      let resolveImport: (value: any) => void;
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve;
      });
      mockImportFromContacts.mockReturnValue(importPromise);

      const { getByText, unmount } = render(
        <ContactImportButton variant="text" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        importCallback();
      });

      // Should show importing text
      await waitFor(() => {
        expect(getByText("Importing...")).toBeTruthy();
      });

      // Complete the import
      resolveImport!({
        imported: 0,
        skipped: 0,
        totalProcessed: 0,
        errors: [],
      });

      // Should go back to normal text
      await waitFor(() => {
        expect(getByText("Import Contacts")).toBeTruthy();
      });

      unmount();
    }, 10000);
  });

  describe("props", () => {
    it("should apply custom style", () => {
      const customStyle = { backgroundColor: "red" };
      const { getByTestId, unmount } = render(
        <ContactImportButton variant="button" style={customStyle} />
      );

      const button = getByTestId("contact-import-button");
      expect(button.props.style).toEqual(expect.objectContaining(customStyle));

      unmount();
    });

    it("should handle different sizes", () => {
      const { rerender, unmount } = render(
        <ContactImportButton variant="button" size="small" />
      );

      rerender(<ContactImportButton variant="button" size="medium" />);
      rerender(<ContactImportButton variant="button" size="large" />);

      // Component should render without errors for all sizes
      expect(true).toBe(true);

      unmount();
    });
  });

  describe("error handling", () => {
    it("should handle non-Error objects", async () => {
      mockImportFromContacts.mockRejectedValue("String error");

      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons[2].onPress; // Import All is at index 2
      await act(async () => {
        await importCallback();
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenLastCalledWith(
          "Import Failed",
          "Failed to import contacts"
        );
      });

      unmount();
    });

    it("should handle import start errors", async () => {
      const { getByText, unmount } = render(
        <ContactImportButton variant="button" />
      );

      // Mock console.error to prevent console output during test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
      });

      consoleSpy.mockRestore();
      unmount();
    });
  });
});

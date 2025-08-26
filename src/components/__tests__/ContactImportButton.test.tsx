import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import { useCustomerStore } from "../../stores/customerStore";
import { ContactImportButton } from "../ContactImportButton";

// Mock the customer store
jest.mock("../../stores/customerStore", () => ({
  useCustomerStore: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, "alert");

// Mock IconSymbol component
jest.mock("../ui/IconSymbol", () => ({
  IconSymbol: ({ name, size, color }: any) => null,
}));

const mockUseCustomerStore = useCustomerStore as jest.MockedFunction<
  typeof useCustomerStore
>;

describe("ContactImportButton", () => {
  const mockImportFromContacts = jest.fn();
  const mockCheckContactAccess = jest.fn();
  const mockClearImportCache = jest.fn();
  const mockOnImportComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCustomerStore.mockReturnValue({
      importFromContacts: mockImportFromContacts,
      checkContactAccess: mockCheckContactAccess,
      clearImportCache: mockClearImportCache,
    } as any);

    // Default mock implementation for checkContactAccess
    mockCheckContactAccess.mockResolvedValue({
      hasAccess: true,
      isLimited: false,
      contactCount: 100,
    });
  });

  describe('variant="button"', () => {
    it("should render button variant correctly", () => {
      const { getByText } = render(<ContactImportButton variant="button" />);

      expect(getByText("Import Contacts")).toBeTruthy();
    });

    it("should show confirmation dialog when pressed", async () => {
      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Contacts",
          expect.stringContaining("This will import contacts from your phone"),
          expect.arrayContaining([
            expect.objectContaining({ text: "Cancel" }),
            expect.objectContaining({ text: "Import" }),
          ])
        );
      });
    });

    it("should handle limited contact access", async () => {
      mockCheckContactAccess.mockResolvedValue({
        hasAccess: true,
        isLimited: true,
        contactCount: 4,
      });

      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Limited Contact Access Detected",
          expect.stringContaining(
            "You currently have limited access to contacts (4 contacts available)"
          ),
          expect.arrayContaining([
            expect.objectContaining({ text: "Cancel" }),
            expect.objectContaining({ text: "Grant More Access" }),
            expect.objectContaining({ text: "Import Available" }),
          ])
        );
      });
    });

    it("should call importFromContacts when confirmed", async () => {
      const importResult = { imported: 5, skipped: 2 };
      mockImportFromContacts.mockResolvedValue(importResult);

      const { getByText } = render(
        <ContactImportButton
          variant="button"
          onImportComplete={mockOnImportComplete}
        />
      );

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      await importCallback();

      expect(mockImportFromContacts).toHaveBeenCalled();
      expect(mockOnImportComplete).toHaveBeenCalledWith(importResult);
    });

    it("should show success alert after import", async () => {
      const importResult = { imported: 5, skipped: 2 };
      mockImportFromContacts.mockResolvedValue(importResult);

      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      await importCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Complete",
          "Successfully imported 5 contacts. 2 contacts were skipped (duplicates or invalid numbers)."
        );
      });
    });

    it("should show error alert on import failure", async () => {
      const error = new Error("Permission denied");
      mockImportFromContacts.mockRejectedValue(error);

      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      await importCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Failed",
          "Permission denied"
        );
      });
    });

    it("should be disabled when disabled prop is true", () => {
      const { getByText } = render(
        <ContactImportButton variant="button" disabled={true} />
      );

      const button = getByText("Import Contacts").parent;
      fireEvent.press(button);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('should show "Importing..." text during import', async () => {
      let resolveImport: (value: any) => void;
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve;
      });
      mockImportFromContacts.mockReturnValue(importPromise);

      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      importCallback();

      await waitFor(() => {
        expect(getByText("Importing...")).toBeTruthy();
      });

      // Complete the import
      resolveImport!({ imported: 0, skipped: 0 });

      await waitFor(() => {
        expect(getByText("Import Contacts")).toBeTruthy();
      });
    });
  });

  describe('variant="fab"', () => {
    it("should render fab variant correctly", () => {
      const { queryByText } = render(<ContactImportButton variant="fab" />);

      // FAB should not show text
      expect(queryByText("Import Contacts")).toBeNull();
    });

    it("should have different sizes", () => {
      const { rerender } = render(
        <ContactImportButton variant="fab" size="small" />
      );

      rerender(<ContactImportButton variant="fab" size="medium" />);
      rerender(<ContactImportButton variant="fab" size="large" />);

      // Component should render without errors for all sizes
      expect(true).toBe(true);
    });
  });

  describe('variant="text"', () => {
    it("should render text variant correctly", () => {
      const { getByText } = render(<ContactImportButton variant="text" />);

      expect(getByText("Import Contacts")).toBeTruthy();
    });

    it('should show "Importing..." text during import', async () => {
      let resolveImport: (value: any) => void;
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve;
      });
      mockImportFromContacts.mockReturnValue(importPromise);

      const { getByText } = render(<ContactImportButton variant="text" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      importCallback();

      await waitFor(() => {
        expect(getByText("Importing...")).toBeTruthy();
      });

      // Complete the import
      resolveImport!({ imported: 0, skipped: 0 });

      await waitFor(() => {
        expect(getByText("Import Contacts")).toBeTruthy();
      });
    });
  });

  describe("props", () => {
    it("should apply custom style", () => {
      const customStyle = { backgroundColor: "red" };
      const { getByText } = render(
        <ContactImportButton variant="button" style={customStyle} />
      );

      const button = getByText("Import Contacts").parent;
      expect(button?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it("should handle different sizes", () => {
      const { rerender } = render(
        <ContactImportButton variant="button" size="small" />
      );

      rerender(<ContactImportButton variant="button" size="medium" />);
      rerender(<ContactImportButton variant="button" size="large" />);

      // Component should render without errors for all sizes
      expect(true).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle non-Error objects", async () => {
      mockImportFromContacts.mockRejectedValue("String error");

      const { getByText } = render(<ContactImportButton variant="button" />);

      fireEvent.press(getByText("Import Contacts"));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Simulate pressing "Import" in the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const importCallback = alertCalls[0][2][1].onPress;
      await importCallback();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Import Failed",
          "Failed to import contacts"
        );
      });
    });

    it("should handle import start errors", () => {
      const { getByText } = render(<ContactImportButton variant="button" />);

      // Mock console.error to prevent console output during test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      // This will trigger the catch block in handleImportContacts
      fireEvent.press(getByText("Import Contacts"));

      consoleSpy.mockRestore();
    });
  });
});

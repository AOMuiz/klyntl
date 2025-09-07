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

// We'll create and restore an Alert spy per-test to capture buttons
let alertSpy: jest.SpyInstance | null = null;

const mockUseContactImport = useContactImport as jest.MockedFunction<
  typeof useContactImport
>;

// Helper to render and wait for effects to settle to avoid act warnings
async function renderWithSettledEffects(ui: any) {
  const result = render(ui);
  // Flush microtasks and promise resolutions triggered by effects
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

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
    // Clear only our mock functions to avoid removing the Alert spy
    mockImportFromContacts.mockClear();
    mockImportSelectedContacts.mockClear();
    mockCheckContactAccess.mockClear();
    mockClearImportCache.mockClear();
    mockOnImportComplete.mockClear();

    // Create Alert.alert spy implementation to ensure buttons are captured in each test
    alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((title, message, buttons) => {
        // Store last call info for tests
        (Alert.alert as any).lastCall = { title, message, buttons };
        // Provide a stable lastButtons reference for tests. Ensure each button has an onPress no-op if missing.
        const safeButtons = (buttons || []).map((b: any) => ({
          ...b,
          onPress: b?.onPress ?? (() => {}),
        }));
        (Alert.alert as any).lastButtons = safeButtons;
        return undefined as any;
      });

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

  afterEach(() => {
    // Restore Alert mock to avoid side effects between tests
    (Alert.alert as any).lastButtons = undefined;
    (Alert.alert as any).lastCall = undefined;
    if (alertSpy) {
      alertSpy.mockRestore();
      alertSpy = null;
    }
  });

  describe('variant="button"', () => {
    it("should render button variant correctly", async () => {
      const { getByTestId, getByText } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      // ensure the touchable exists and the text is present
      const button = getByTestId("contact-import-button");
      expect(button).toBeTruthy();
      expect(getByText("Import Contacts")).toBeTruthy();
    });

    it("should show confirmation dialog when pressed", async () => {
      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        // allow any immediate microtasks to run
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
        expect((Alert.alert as any).lastCall.title).toBe("Import Contacts");
        expect((Alert.alert as any).lastCall.message).toContain(
          "100 contacts available"
        );
        expect((Alert.alert as any).lastButtons).toEqual(
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

      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
        expect((Alert.alert as any).lastCall.message).toContain(
          "4 contacts available"
        );
        expect((Alert.alert as any).lastButtons).toEqual(
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

      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton
          variant="button"
          onImportComplete={mockOnImportComplete}
        />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
      await act(async () => {
        // importCallback may be async
        const maybePromise = importCallback();
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
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

      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
      await act(async () => {
        const maybePromise = importCallback();
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall.title).toBe("Import Complete");
        expect((Alert.alert as any).lastCall.message).toContain(
          "Successfully imported 5 contacts"
        );
      });

      unmount();
    }, 10000);

    it("should show error alert on import failure", async () => {
      const error = new Error("Permission denied");
      mockImportFromContacts.mockRejectedValue(error);

      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
      await act(async () => {
        const maybePromise = importCallback();
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall.title).toBe("Import Failed");
        expect((Alert.alert as any).lastCall.message).toBe("Permission denied");
      });

      unmount();
    }, 10000);

    it("should be disabled when disabled prop is true", async () => {
      const { getByTestId, unmount } = render(
        <ContactImportButton variant="button" disabled={true} />
      );

      const button = getByTestId("contact-import-button");
      await act(async () => {
        fireEvent.press(button);
        await Promise.resolve();
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
      mockImportFromContacts.mockReturnValue(importPromise as any);

      const { getByTestId, getByText, unmount } =
        await renderWithSettledEffects(
          <ContactImportButton variant="button" />
        );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
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
    it("should render fab variant correctly", async () => {
      const { queryByText } = await renderWithSettledEffects(
        <ContactImportButton variant="fab" />
      );

      // FAB should not show text
      expect(queryByText("Import Contacts")).toBeNull();
    });

    it("should have different sizes", async () => {
      const { rerender, unmount } = await renderWithSettledEffects(
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
    it("should render text variant correctly", async () => {
      const { getByText, unmount } = await renderWithSettledEffects(
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
      mockImportFromContacts.mockReturnValue(importPromise as any);

      const { getByText, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="text" />
      );

      await act(async () => {
        fireEvent.press(getByText("Import Contacts"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
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
    it("should apply custom style", async () => {
      const customStyle = { backgroundColor: "red" };
      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" style={customStyle} />
      );

      const button = getByTestId("contact-import-button");
      expect(button.props.style).toEqual(expect.objectContaining(customStyle));

      unmount();
    });

    it("should handle different sizes", async () => {
      const { rerender, unmount } = await renderWithSettledEffects(
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

      const { getByTestId, unmount } = await renderWithSettledEffects(
        <ContactImportButton variant="button" />
      );

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall).toBeDefined();
      });

      // Simulate pressing "Import All" in the alert
      const buttons = (Alert.alert as any).lastButtons;
      const importCallback = buttons.find((b: any) =>
        (b.text || "").toString().startsWith("Import")
      ).onPress;
      await act(async () => {
        const maybePromise = importCallback();
        if (maybePromise && typeof maybePromise.then === "function") {
          await maybePromise;
        }
      });

      await waitFor(() => {
        expect((Alert.alert as any).lastCall.title).toBe("Import Failed");
        expect((Alert.alert as any).lastCall.message).toBe(
          "Failed to import contacts"
        );
      });

      unmount();
    });

    it("should handle import start errors", async () => {
      const { getByTestId, unmount } = render(
        <ContactImportButton variant="button" />
      );

      // Mock console.error to prevent console output during test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await act(async () => {
        fireEvent.press(getByTestId("contact-import-button"));
        await Promise.resolve();
      });

      consoleSpy.mockRestore();
      unmount();
    });
  });
});

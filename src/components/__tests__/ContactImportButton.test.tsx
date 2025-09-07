import { render } from "@testing-library/react-native";
import { ContactImportButton } from "../ContactImportButton";

// Mock the contact import hook
jest.mock("../../hooks/useContactImport", () => ({
  useContactImport: jest.fn(() => ({
    importFromContacts: jest.fn(),
    importSelectedContacts: jest.fn(),
    checkContactAccess: jest.fn(),
    clearImportCache: jest.fn(),
    isImporting: false,
    error: null,
  })),
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

// Mock the database service
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

describe("ContactImportButton", () => {
  it("should render button variant correctly", () => {
    const { getByTestId, getByText } = render(
      <ContactImportButton variant="button" />
    );

    expect(getByTestId("contact-import-button")).toBeTruthy();
    expect(getByText("Import Contacts")).toBeTruthy();
  });

  it("should render fab variant correctly", () => {
    const { queryByText } = render(<ContactImportButton variant="fab" />);

    // FAB should not show text
    expect(queryByText("Import Contacts")).toBeNull();
  });

  it("should render text variant correctly", () => {
    const { getByText } = render(<ContactImportButton variant="text" />);

    expect(getByText("Import Contacts")).toBeTruthy();
  });

  it("should be disabled when disabled prop is true", () => {
    const { getByTestId } = render(
      <ContactImportButton variant="button" disabled={true} />
    );

    const button = getByTestId("contact-import-button");
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });
});

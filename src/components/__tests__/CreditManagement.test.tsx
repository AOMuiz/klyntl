import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { CreditManagement } from "../CreditManagement";

// Mock the database service
jest.mock("@/services/database", () => ({
  useDatabase: () => ({
    db: {},
  }),
  createDatabaseService: jest.fn(),
}));

// Mock the theme
jest.mock("@/constants/KlyntlTheme", () => ({
  useKlyntlColors: jest.fn(() => ({
    success: { 600: "#059669" },
    error: { 600: "#dc2626" },
    onSurfaceVariant: "#6b7280",
  })),
  ExtendedKlyntlTheme: {},
}));

// Mock currency utility
jest.mock("@/utils/currency", () => ({
  formatCurrency: jest.fn((amount) => `₦${amount.toLocaleString()}`),
}));

const mockCustomer = {
  id: "cust_1",
  name: "John Doe",
  phone: "+2348012345678",
  email: "john@example.com",
  totalSpent: 50000,
  outstandingBalance: 10000,
  creditBalance: 5000,
  lastPurchase: "2024-01-01T10:00:00Z",
  createdAt: "2024-01-01T09:00:00Z",
  updatedAt: "2024-01-15T14:30:00Z",
};

const mockCreditSummary = {
  currentBalance: 5000,
  totalEarned: 8000,
  totalUsed: 3000,
  lastActivity: "2024-01-15T14:30:00Z",
};

const mockCreditHistory = [
  {
    id: "audit_1",
    type: "over_payment",
    amount: 3000,
    created_at: "2024-01-10T10:00:00Z",
    metadata: { reason: "payment_excess" },
  },
  {
    id: "audit_2",
    type: "credit_applied_to_sale",
    amount: 2000,
    created_at: "2024-01-15T14:30:00Z",
    metadata: { reason: "credit_applied_to_purchase" },
  },
];

describe("CreditManagement", () => {
  const mockPaymentService = {
    getCreditBalance: jest.fn(),
    getCreditSummary: jest.fn(),
    getPaymentAuditHistory: jest.fn(),
  };

  const mockDatabaseService = {
    payment: mockPaymentService,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockPaymentService.getCreditBalance.mockResolvedValue(5000);
    mockPaymentService.getCreditSummary.mockResolvedValue(mockCreditSummary);
    mockPaymentService.getPaymentAuditHistory.mockResolvedValue(
      mockCreditHistory
    );

    // Mock createDatabaseService
    const mockCreateDbService = jest.fn().mockReturnValue(mockDatabaseService);
    require("@/services/database").createDatabaseService = mockCreateDbService;
  });

  it("should render loading state initially", () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    expect(getByText("Loading credit information...")).toBeTruthy();
  });

  it("should display customer credit information after loading", async () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("₦5,000")).toBeTruthy();
      expect(getByText("Available Credit")).toBeTruthy();
    });
  });

  it("should display credit summary correctly", async () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("Total Earned")).toBeTruthy();
      expect(getByText("₦8,000")).toBeTruthy();
      expect(getByText("Total Used")).toBeTruthy();
      expect(getByText("₦3,000")).toBeTruthy();
      expect(getByText("Last Activity")).toBeTruthy();
    });
  });

  it("should display credit history with correct formatting", async () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("Credit Earned")).toBeTruthy();
      expect(getByText("Applied to Purchase")).toBeTruthy();
      expect(getByText("+₦3,000")).toBeTruthy();
      expect(getByText("-₦2,000")).toBeTruthy();
    });
  });

  it("should show 'No credit activity yet' when history is empty", async () => {
    mockPaymentService.getPaymentAuditHistory.mockResolvedValue([]);

    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("No credit activity yet")).toBeTruthy();
    });
  });

  it("should call loadCreditData when refresh button is pressed", async () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("Refresh")).toBeTruthy();
    });

    const refreshButton = getByText("Refresh");
    fireEvent.press(refreshButton);

    // Verify that the service methods were called again
    await waitFor(() => {
      expect(mockPaymentService.getCreditBalance).toHaveBeenCalledTimes(2);
      expect(mockPaymentService.getCreditSummary).toHaveBeenCalledTimes(2);
      expect(mockPaymentService.getPaymentAuditHistory).toHaveBeenCalledTimes(
        2
      );
    });
  });

  it("should call onClose when close button is pressed", async () => {
    const mockOnClose = jest.fn();

    const { getByText } = render(
      <CreditManagement customer={mockCustomer} onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(getByText("Close")).toBeTruthy();
    });

    const closeButton = getByText("Close");
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should format dates correctly in history", async () => {
    const { getAllByText } = render(
      <CreditManagement customer={mockCustomer} />
    );

    await waitFor(() => {
      // Should show formatted dates with time - check that they exist
      const jan10Dates = getAllByText("Jan 10, 2024, 11:00 AM");
      const jan15Dates = getAllByText("Jan 15, 2024, 03:30 PM");

      expect(jan10Dates.length).toBeGreaterThan(0);
      expect(jan15Dates.length).toBeGreaterThan(0);
    });
  });

  it("should display different history item types with correct icons and colors", async () => {
    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      // Test different transaction types
      expect(getByText("Credit Earned")).toBeTruthy();
      expect(getByText("Applied to Purchase")).toBeTruthy();
    });
  });

  it("should handle zero credit balance", async () => {
    mockPaymentService.getCreditBalance.mockResolvedValue(0);
    mockPaymentService.getCreditSummary.mockResolvedValue({
      ...mockCreditSummary,
      currentBalance: 0,
    });

    const { getByText } = render(<CreditManagement customer={mockCustomer} />);

    await waitFor(() => {
      expect(getByText("₦0")).toBeTruthy();
    });
  });
});

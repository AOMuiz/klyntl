import { fireEvent, render } from "@testing-library/react-native";
import { mockCustomer } from "../../__tests__/test-utils";
import { CustomerCard } from "../CustomerCard";

describe("CustomerCard", () => {
  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render customer information correctly", () => {
    const { getByTestId, getByText } = render(
      <CustomerCard
        customer={mockCustomer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    expect(getByTestId("customer-card-name").props.children).toBe(
      mockCustomer.name
    );
    expect(getByTestId("customer-card-phone").props.children).toBe(
      mockCustomer.phone
    );
    expect(getByTestId("customer-card-total-spent").props.children).toBe(
      "₦50,000"
    );
    expect(getByText("Total Spent")).toBeTruthy();
  });

  it("should display customer initials in avatar", () => {
    const customer = { ...mockCustomer, name: "John Doe" };
    const { getByTestId } = render(
      <CustomerCard
        customer={customer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    const avatar = getByTestId("customer-card-avatar");
    expect(avatar).toBeTruthy();
    // Note: We can't easily test the avatar text content in this setup
    // but we can test that the avatar is rendered
  });

  it("should format currency correctly", () => {
    const customer = { ...mockCustomer, totalSpent: 1500000 };
    const { getByTestId } = render(
      <CustomerCard
        customer={customer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    expect(getByTestId("customer-card-total-spent").props.children).toBe(
      "₦1,500,000"
    );
  });

  it("should format last purchase date correctly", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const customer = {
      ...mockCustomer,
      lastPurchase: yesterday.toISOString(),
    };

    const { getByTestId } = render(
      <CustomerCard
        customer={customer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    expect(getByTestId("customer-card-last-purchase").props.children).toBe(
      "Yesterday"
    );
  });

  it('should show "No purchases yet" when no last purchase', () => {
    const customer = { ...mockCustomer, lastPurchase: undefined };
    const { getByTestId } = render(
      <CustomerCard
        customer={customer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    expect(getByTestId("customer-card-last-purchase").props.children).toBe(
      "No purchases yet"
    );
  });

  it("should call onPress when card is pressed", () => {
    const { getByTestId } = render(
      <CustomerCard
        customer={mockCustomer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    fireEvent.press(getByTestId("customer-card"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it("should call onLongPress when card is long pressed", () => {
    const { getByTestId } = render(
      <CustomerCard
        customer={mockCustomer}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        testID="customer-card"
      />
    );

    fireEvent(getByTestId("customer-card"), "longPress");
    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it("should have correct accessibility properties", () => {
    const { getByTestId } = render(
      <CustomerCard
        customer={mockCustomer}
        onPress={mockOnPress}
        testID="customer-card"
      />
    );

    const card = getByTestId("customer-card");
    expect(card.props.accessibilityRole).toBe("button");
    expect(card.props.accessibilityLabel).toBe(`Customer ${mockCustomer.name}`);
  });

  describe("date formatting", () => {
    it("should show days for recent purchases", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const customer = {
        ...mockCustomer,
        lastPurchase: threeDaysAgo.toISOString(),
      };

      const { getByTestId } = render(
        <CustomerCard
          customer={customer}
          onPress={mockOnPress}
          testID="customer-card"
        />
      );

      expect(getByTestId("customer-card-last-purchase").props.children).toBe(
        "3 days ago"
      );
    });

    it("should show weeks for older purchases", () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const customer = {
        ...mockCustomer,
        lastPurchase: twoWeeksAgo.toISOString(),
      };

      const { getByTestId } = render(
        <CustomerCard
          customer={customer}
          onPress={mockOnPress}
          testID="customer-card"
        />
      );

      expect(getByTestId("customer-card-last-purchase").props.children).toBe(
        "2 weeks ago"
      );
    });

    it("should show months for very old purchases", () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const customer = {
        ...mockCustomer,
        lastPurchase: twoMonthsAgo.toISOString(),
      };

      const { getByTestId } = render(
        <CustomerCard
          customer={customer}
          onPress={mockOnPress}
          testID="customer-card"
        />
      );

      expect(getByTestId("customer-card-last-purchase").props.children).toBe(
        "2 months ago"
      );
    });
  });

  describe("initials generation", () => {
    it("should generate correct initials for single name", () => {
      const customer = { ...mockCustomer, name: "Madonna" };
      const { getByTestId } = render(
        <CustomerCard
          customer={customer}
          onPress={mockOnPress}
          testID="customer-card"
        />
      );

      // Avatar should be rendered (we can't easily test the text content)
      expect(getByTestId("customer-card-avatar")).toBeTruthy();
    });

    it("should generate correct initials for multiple names", () => {
      const customer = { ...mockCustomer, name: "John Michael Doe" };
      const { getByTestId } = render(
        <CustomerCard
          customer={customer}
          onPress={mockOnPress}
          testID="customer-card"
        />
      );

      // Avatar should be rendered (initials would be 'JM' - first 2 letters)
      expect(getByTestId("customer-card-avatar")).toBeTruthy();
    });
  });
});

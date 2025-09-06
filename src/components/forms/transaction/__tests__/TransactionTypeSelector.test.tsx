import { fireEvent, render, screen } from "@testing-library/react-native";
import { TransactionTypeSelector } from "../TransactionTypeSelector";

const mockDescriptions = {
  sale: "Sale: The customer is making a purchase.",
  payment: "Payment: The customer is paying for a previous purchase or debt.",
  credit:
    "Credit: Issuing a loan or credit to the customer (no payment method required).",
  refund: "Refund: Money is being returned to the customer.",
};

describe("TransactionTypeSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders all transaction types", () => {
    render(
      <TransactionTypeSelector
        value="sale"
        onChange={mockOnChange}
        descriptions={mockDescriptions}
      />
    );

    expect(screen.getByText("Sale")).toBeTruthy();
    expect(screen.getByText("Payment")).toBeTruthy();
    expect(screen.getByText("Credit")).toBeTruthy();
    expect(screen.getByText("Refund")).toBeTruthy();
  });

  it("calls onChange when a transaction type is selected", () => {
    render(
      <TransactionTypeSelector
        value="sale"
        onChange={mockOnChange}
        descriptions={mockDescriptions}
      />
    );

    const paymentButton = screen.getByText("Payment");
    fireEvent.press(paymentButton);

    expect(mockOnChange).toHaveBeenCalledWith("payment");
  });

  it("displays the correct description for selected type", () => {
    render(
      <TransactionTypeSelector
        value="sale"
        onChange={mockOnChange}
        descriptions={mockDescriptions}
      />
    );

    expect(
      screen.getByText("Sale: The customer is making a purchase.")
    ).toBeTruthy();
  });
});

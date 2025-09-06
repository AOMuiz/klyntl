import { fireEvent, render, screen } from "@testing-library/react-native";
import { AmountInput } from "../AmountInput";

describe("AmountInput", () => {
  const mockOnChange = jest.fn();
  const mockOnQuickAmountSelect = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnQuickAmountSelect.mockClear();
  });

  it("renders amount input field", () => {
    render(
      <AmountInput
        value=""
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="sale"
      />
    );

    expect(screen.getByText("Amount *")).toBeTruthy();
    expect(screen.getByPlaceholderText("0.00")).toBeTruthy();
  });

  it("calls onChange when text is entered", () => {
    render(
      <AmountInput
        value=""
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="sale"
      />
    );

    const input = screen.getByPlaceholderText("0.00");
    fireEvent.changeText(input, "1000");

    expect(mockOnChange).toHaveBeenCalledWith("1000");
  });

  it("renders quick amount presets", () => {
    render(
      <AmountInput
        value=""
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="sale"
      />
    );

    expect(screen.getByText("₦500")).toBeTruthy();
    expect(screen.getByText("₦1,000")).toBeTruthy();
    expect(screen.getByText("₦2,000")).toBeTruthy();
  });

  it("calls onQuickAmountSelect when preset is pressed", () => {
    render(
      <AmountInput
        value=""
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="sale"
      />
    );

    const presetButton = screen.getByText("₦500");
    fireEvent.press(presetButton);

    expect(mockOnQuickAmountSelect).toHaveBeenCalledWith(500);
  });

  it("shows correct preview label for different transaction types", () => {
    const { rerender } = render(
      <AmountInput
        value="1000"
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="sale"
      />
    );

    expect(screen.getByText("Sale Amount")).toBeTruthy();

    rerender(
      <AmountInput
        value="1000"
        onChange={mockOnChange}
        onQuickAmountSelect={mockOnQuickAmountSelect}
        transactionType="payment"
      />
    );

    expect(screen.getByText("Payment Received")).toBeTruthy();
  });
});

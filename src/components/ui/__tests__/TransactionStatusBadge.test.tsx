import { render } from "@testing-library/react-native";
import TransactionStatusBadge from "../TransactionStatusBadge";

describe("TransactionStatusBadge", () => {
  it("renders credit sale badge for sale with credit payment method and remaining amount", () => {
    const { getByText } = render(
      <TransactionStatusBadge
        transaction={{
          type: "sale",
          paymentMethod: "credit",
          remainingAmount: 1000,
        }}
        amount={1000}
      />
    );

    // Component shows "Due: ₦1,000" for credit sales with remaining amount
    expect(getByText("Due: ₦1,000")).toBeTruthy();
  });

  it("renders paid in full for completed sales", () => {
    const { getByText } = render(
      <TransactionStatusBadge
        transaction={{
          type: "sale",
          paymentMethod: "cash",
          remainingAmount: 0,
        }}
        amount={1000}
      />
    );

    expect(getByText("Paid in Full")).toBeTruthy();
  });

  it("renders payment applied for payment transactions", () => {
    const { getByText } = render(
      <TransactionStatusBadge
        transaction={{
          type: "payment",
          appliedToDebt: true,
        }}
        amount={1000}
      />
    );

    expect(getByText("Payment Applied")).toBeTruthy();
  });
});

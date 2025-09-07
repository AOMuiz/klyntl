import { render } from "@testing-library/react-native";
import TransactionStatusBadge from "../TransactionStatusBadge";

describe("TransactionStatusBadge", () => {
  it("renders credit sale badge for sale with credit payment method", () => {
    const { getByText } = render(
      <TransactionStatusBadge
        transaction={{ type: "sale", paymentMethod: "credit" }}
        amount={1000}
      />
    );

    expect(getByText("Credit Sale")).toBeTruthy();
  });
});

import { render } from "@testing-library/react-native";
import DebtIndicator from "../DebtIndicator";

describe("DebtIndicator", () => {
  it("shows No Debt Impact when debtImpact is 0", () => {
    const { getByText } = render(
      <DebtIndicator
        transaction={{ type: "sale", amount: 1000 }}
        debtImpact={0}
      />
    );

    expect(getByText("No Debt Impact")).toBeTruthy();
  });
});

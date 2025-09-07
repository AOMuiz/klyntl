import { render } from "@testing-library/react-native";
import RunningDebtBalance from "../RunningDebtBalance";

describe("RunningDebtBalance", () => {
  it("renders zero balance as ₦0.00", () => {
    const { getByText } = render(<RunningDebtBalance balance={0} />);
    expect(getByText(/₦0/)).toBeTruthy();
  });

  it("renders positive balance with + sign", () => {
    const { getByText } = render(<RunningDebtBalance balance={5000} />);
    expect(getByText(/\+.*₦/)).toBeTruthy();
  });
});

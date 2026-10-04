import React from "react";
import { render, screen } from "@testing-library/react";
import { ReturnCostNotice } from "@/components/legal/ReturnCostNotice";

test("gives the customer costs, refund rights and a guest withdrawal entry before ordering", () => {
  render(<ReturnCostNotice />);
  expect(screen.getByText(/suporți costul direct/)).toBeVisible();
  expect(screen.getByText(/inclusiv costul livrării standard/)).toBeVisible();
  expect(screen.getByText(/fără costuri pentru tine/)).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Retrageți-vă din contract aici" })
  ).toHaveAttribute("href", "/withdrawal");
});
test("English checkout gives the same cost and delivery refund information", () => {
  render(<ReturnCostNotice language="en" />);
  expect(screen.getByText(/you pay the direct cost/)).toBeVisible();
  expect(screen.getByText(/initial standard delivery charge/)).toBeVisible();
});

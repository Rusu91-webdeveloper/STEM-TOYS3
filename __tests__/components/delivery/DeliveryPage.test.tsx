import React from "react";
import { render, screen } from "@testing-library/react";

import DeliveryPage from "@/app/delivery/page";

describe("DeliveryPage", () => {
  it("highlights the 7 working day delivery guarantee", () => {
    render(<DeliveryPage />);

    expect(
      screen.getByText(/Livrare garantată în maximum 7 zile lucrătoare/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Livrare premium în toată România/i)
    ).toBeInTheDocument();
  });

  it("covers edge regions such as rural deliveries with the 7 day promise", () => {
    render(<DeliveryPage />);

    expect(
      screen.getByText(/Planificare națională unitară/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/termenul maxim de 7 zile lucrătoare/i)
    ).toBeInTheDocument();
  });

  it("does not promise delivery times longer than 7 working days", () => {
    render(<DeliveryPage />);

    expect(screen.queryByText(/8 zile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/10 zile/i)).not.toBeInTheDocument();
  });
});



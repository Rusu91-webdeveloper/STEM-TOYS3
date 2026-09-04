import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import GiftIdeasEmailCapture from "@/app/cadouri-stem-6-8-ani/GiftIdeasEmailCapture";

describe("GiftIdeasEmailCapture", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses the existing newsletter endpoint and shows the locked confirmation", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true } as Response);

    render(<GiftIdeasEmailCapture />);
    fireEvent.change(screen.getByLabelText("Adresa de email"), {
      target: { value: "parinte@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Vreau ideile de cadou" })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/newsletter",
        expect.objectContaining({ method: "POST" })
      );
    });
    expect(
      await screen.findByText("Mulțumim — verifică inboxul.")
    ).toBeInTheDocument();
  });
});

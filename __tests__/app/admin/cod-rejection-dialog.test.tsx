import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CodRejectionDialog } from "@/app/admin/components/cod-rejection-dialog";

describe("COD refusal confirmation", () => {
  it("requires a reason and confirms the entered values before closing", async () => {
    const confirm = jest.fn().mockResolvedValue(true);
    const close = jest.fn();
    render(
      <CodRejectionDialog busy={false} onClose={close} onConfirm={confirm} />
    );
    expect(
      screen.getByRole("button", { name: "Confirmă refuzul" })
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motivul refuzului *"), {
      target: { value: "  Clientul a refuzat coletul  " },
    });
    fireEvent.change(screen.getByLabelText("Note suplimentare (opțional)"), {
      target: { value: "  Confirmat de curier  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmă refuzul" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(confirm).toHaveBeenCalledWith({
      reason: "Clientul a refuzat coletul",
      notes: "Confirmat de curier",
    });
  });

  it("retains a failed draft and prevents closing while saving", async () => {
    const confirm = jest.fn().mockResolvedValue(false);
    const close = jest.fn();
    const { rerender } = render(
      <CodRejectionDialog busy={false} onClose={close} onConfirm={confirm} />
    );
    fireEvent.change(screen.getByLabelText("Motivul refuzului *"), {
      target: { value: "Refuz confirmat" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmă refuzul" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Refuzul nu s-a înregistrat"
    );
    expect(screen.getByLabelText("Motivul refuzului *")).toHaveValue(
      "Refuz confirmat"
    );
    expect(close).not.toHaveBeenCalled();
    rerender(<CodRejectionDialog busy onClose={close} onConfirm={confirm} />);
    expect(screen.getByRole("button", { name: "Renunță" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).not.toHaveBeenCalled();
  });
});

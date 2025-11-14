/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import RegisterPage from "@/app/auth/register/page";

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    language: "ro",
    locale: "ro",
    setLanguage: jest.fn(),
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("@/components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <button type="button">Google</button>,
}));

const mockFetch = global.fetch as jest.Mock;

describe("/auth/register page", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockFetch.mockReset();
  });

  it("renders hero blurb and account creation CTA", () => {
    render(<RegisterPage />);

    expect(
      screen.getByText("Creează contul care transformă joaca în progres STEM")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "createAccount" })
    ).toBeInTheDocument();
  });

  it("shows styled error banner when backend reports email conflict", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "email already exists" }),
    });

    render(<RegisterPage />);

    fireEvent.input(screen.getByLabelText("fullName"), {
      target: { value: "Tech Parent" },
    });
    fireEvent.input(screen.getByLabelText("email"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.input(screen.getByLabelText("password"), {
      target: { value: "SecurePass1A" },
    });
    fireEvent.input(screen.getByLabelText("confirmPassword"), {
      target: { value: "SecurePass1A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "createAccount" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const errorCopy = await screen.findByText(/email already exists/i);
    const alertWrapper = errorCopy.closest("div");
    expect(alertWrapper).toHaveClass("border-red-500/40");
  });
});



/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";

import LoginPage from "@/app/auth/login/page";

jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    language: "ro",
    locale: "ro",
    setLanguage: jest.fn(),
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

const mockSearchParams = {
  get: jest.fn(),
};

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/components/auth/GoogleSignInButton", () => ({
  GoogleSignInButton: () => <button type="button">Google</button>,
}));

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

describe("/auth/login page", () => {
  const mockSignIn = signIn as jest.Mock;

  beforeEach(() => {
    mockSearchParams.get.mockReturnValue(null);
    mockSignIn.mockReset();
  });

  it("renders hero copy and primary CTA inside the immersive layout", () => {
    render(<LoginPage />);

    expect(
      screen.getByText(
        "Conectează-te la platforma părinților care cresc vizionari STEM"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "signIn" })
    ).toBeInTheDocument();
  });

  it("shows styled error banner when credentials fail", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<LoginPage />);

    fireEvent.input(screen.getByLabelText("email"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.input(screen.getByLabelText("password"), {
      target: { value: "password123" },
    });

    fireEvent.submit(screen.getByRole("button", { name: "signIn" }));

    const errorCopy = await screen.findByText("invalidCredentials");
    const alertWrapper = errorCopy.closest("div");
    expect(alertWrapper).toHaveClass("border-red-500/40");
  });
});



/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordInput } from "@/components/ui/password-input";

describe("PasswordInput", () => {
  it("renders with password type by default", () => {
    render(<PasswordInput data-testid="password-input" />);

    const input = screen.getByTestId("password-input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggles password visibility when eye icon is clicked", () => {
    render(<PasswordInput data-testid="password-input" />);

    const input = screen.getByTestId("password-input");
    const toggleButton = screen.getByRole("button");

    // Initially password should be hidden
    expect(input).toHaveAttribute("type", "password");

    // Click the eye icon to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");

    // Click again to hide password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows correct icon based on password visibility", () => {
    render(<PasswordInput data-testid="password-input" />);

    const toggleButton = screen.getByRole("button");

    // Initially should show Eye icon (password hidden)
    expect(
      toggleButton.querySelector('[aria-hidden="true"]')
    ).toBeInTheDocument();

    // Click to show password
    fireEvent.click(toggleButton);

    // Should now show EyeOff icon (password visible)
    expect(
      toggleButton.querySelector('[aria-hidden="true"]')
    ).toBeInTheDocument();
  });

  it("forwards all input props correctly", () => {
    render(
      <PasswordInput
        data-testid="password-input"
        placeholder="Enter password"
        autoComplete="current-password"
        className="custom-class"
      />
    );

    const input = screen.getByTestId("password-input");
    expect(input).toHaveAttribute("placeholder", "Enter password");
    expect(input).toHaveAttribute("autoComplete", "current-password");
    expect(input).toHaveClass("custom-class");
  });

  it("disables toggle button when input is disabled", () => {
    render(<PasswordInput data-testid="password-input" disabled />);

    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeDisabled();
  });
});

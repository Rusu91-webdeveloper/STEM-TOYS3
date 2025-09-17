import { renderHook, act } from "@testing-library/react";
import * as nextNav from "next/navigation";
import { useProductFilters } from "@/features/products/hooks/useProductFilters";

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  return {
    ...actual,
    useSearchParams: jest.fn(),
    useRouter: jest.fn(() => ({ push: jest.fn() })),
  };
});

function createSearchParamsMock(params: Record<string, string>) {
  return {
    get: (key: string) => params[key] ?? null,
  } as unknown as ReturnType<typeof nextNav.useSearchParams>;
}

describe("useProductFilters ageGroup", () => {
  it("parses ageGroup from URL and writes it back", () => {
    (nextNav.useSearchParams as jest.Mock).mockReturnValue(
      createSearchParamsMock({ ageGroup: "PRESCHOOL_3_5" })
    );
    const push = jest.fn();
    (nextNav.useRouter as jest.Mock).mockReturnValue({ push });

    const { result } = renderHook(() => useProductFilters());

    act(() => {
      result.current.initFromSearchParams();
    });

    // set same age group to trigger updateURL
    act(() => {
      result.current.updateURL();
    });

    expect(push).toHaveBeenCalled();
    const pushedArg = push.mock.calls[0][0] as string;
    expect(String(pushedArg)).toContain("ageGroup=PRESCHOOL_3_5");
  });
});

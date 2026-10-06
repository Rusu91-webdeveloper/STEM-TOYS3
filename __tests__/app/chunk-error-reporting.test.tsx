import { render, screen, waitFor } from "@testing-library/react";

import PageError from "@/app/error";

describe("persistent page chunk failure", () => {
  const previousFetch = global.fetch;
  let fetchMock: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    window.history.replaceState({}, "", "/checkout");
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    global.fetch = previousFetch;
    consoleSpy.mockRestore();
  });

  it("reports a failed retry while preserving the checkout error UI", () => {
    const error = Object.assign(new Error("Loading chunk 42 failed."), {
      name: "ChunkLoadError",
      chunkRetryCount: 1,
    });
    render(<PageError error={error} reset={jest.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Pagina nu s-a încărcat" })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/errors");
    expect(options).toMatchObject({ method: "POST", keepalive: true });
    expect(JSON.parse(options.body)).toMatchObject({
      message: error.message,
      level: "page",
      additional: { chunkRetryCount: 1 },
      url: expect.stringContaining("/checkout"),
    });
    expect(window.location.pathname).toBe("/checkout");
  });

  it("keeps the error page usable when reporting is unavailable", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(
      <PageError
        error={Object.assign(new Error("Loading chunk 42 failed."), {
          name: "ChunkLoadError",
        })}
        reset={jest.fn()}
      />
    );
    await waitFor(() =>
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: "offline" })
      )
    );
    expect(
      screen.getByRole("button", { name: "Reîncearcă" })
    ).toBeInTheDocument();
  });

  it("does not add chunk reports for ordinary application errors", () => {
    render(
      <PageError error={new Error("Application failure")} reset={jest.fn()} />
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

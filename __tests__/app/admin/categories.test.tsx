import { fireEvent, render, screen, within } from "@testing-library/react";

import CategoriesPage from "@/app/admin/categories/page";

const originalFetch = global.fetch;
const records = [
  {
    id: "actual-science-id",
    name: "Experimente",
    slug: "experimente",
    isActive: true,
    productCount: 12,
  },
  {
    id: "actual-robotics-id",
    name: "Robotică",
    slug: "robotica",
    isActive: false,
    productCount: 3,
  },
  {
    id: "actual-empty-id",
    name: "Categorie goală",
    slug: "goala",
    isActive: true,
    productCount: 0,
  },
];
const response = (data: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
});

describe("admin category data", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response(records));
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("loads the private admin source and displays real statuses and counts", async () => {
    render(<CategoriesPage />);
    await screen.findByRole("table");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/categories",
      expect.objectContaining({ cache: "no-store" })
    );
    for (const [name, status, count] of [
      ["Experimente", "Activă", "12"],
      ["Robotică", "Inactivă", "3"],
      ["Categorie goală", "Activă", "0"],
    ]) {
      const row = screen.getByText(name).closest("tr")!;
      expect(within(row).getByText(status)).toBeVisible();
      expect(within(row).getByText(count)).toBeVisible();
    }
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("shows a genuine empty result only after a successful read", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(response([]));
    render(<CategoriesPage />);
    expect(
      await screen.findByText("Nu există categorii în catalog.")
    ).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each(
    [
      [{ id: "science", name: "Science", slug: "science" }],
      [{ ...records[0], isActive: undefined }],
      [{ ...records[0], productCount: undefined }],
      [{ ...records[0], productCount: -1 }],
      [{ ...records[0], productCount: "12" }],
    ].map(data => ({ data }))
  )(
    "rejects incomplete/invalid category data without inventing zero/inactive: %j",
    async ({ data }) => {
      (global.fetch as jest.Mock).mockResolvedValue(response(data));
      render(<CategoriesPage />);
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Lista categoriilor nu a putut fi încărcată"
      );
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.queryByText("Nu există categorii în catalog.")).toBeNull();
    }
  );

  it("lets the owner retry an HTTP failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(response({}, false));
    render(<CategoriesPage />);
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Reîncearcă" }));
    expect(await screen.findByText("Experimente")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides stale rows when refreshing fails", async () => {
    render(<CategoriesPage />);
    await screen.findByText("Experimente");
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Offline"));
    fireEvent.click(
      screen.getByRole("button", { name: "Reîncarcă categoriile" })
    );
    await screen.findByRole("alert");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("Nu există categorii în catalog.")).toBeNull();
  });
});

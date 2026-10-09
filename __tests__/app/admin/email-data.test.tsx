import { fireEvent, render, screen, within } from "@testing-library/react";

import EmailAutomationPage from "@/app/admin/email-automation/page";
import { EmailTemplatePreview } from "@/components/ui/EmailTemplatePreview";

const originalFetch = global.fetch;
const dashboard = {
  counts: {
    templates: 28,
    sequences: 1,
    activeSequences: 1,
    campaigns: 1,
    activeCampaigns: 0,
    subscribers: 2,
    inactiveSubscribers: 1,
    triggers: 1,
    activeTriggers: 0,
    logs: 3,
    accepted: 1,
    failed: 1,
    unverified: 1,
  },
  metrics: {
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalBounced: 0,
    totalUnsubscribed: 0,
    totalDelivered: 0,
    openRate: null,
    clickRate: null,
    bounceRate: null,
    unsubscribeRate: null,
    deliveryRate: null,
  },
  recentLogs: [
    {
      id: "real-log",
      to: "recipient@example.test",
      subject: "Saved email subject",
      status: "accepted",
      sentAt: "2026-10-09T00:00:00Z",
      error: null,
      createdAt: "2026-10-09T00:00:00Z",
      template: { name: "Saved template" },
      verified: true,
    },
  ],
  recentExecutions: [],
};
const response = (data: unknown, ok = true) => ({
  ok,
  json: () => Promise.resolve(data),
});

describe("admin email source states", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(response(dashboard));
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows database totals separately from subscriber counts and real history", async () => {
    render(<EmailAutomationPage />);
    await screen.findByText("Saved email subject");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/email-dashboard",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(
      within(screen.getByText("Șabloane salvate").parentElement!).getByText(
        "28"
      )
    ).toBeVisible();
    expect(
      within(screen.getByText("Abonați activi").parentElement!).getByText("2")
    ).toBeVisible();
    expect(screen.getByText(/recipient@example.test/)).toBeVisible();
    expect(screen.queryByText("+5% from last month")).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent("fără confirmare");
  });

  it.each([
    {},
    { ...dashboard, counts: { ...dashboard.counts, subscribers: undefined } },
  ])(
    "rejects incomplete responses without showing invented zeros",
    async data => {
      (global.fetch as jest.Mock).mockResolvedValue(response(data));
      render(<EmailAutomationPage />);
      await screen.findByRole("alert");
      expect(screen.queryByText("Abonați activi")).toBeNull();
      expect(screen.queryByText("Saved email subject")).toBeNull();
    }
  );

  it("clears stale records after failed refresh and supports retry", async () => {
    render(<EmailAutomationPage />);
    await screen.findByText("Saved email subject");
    (global.fetch as jest.Mock).mockResolvedValueOnce(response({}, false));
    fireEvent.click(screen.getByRole("button", { name: "Reîncarcă datele" }));
    await screen.findByRole("alert");
    expect(screen.queryByText("Saved email subject")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reîncearcă" }));
    await screen.findByText("Saved email subject");
  });
});

it("previews saved HTML without fabricated recipients or variable values", () => {
  const { container } = render(
    <EmailTemplatePreview
      template={{
        id: "saved",
        name: "Saved template",
        category: "welcome",
        subject: "Hello {{user.name}}",
        content: "<p>Saved {{order.total}}</p>",
        variables: ["user.name"],
      }}
    />
  );
  expect(screen.getByText("Hello {{user.name}}")).toBeVisible();
  expect(screen.queryByText(/John Doe|ORD-2024|€89.99/)).toBeNull();
  const preview = container.querySelector("iframe")!;
  expect(preview).toHaveAttribute("srcdoc", "<p>Saved {{order.total}}</p>");
  expect(preview).toHaveAttribute("sandbox", "");
  expect(screen.getByText("{{order.total}}")).toBeVisible();
});

import {
  EmailProvider,
  EmailServiceOptions,
  UnifiedEmailRequest,
  UnifiedEmailResponse,
} from "@/lib/email/types";

function nowMs(): number {
  return typeof performance !== "undefined" && (performance as any).now
    ? (performance as any).now()
    : Date.now();
}

export class UnifiedEmailService {
  private readonly primaryProvider: EmailProvider;
  private readonly fallbackProvider?: EmailProvider;
  private readonly fromEmail: string;
  private readonly fromName?: string;
  private readonly replyTo?: string;

  constructor(options: EmailServiceOptions) {
    this.primaryProvider = options.primaryProvider;
    this.fallbackProvider = options.fallbackProvider;
    this.fromEmail = options.fromEmail;
    this.fromName = options.fromName;
    this.replyTo = options.replyTo;
  }

  async sendEmail(request: UnifiedEmailRequest): Promise<UnifiedEmailResponse> {
    const start = nowMs();
    let attempt = 0;
    let lastError: unknown = null;

    const providers: EmailProvider[] = [this.primaryProvider];
    if (this.fallbackProvider) providers.push(this.fallbackProvider);

    for (const provider of providers) {
      attempt += 1;
      try {
        const sendStart = nowMs();
        const result = await provider.send({
          ...request,
          // Ensure from/replyTo are respected if provider uses them
          // Adapters read from env for now; template engine will set html later
        });
        const deliveryTime = Math.max(0, Math.round(nowMs() - sendStart));
        return {
          success: true,
          emailId: `${provider.name}-${Date.now()}`,
          provider: provider.name,
          messageId: result.messageId ?? null,
          metrics: {
            deliveryTime,
            retryCount: attempt - 1,
            queueTime: 0,
          },
        };
      } catch (error) {
        lastError = error;
        // continue to next provider
      }
    }

    const totalTime = Math.max(0, Math.round(nowMs() - start));
    return {
      success: false,
      emailId: `failed-${Date.now()}`,
      provider: this.primaryProvider.name,
      messageId: undefined,
      error:
        lastError instanceof Error
          ? lastError.message
          : "Unknown email send error",
      metrics: {
        deliveryTime: totalTime,
        retryCount: Math.max(0, attempt - 1),
        queueTime: 0,
      },
    };
  }
}

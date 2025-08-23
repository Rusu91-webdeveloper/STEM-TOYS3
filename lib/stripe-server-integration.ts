import Stripe from "stripe";

// Server-side Stripe integration that doesn't rely on CDN
export class StripeServerIntegration {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is required for server-side Stripe integration");
    }
    
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }

  // Create a payment intent
  async createPaymentIntent(amount: number, currency: string = "usd", metadata?: any) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error("Error creating payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Confirm a payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return {
        success: true,
        paymentIntent,
      };
    } catch (error) {
      console.error("Error confirming payment intent:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Create a payment method
  async createPaymentMethod(cardData: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  }) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: "card",
        card: cardData,
      });

      return {
        success: true,
        paymentMethod,
      };
    } catch (error) {
      console.error("Error creating payment method:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Process payment directly (server-side)
  async processPayment(amount: number, cardData: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  }, currency: string = "usd") {
    try {
      // Create payment method
      const paymentMethodResult = await this.createPaymentMethod(cardData);
      if (!paymentMethodResult.success) {
        return paymentMethodResult;
      }

      // Create payment intent
      const paymentIntentResult = await this.createPaymentIntent(amount, currency);
      if (!paymentIntentResult.success) {
        return paymentIntentResult;
      }

      // Confirm payment
      const confirmResult = await this.confirmPaymentIntent(
        paymentIntentResult.paymentIntentId!,
        paymentMethodResult.paymentMethod!.id
      );

      return confirmResult;
    } catch (error) {
      console.error("Error processing payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get Stripe instance for direct access
  getStripeInstance() {
    return this.stripe;
  }
}

// Export singleton instance
export const stripeServer = new StripeServerIntegration();

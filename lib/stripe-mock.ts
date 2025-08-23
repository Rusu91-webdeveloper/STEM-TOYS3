import { Stripe } from "@stripe/stripe-js";

// Create a proper mock Stripe object that's compatible with React Stripe Elements
export const createCompatibleMockStripe = (): Stripe => {
  console.warn("Creating compatible mock Stripe object for testing");

  const mockStripe: Stripe = {
    // Core Stripe methods
    elements: (options?: any) => ({
      create: (type: string, options?: any) => ({
        mount: (domElement: string | HTMLElement) => {
          console.log("Mock Stripe element mounted:", type);
          // Create a fake input field for testing
          if (typeof domElement === 'string') {
            const element = document.querySelector(domElement);
            if (element) {
              element.innerHTML = `
                <div style="border: 1px solid #ccc; padding: 10px; border-radius: 4px; background: #f9f9f9;">
                  <div style="margin-bottom: 8px;">
                    <input type="text" placeholder="Card number (test: 4242 4242 4242 4242)" 
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <input type="text" placeholder="MM/YY" 
                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                    <input type="text" placeholder="CVC" 
                           style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    ⚠️ Mock Stripe - For testing only
                  </div>
                </div>
              `;
            }
          }
          return { id: 'mock-element' };
        },
        unmount: () => {
          console.log("Mock Stripe element unmounted");
        },
        on: (event: string, handler: any) => {
          console.log("Mock Stripe event listener added:", event);
        },
        update: (options: any) => {
          console.log("Mock Stripe element updated:", options);
        },
        destroy: () => {
          console.log("Mock Stripe element destroyed");
        },
        getElement: () => null,
        focus: () => {
          console.log("Mock Stripe element focused");
        },
        blur: () => {
          console.log("Mock Stripe element blurred");
        },
        clear: () => {
          console.log("Mock Stripe element cleared");
        },
      }),
      getElement: () => null,
      update: () => {
        console.log("Mock Stripe elements updated");
      },
      clear: () => {
        console.log("Mock Stripe elements cleared");
      },
      unmount: () => {
        console.log("Mock Stripe elements unmounted");
      },
    }),

    // Payment methods
    confirmCardPayment: async (clientSecret: string, data?: any) => {
      console.log("Mock confirmCardPayment called");
      return {
        error: null,
        paymentIntent: {
          id: 'mock_pi_' + Math.random().toString(36).substr(2, 9),
          status: 'succeeded',
          client_secret: clientSecret,
        },
      };
    },

    confirmPayment: async (data: any) => {
      console.log("Mock confirmPayment called");
      return {
        error: null,
        paymentIntent: {
          id: 'mock_pi_' + Math.random().toString(36).substr(2, 9),
          status: 'succeeded',
        },
      };
    },

    // Other required methods
    createToken: async (element: any, data?: any) => {
      console.log("Mock createToken called");
      return {
        error: null,
        token: {
          id: 'mock_tok_' + Math.random().toString(36).substr(2, 9),
          type: 'card',
        },
      };
    },

    createSource: async (element: any, data?: any) => {
      console.log("Mock createSource called");
      return {
        error: null,
        source: {
          id: 'mock_src_' + Math.random().toString(36).substr(2, 9),
          type: 'card',
        },
      };
    },

    createPaymentMethod: async (data: any) => {
      console.log("Mock createPaymentMethod called");
      return {
        error: null,
        paymentMethod: {
          id: 'mock_pm_' + Math.random().toString(36).substr(2, 9),
          type: 'card',
        },
      };
    },

    // Utility methods
    _registerWrapper: () => {
      console.log("Mock _registerWrapper called");
    },

    _loadStripe: () => {
      console.log("Mock _loadStripe called");
    },

    // Add any other methods that might be called
    ...({
      // Add any additional methods that Stripe might need
    } as any),
  };

  return mockStripe;
};

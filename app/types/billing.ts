export interface UserBilling {
  secondsRemaining: number;
  totalSecondsPurchased: number;
  subscriptionStatus: 'none' | 'active' | 'cancelled' | 'expired' | 'paused';
  subscriptionId?: string;
  customerId?: string;
  planType?: 'payg' | 'monthly' | 'annual';
  subscriptionEndsAt?: Date;
  subscriptionRenewsAt?: Date;
  lastPaymentAt?: Date;
  customerPortalUrl?: string;
  lastUpdated: Date;
}

export interface PaddleWebhookEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: {
    id: string;
    status?: string;
    customer_id?: string;
    address_id?: string;
    business_id?: string;
    custom_data?: {
      user_id?: string;
      [key: string]: any;
    };
    currency_code?: string;
    origin?: string;
    subscription_id?: string;
    invoice_id?: string;
    invoice_number?: string;
    collection_mode?: string;
    discount_id?: string;
    billing_details?: any;
    billing_period?: {
      ends_at: string;
      starts_at: string;
    };
    current_billing_period?: {
      ends_at: string;
      starts_at: string;
    };
    first_billed_at?: string;
    next_billed_at?: string;
    paused_at?: string;
    canceled_at?: string;
    management_urls?: {
      update_payment_method?: string;
      cancel?: string;
    };
    items?: Array<{
      price_id: string;
      quantity: number;
      recurring?: boolean;
    }>;
    details?: {
      totals?: {
        subtotal: string;
        discount: string;
        tax: string;
        total: string;
        grand_total: string;
        fee?: string;
        earnings?: string;
        currency_code: string;
      };
    };
    [key: string]: any;
  };
}

export interface CheckoutRequest {
  priceId: string;
  userId: string;
  email?: string;
  name?: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
  checkoutId: string;
}

// Product configuration
export const PLANS = {
  FREE: {
    seconds: 10 * 60, // 10 minutes in seconds
    price: 0,
    name: 'Free Trial'
  },
  PAYG: {
    seconds: 150 * 60, // 150 minutes in seconds
    price: 8,
    name: 'Pay as you go'
  },
  MONTHLY: {
    seconds: 250 * 60, // 250 minutes in seconds
    price: 12,
    name: 'Monthly Subscription',
    billing: 'monthly'
  },
  ANNUAL: {
    seconds: 3000 * 60, // 3000 minutes in seconds
    price: 120,
    name: 'Annual Subscription',
    billing: 'annually'
  }
} as const;

export type PlanType = keyof typeof PLANS; 
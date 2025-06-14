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
  lastUpdated: Date;
  // Payment status tracking
  recentPaymentStatus?: 'processing' | 'completed' | 'failed';
  recentPaymentTimestamp?: Date;
  recentPaymentAmount?: number;
  recentPaymentPlanType?: 'payg' | 'monthly' | 'annual';
}

// Add proper types for Paddle webhook items
export interface PaddleWebhookItem {
  price_id: string;
  quantity: number;
  recurring?: boolean;
  price?: {
    id: string;
    name?: string;
    description?: string;
  };
}

// Add proper types for Paddle billing details
export interface PaddleBillingDetails {
  enable_checkout?: boolean;
  purchase_order_number?: string;
  additional_information?: string;
  payment_terms?: string;
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
      [key: string]: unknown;
    };
    currency_code?: string;
    origin?: string;
    subscription_id?: string;
    invoice_id?: string;
    invoice_number?: string;
    collection_mode?: string;
    discount_id?: string;
    billing_details?: PaddleBillingDetails;
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
    items?: PaddleWebhookItem[];
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
    [key: string]: unknown;
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
    seconds: 100 * 60, // 100 minutes in seconds
    price: 8,
    name: 'Pay as you go'
  },
  MONTHLY: {
    seconds: 200 * 60, // 200 minutes in seconds
    price: 12,
    name: 'Monthly Subscription',
    billing: 'monthly'
  },
  ANNUAL: {
    seconds: 2400 * 60, // 2400 minutes in seconds
    price: 120,
    name: 'Annual Subscription',
    billing: 'annually'
  }
} as const;

export type PlanType = keyof typeof PLANS;

// Add proper types for Paddle SDK
export type PaddleEnvironment = 'production' | 'sandbox';

// Types for Paddle checkout creation
export interface PaddleTransactionRequest {
  items: Array<{
    priceId: string;
    quantity: number;
  }>;
  customData: {
    user_id: string;
    [key: string]: unknown;
  };
}

export interface PaddleTransactionResponse {
  id: string;
  checkout?: {
    url: string;
  };
}

// Types for Firebase document data
export interface FirebaseDocumentData {
  [key: string]: unknown;
  lastUpdated?: FirebaseTimestamp | Date;
  subscriptionEndsAt?: FirebaseTimestamp | Date;
  subscriptionRenewsAt?: FirebaseTimestamp | Date;
  // Legacy fields for migration
  minutesRemaining?: number;
  totalMinutesPurchased?: number;
}

export interface FirebaseTimestamp {
  toDate(): Date;
}

// Types for customer portal request body
export interface CustomerPortalRequestBody {
  subscription_ids?: string[];
}

// Types for Paddle.js window object
export interface PaddleCheckoutSettings {
  displayMode: 'overlay' | 'inline';
  theme: 'light' | 'dark';
  locale?: string;
  allowLogout?: boolean;
  successUrl?: string;
}

export interface PaddleCheckoutItem {
  priceId: string;
  quantity: number;
}

export interface PaddleCheckoutCustomer {
  email: string;
  name?: string;
}

export interface PaddleCheckoutOptions {
  settings: PaddleCheckoutSettings;
  items: PaddleCheckoutItem[];
  customData: {
    user_id: string;
  };
  customer?: PaddleCheckoutCustomer;
}

export interface PaddleJS {
  Checkout: {
    open(options: PaddleCheckoutOptions): void;
  };
}

// Extend Window interface for Paddle.js
declare global {
  interface Window {
    Paddle?: PaddleJS;
  }
} 
# Paddle Migration Complete

## Overview
Successfully migrated from LemonSqueezy to Paddle for checkout functionality. The migration includes:

✅ **Updated UpgradeModal.tsx** - Now opens Paddle checkout as inline overlay instead of new window
✅ **Replaced LemonSqueezy webhook** - New Paddle webhook at `/api/webhooks/paddle/route.ts`
✅ **Updated billing service** - Uses Paddle Node SDK (`@paddle/paddle-node-sdk`)
✅ **Added Paddle.js** - Client-side integration for overlay checkouts
✅ **Updated billing hooks** - Now works with Paddle price IDs instead of variant IDs

## Required Environment Variables

### Server-side (Backend) Variables
```bash
# Paddle API Configuration
PADDLE_API_KEY=your_paddle_api_key_here
PADDLE_ENVIRONMENT=sandbox  # or 'production' for live
PADDLE_WEBHOOK_SECRET=your_paddle_webhook_secret_here

# Application Base URL (for checkout success redirects)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # or http://localhost:3000 for dev
```

### Client-side (Frontend) Variables
```bash
# Paddle.js Configuration
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=your_paddle_client_token_here
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox  # or 'production' for live
```

## Paddle Product/Price IDs (Already Configured)

The following Paddle IDs are already hardcoded in the application:

### Products
- **Subscription Product**: `pro_01jx8b1xm1xt339h14hna4xdwp`
- **Pay-as-you-go Product**: `pro_01jxac9yheap1bna49bc454f97`

### Prices
- **Monthly Subscription**: `pri_01jx8b45hdcsgmd0w86hbs8t6c`
- **Annual Subscription**: `pri_01jx8b5dgh1r5hned24zsz7rvm`
- **PAYG (150 mins for $8)**: `pri_01jxacd6cxdkgkt4dm69e1s8v9`

## Key Changes Made

### 1. Package Dependencies
- Added `@paddle/paddle-node-sdk@^1.4.0` to package.json

### 2. Billing Types (`app/types/billing.ts`)
- Replaced `LemonSqueezyWebhookEvent` with `PaddleWebhookEvent`
- Updated `CheckoutRequest` to use `priceId` instead of `variantId`

### 3. Webhook Handler (`app/api/webhooks/paddle/route.ts`)
- New Paddle webhook handling these events:
  - `transaction.completed` - One-time payments (PAYG)
  - `subscription.created` - New subscriptions
  - `subscription.updated` - Subscription renewals
  - `subscription.canceled` - Cancellations
  - `subscription.paused` - Paused subscriptions
  - `subscription.resumed` - Resumed subscriptions
  - `subscription.past_due` - Past due subscriptions

### 4. Billing Service (`app/lib/billing.ts`)
- Replaced LemonSqueezy API calls with Paddle SDK
- Updated `createCheckout()` to use Paddle's transaction creation
- Changed `getVariantIds()` to `getPriceIds()`

### 5. Billing Hook (`app/hooks/useBilling.ts`)
- Updated to work with price IDs instead of variant IDs
- Changed all references from `variantIds` to `priceIds`

### 6. UpgradeModal (`app/components/UpgradeModal.tsx`)
- Now uses `Paddle.Checkout.open()` for inline overlay checkout
- Updated footer text to reference Paddle instead of LemonSqueezy
- Added success/close callbacks for better user experience

### 7. Layout (`app/layout.tsx`)
- Replaced LemonSqueezy script with Paddle.js
- Added Paddle initialization with client token and environment

## Webhook Configuration

Set up the webhook endpoint in your Paddle dashboard:
- **URL**: `https://yourdomain.com/api/webhooks/paddle`
- **Events to subscribe to**:
  - `transaction.completed`
  - `subscription.created`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.paused`
  - `subscription.resumed`
  - `subscription.past_due`

## Testing

1. Ensure all environment variables are set
2. Run `npm install` to install new dependencies
3. Test checkout flow:
   - Monthly subscription checkout
   - Annual subscription checkout
   - PAYG checkout
4. Test webhook events using Paddle's webhook testing tools

## Migration Benefits

✅ **Better User Experience** - Inline overlay checkout instead of redirect
✅ **Improved Conversion** - Users stay on your site during checkout
✅ **Modern Payment Processing** - Paddle's advanced payment features
✅ **Better Analytics** - Enhanced transaction tracking capabilities
✅ **Global Payment Support** - Paddle's worldwide payment methods

## Cleanup Completed

- ❌ Removed old LemonSqueezy webhook (`app/api/webhooks/lemonsqueezy/route.ts`)
- ❌ Removed LemonSqueezy script from layout
- ❌ Removed all LemonSqueezy-specific code

The migration is now complete and ready for testing! 
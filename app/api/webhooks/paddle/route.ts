import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { BillingService } from '../../../lib/billing';
import { PaddleWebhookEvent, PLANS } from '../../../types/billing';

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

// Initialize Paddle instance for webhook verification
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox',
});

// Get price ID to plan mapping using the provided Paddle IDs
function getPriceToPlanMapping() {
  return {
    'pri_01jxacd6cxdkgkt4dm69e1s8v9': { type: 'payg' as const, seconds: PLANS.PAYG.seconds }, // PAYG price
    'pri_01jx8b45hdcsgmd0w86hbs8t6c': { type: 'monthly' as const, seconds: PLANS.MONTHLY.seconds }, // Monthly price
    'pri_01jx8b5dgh1r5hned24zsz7rvm': { type: 'annual' as const, seconds: PLANS.ANNUAL.seconds }, // Annual price
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const headersList = await headers();
    const signature = headersList.get('paddle-signature');

    if (!signature) {
      console.error('Missing paddle-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature using Paddle SDK
    try {
      const eventData = paddle.webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature);
      // If verification succeeds, we'll process the event
    } catch (verificationError) {
      console.error('Invalid webhook signature:', verificationError);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const webhookEvent: PaddleWebhookEvent = JSON.parse(rawBody);
    const { event_type, data } = webhookEvent;
    
    console.log(`Processing Paddle webhook: ${event_type}`, {
      eventType: event_type,
      dataId: data.id,
      customData: data.custom_data,
      status: data.status,
    });

    // Extract user ID from custom data
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('No user_id in webhook custom_data');
      return NextResponse.json({ error: 'No user_id provided' }, { status: 400 });
    }

    const priceToPlan = getPriceToPlanMapping();
    
    // Extract price ID and plan info from webhook data
    let priceId: string | null = null;
    let planInfo: { type: 'payg' | 'monthly' | 'annual'; seconds: number } | undefined;

    // Get price ID from the first item in the items array
    if (data.items && data.items.length > 0) {
      priceId = data.items[0].price_id;
      planInfo = priceToPlan[priceId as keyof typeof priceToPlan];
    }

    // Handle different event types
    switch (event_type) {
      case 'transaction.completed': {
        // Handle successful one-time payments (PAYG)
        if (planInfo && planInfo.type === 'payg') {
          await BillingService.addSeconds(userId, planInfo.seconds, planInfo.type);
          console.log(`Added ${planInfo.seconds} seconds (${Math.floor(planInfo.seconds / 60)} minutes) to user ${userId} from PAYG purchase`);
        }
        break;
      }

      case 'subscription.created': {
        // Handle subscription creation
        if (planInfo && (planInfo.type === 'monthly' || planInfo.type === 'annual')) {
          // Check if we've already processed this subscription to prevent duplicates
          const existingBilling = await BillingService.getUserBilling(userId);
          if (existingBilling.subscriptionId === data.id) {
            console.log(`Subscription ${data.id} already processed for user ${userId}, skipping`);
            return NextResponse.json({ received: true });
          }
          
          await BillingService.addSeconds(userId, planInfo.seconds, planInfo.type);
          
          // Update subscription status
          const subscriptionData = {
            subscriptionStatus: 'active' as const,
            subscriptionId: data.id,
            customerId: data.customer_id,
            planType: planInfo.type,
            subscriptionRenewsAt: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
            subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
            customerPortalUrl: data.management_urls?.update_payment_method,
          };
          
          await BillingService.updateUserBilling(userId, subscriptionData);
          console.log(`Created ${planInfo.type} subscription for user ${userId}, added ${planInfo.seconds} seconds (${Math.floor(planInfo.seconds / 60)} minutes)`);
        }
        break;
      }

      case 'subscription.updated': {
        // Handle subscription updates (including renewals)
        if (data.status === 'active' && planInfo && (planInfo.type === 'monthly' || planInfo.type === 'annual')) {
          // For active subscriptions, update the renewal date
          const updateData = {
            subscriptionStatus: 'active' as const,
            subscriptionRenewsAt: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
            subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
            lastPaymentAt: new Date(),
          };
          
          await BillingService.updateUserBilling(userId, updateData);
          console.log(`Updated subscription for user ${userId}`);
        }
        break;
      }

      case 'subscription.canceled': {
        // Handle subscription cancellation
        const cancellationData = {
          subscriptionStatus: 'cancelled' as const,
          subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
        };
        
        await BillingService.updateUserBilling(userId, cancellationData);
        console.log(`Cancelled subscription for user ${userId}`);
        break;
      }

      case 'subscription.paused': {
        // Handle subscription pause
        const pauseData = {
          subscriptionStatus: 'paused' as const,
          subscriptionEndsAt: data.paused_at ? new Date(data.paused_at) : undefined,
        };
        
        await BillingService.updateUserBilling(userId, pauseData);
        console.log(`Paused subscription for user ${userId}`);
        break;
      }

      case 'subscription.resumed': {
        // Handle subscription resumption
        const resumptionData = {
          subscriptionStatus: 'active' as const,
          subscriptionRenewsAt: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
          subscriptionEndsAt: undefined, // Clear end date on resumption
        };
        
        await BillingService.updateUserBilling(userId, resumptionData);
        console.log(`Resumed subscription for user ${userId}`);
        break;
      }

      case 'subscription.past_due': {
        // Handle past due subscription
        const pastDueData = {
          subscriptionStatus: 'paused' as const, // Treat past due as paused
        };
        
        await BillingService.updateUserBilling(userId, pastDueData);
        console.log(`Subscription past due for user ${userId}`);
        break;
      }

      default: {
        console.log(`Unhandled Paddle webhook event: ${event_type}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
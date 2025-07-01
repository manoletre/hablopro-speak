import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { BillingService } from '../../../lib/billing';
import { PaddleWebhookEvent, PLANS, PaddleWebhookItem } from '../../../types/billing';
import { db } from '../../../lib/firebase-admin';

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET!;

// Initialize Paddle instance for webhook verification
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
});

// Get price ID to plan mapping based on environment
function getPriceToPlanMapping() {
  const isProduction = process.env.PADDLE_ENVIRONMENT === 'production';
  
  if (isProduction) {
    // Production price IDs
    return {
      'pri_01jz1wg1wvfya09wcfk28afp5t': { type: 'payg' as const, seconds: PLANS.PAYG.seconds }, // PAYG price
      'pri_01jz1wpg1h5rwk1ajbqmsyv469': { type: 'monthly' as const, seconds: PLANS.MONTHLY.seconds }, // Monthly price
      'pri_01jz1wnvbay7g66knksv1z7m07': { type: 'annual' as const, seconds: PLANS.ANNUAL.seconds }, // Annual price
    };
  } else {
    // Sandbox price IDs
    return {
      'pri_01jxacd6cxdkgkt4dm69e1s8v9': { type: 'payg' as const, seconds: PLANS.PAYG.seconds }, // PAYG price
      'pri_01jx8b45hdcsgmd0w86hbs8t6c': { type: 'monthly' as const, seconds: PLANS.MONTHLY.seconds }, // Monthly price
      'pri_01jx8b5dgh1r5hned24zsz7rvm': { type: 'annual' as const, seconds: PLANS.ANNUAL.seconds }, // Annual price
    };
  }
}

// Add webhook event deduplication to prevent duplicate processing
async function isEventProcessed(eventId: string): Promise<boolean> {
  try {
    const eventRef = db.collection('webhook_events').doc(eventId);
    const eventDoc = await eventRef.get();
    return eventDoc.exists;
  } catch (error) {
    console.error('Error checking event deduplication:', error);
    // If we can't check, proceed with processing to avoid blocking legitimate events
    return false;
  }
}

async function markEventAsProcessed(eventId: string, eventType: string): Promise<void> {
  try {
    await db.collection('webhook_events').doc(eventId).set({
      eventType,
      processedAt: new Date(),
      // Auto-delete after 30 days to keep collection clean
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Error marking event as processed:', error);
    // Non-blocking error - log but continue
  }
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
      paddle.webhooks.unmarshal(rawBody, PADDLE_WEBHOOK_SECRET, signature);
      // If verification succeeds, we'll process the event
    } catch (verificationError) {
      console.error('Invalid webhook signature:', verificationError);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const webhookEvent: PaddleWebhookEvent = JSON.parse(rawBody);
    const { event_type, data } = webhookEvent;
    
    // Check for event deduplication
    const eventId = data.id;
    if (await isEventProcessed(eventId)) {
      console.log(`Webhook event ${eventId} already processed, skipping`);
      return NextResponse.json({ received: true, message: 'Event already processed' });
    }
    
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
      const firstItem: PaddleWebhookItem = data.items[0];
      // For transaction events the field is price_id, for subscription events it's price.id
      if (firstItem.price_id) {
        priceId = firstItem.price_id;
      } else if (firstItem.price && firstItem.price.id) {
        priceId = firstItem.price.id;
      }
      if (priceId) {
        planInfo = priceToPlan[priceId as keyof typeof priceToPlan];
      }
    }

    // Handle different event types
    switch (event_type) {
      case 'transaction.completed': {
        // Handle successful payments (PAYG, subscription initial payments, and renewals)
        if (planInfo) {
          // Check if this is a subscription renewal
          const isRenewal = data.origin === 'subscription_recurring';
          const transactionType = isRenewal ? 'renewal' : 'purchase';
          
          // Add seconds for ALL successful transactions (PAYG, subscriptions, and renewals)
          await BillingService.addSeconds(userId, planInfo.seconds, planInfo.type, data.subscription_id, isRenewal);
          console.log(`Added ${planInfo.seconds} seconds (${Math.floor(planInfo.seconds / 60)} minutes) to user ${userId} from ${planInfo.type} ${transactionType}`);
          
          // Update payment status to completed for initial purchases (not renewals)
          if (!isRenewal) {
            const amount = planInfo.type === 'payg' ? PLANS.PAYG.price : 
                          planInfo.type === 'monthly' ? PLANS.MONTHLY.price : PLANS.ANNUAL.price;
            await BillingService.updatePaymentStatus(userId, 'completed', amount, planInfo.type);
            console.log(`Payment completed for user ${userId}, plan: ${planInfo.type}, amount: $${amount}`);
          } else {
            console.log(`Subscription renewal completed for user ${userId}, plan: ${planInfo.type}`);
          }
        }
        break;
      }

      case 'subscription.created': {
        // Handle subscription creation
        console.log(`Processing subscription.created for user ${userId}, subscription: ${data.id}`);
        // Note: Seconds are added in transaction.completed handler. This handler only sets up subscription metadata.

        const subscriptionData: Partial<import('../../../types/billing').UserBilling> = {
          subscriptionStatus: 'active' as const,
          subscriptionId: data.id,
          customerId: data.customer_id,
          subscriptionRenewsAt: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
          subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
        };

        if (planInfo) {
          subscriptionData.planType = planInfo.type;
        }

        await BillingService.updateUserBilling(userId, subscriptionData);
        console.log(`Subscription created for user ${userId}. Plan: ${planInfo ? planInfo.type : 'unknown'}`);
        break;
      }

      case 'subscription.updated': {
        // Handle subscription updates (including renewals, cancellations, etc.)
        if (data.status === 'active') {
          // For active subscriptions, update the renewal date and payment info
          const updateData = {
            subscriptionStatus: 'active' as const,
            subscriptionRenewsAt: data.next_billed_at ? new Date(data.next_billed_at) : undefined,
            subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
            lastPaymentAt: new Date(),
          };
          
          await BillingService.updateUserBilling(userId, updateData);
          console.log(`Updated active subscription for user ${userId}. Next billing: ${data.next_billed_at}`);
        } else if (data.status === 'canceled') {
          // Handle canceled subscriptions
          const updateData = {
            subscriptionStatus: 'cancelled' as const,
            subscriptionEndsAt: data.canceled_at ? new Date(data.canceled_at) : undefined,
          };
          
          await BillingService.updateUserBilling(userId, updateData);
          console.log(`Subscription canceled for user ${userId}`);
        } else if (data.status === 'past_due') {
          // Handle past due subscriptions
          const updateData = {
            subscriptionStatus: 'paused' as const, // Treat past due as paused for app access
          };
          
          await BillingService.updateUserBilling(userId, updateData);
          console.log(`Subscription past due for user ${userId}`);
        } else {
          console.log(`Subscription status updated to ${data.status} for user ${userId}`);
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
          subscriptionEndsAt: undefined,
        };
        await BillingService.updateUserBilling(userId, resumptionData);
        console.log(`Resumed subscription for user ${userId}`);
        break;
      }

      case 'subscription.past_due': {
        const pastDueData = {
          subscriptionStatus: 'paused' as const,
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

    // Mark event as processed to prevent duplicate handling
    await markEventAsProcessed(eventId, event_type);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

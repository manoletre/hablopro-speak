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

// Add transaction-specific deduplication to prevent double-crediting minutes
async function isTransactionBilled(userId: string, transactionId: string): Promise<boolean> {
  try {
    const billedTxRef = db.collection('users').doc(userId).collection('billed_transactions').doc(transactionId);
    const billedTxDoc = await billedTxRef.get();
    return billedTxDoc.exists;
  } catch (error) {
    console.error('Error checking transaction billing status:', error);
    // If we can't check, proceed with processing to avoid blocking legitimate events
    return false;
  }
}

async function markTransactionAsBilled(userId: string, transactionId: string, eventType: string, planType: string, seconds: number): Promise<void> {
  try {
    await db.collection('users').doc(userId).collection('billed_transactions').doc(transactionId).set({
      eventType,
      planType,
      seconds,
      billedAt: new Date(),
      // Auto-delete after 90 days to keep collection clean
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error('Error marking transaction as billed:', error);
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
    const { event_id, event_type, data } = webhookEvent;
    
    console.log(`🎣 Received Paddle webhook:`, {
      eventId: event_id,
      eventType: event_type,
      transactionId: data.id,
      status: data.status,
      userId: data.custom_data?.user_id,
      subscriptionId: data.subscription_id,
      origin: data.origin
    });
    
    // Check for event deduplication using EVENT ID, not transaction ID
    if (await isEventProcessed(event_id)) {
      console.log(`🔄 Webhook event ${event_id} (${event_type}) already processed, skipping`);
      return NextResponse.json({ received: true, message: 'Event already processed' });
    }
    
    console.log(`✅ Processing new Paddle webhook: ${event_type}`, {
      eventId: event_id,
      eventType: event_type,
      transactionId: data.id,
      customData: data.custom_data,
      status: data.status,
    });

    // Extract user ID from custom data
    const userId = data.custom_data?.user_id;
    if (!userId) {
      console.error('❌ No user_id in webhook custom_data');
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

    console.log(`💰 Price info:`, {
      priceId,
      planInfo: planInfo ? { type: planInfo.type, seconds: planInfo.seconds } : null
    });

    // Handle different event types
    switch (event_type) {
      case 'transaction.completed': {
        // Handle successful payments (PAYG, subscription initial payments, and renewals)
        if (planInfo) {
          // Check if this is a subscription renewal
          const isRenewal = data.origin === 'subscription_recurring';
          const transactionType = isRenewal ? 'renewal' : 'purchase';
          
          console.log(`💳 Processing transaction.completed: ${transactionType} for user ${userId}`);
          
          // Check if this transaction has already been billed to prevent double-crediting
          const alreadyBilled = await isTransactionBilled(userId, data.id);
          if (alreadyBilled) {
            console.log(`⚠️ Transaction ${data.id} already billed for user ${userId}, skipping minute addition`);
          } else {
            // Add seconds for ALL successful transactions (PAYG, subscriptions, and renewals)
            await BillingService.addSeconds(userId, planInfo.seconds, planInfo.type, data.subscription_id, isRenewal);
            console.log(`✅ Added ${planInfo.seconds} seconds (${Math.floor(planInfo.seconds / 60)} minutes) to user ${userId} from ${planInfo.type} ${transactionType}`);
            
            // Mark this transaction as billed
            await markTransactionAsBilled(userId, data.id, event_type, planInfo.type, planInfo.seconds);
          }
          
          // Always update payment status for initial purchases (not renewals)
          if (!isRenewal) {
            const amount = planInfo.type === 'payg' ? PLANS.PAYG.price : 
                          planInfo.type === 'monthly' ? PLANS.MONTHLY.price : PLANS.ANNUAL.price;
            await BillingService.updatePaymentStatus(userId, 'completed', amount, planInfo.type);
            console.log(`✅ Payment completed for user ${userId}, plan: ${planInfo.type}, amount: $${amount}`);
          } else {
            console.log(`✅ Subscription renewal completed for user ${userId}, plan: ${planInfo.type}`);
          }
          
          // For subscription plans (monthly/annual), ensure subscription metadata is updated
          if ((planInfo.type === 'monthly' || planInfo.type === 'annual') && data.subscription_id) {
            const subscriptionData: Partial<import('../../../types/billing').UserBilling> = {
              subscriptionStatus: 'active' as const,
              subscriptionId: data.subscription_id,
              customerId: data.customer_id,
              planType: planInfo.type,
            };
            
            // Add billing period information if available
            if (data.billing_period) {
              subscriptionData.subscriptionRenewsAt = new Date(data.billing_period.ends_at);
            }
            
            await BillingService.updateUserBilling(userId, subscriptionData);
            console.log(`🔄 Updated subscription metadata for user ${userId}, subscription: ${data.subscription_id}`);
          }
        } else {
          console.error(`❌ No plan info found for price ID: ${priceId}`);
        }
        break;
      }

      case 'transaction.updated': {
        // Handle transaction updates when status becomes "completed"
        if (data.status === 'completed' && planInfo) {
          console.log(`💳 Processing transaction.updated with completed status for user ${userId}, transaction: ${data.id}`);
          
          // Check if this is a subscription renewal
          const isRenewal = data.origin === 'subscription_recurring';
          const transactionType = isRenewal ? 'renewal' : 'purchase';
          
          // Check if this transaction has already been billed to prevent double-crediting
          const alreadyBilled = await isTransactionBilled(userId, data.id);
          if (alreadyBilled) {
            console.log(`⚠️ Transaction ${data.id} already billed for user ${userId}, skipping minute addition`);
          } else {
            // Add seconds for completed transactions (PAYG, subscriptions, and renewals)
            await BillingService.addSeconds(userId, planInfo.seconds, planInfo.type, data.subscription_id, isRenewal);
            console.log(`✅ Added ${planInfo.seconds} seconds (${Math.floor(planInfo.seconds / 60)} minutes) to user ${userId} from ${planInfo.type} ${transactionType} via transaction.updated`);
            
            // Mark this transaction as billed
            await markTransactionAsBilled(userId, data.id, event_type, planInfo.type, planInfo.seconds);
          }
          
          // Always update payment status for initial purchases (not renewals)
          if (!isRenewal) {
            const amount = planInfo.type === 'payg' ? PLANS.PAYG.price : 
                          planInfo.type === 'monthly' ? PLANS.MONTHLY.price : PLANS.ANNUAL.price;
            await BillingService.updatePaymentStatus(userId, 'completed', amount, planInfo.type);
            console.log(`✅ Payment completed for user ${userId}, plan: ${planInfo.type}, amount: $${amount} via transaction.updated`);
          } else {
            console.log(`✅ Subscription renewal completed for user ${userId}, plan: ${planInfo.type} via transaction.updated`);
          }
          
          // For subscription plans (monthly/annual), ensure subscription metadata is updated
          if ((planInfo.type === 'monthly' || planInfo.type === 'annual') && data.subscription_id) {
            const subscriptionData: Partial<import('../../../types/billing').UserBilling> = {
              subscriptionStatus: 'active' as const,
              subscriptionId: data.subscription_id,
              customerId: data.customer_id,
              planType: planInfo.type,
            };
            
            // Add billing period information if available
            if (data.billing_period) {
              subscriptionData.subscriptionRenewsAt = new Date(data.billing_period.ends_at);
            }
            
            await BillingService.updateUserBilling(userId, subscriptionData);
            console.log(`🔄 Updated subscription metadata for user ${userId}, subscription: ${data.subscription_id} via transaction.updated`);
          }
        } else if (data.status && data.status !== 'completed') {
          console.log(`ℹ️ Transaction updated to status ${data.status} for user ${userId}, transaction: ${data.id} - no action needed`);
        } else if (!planInfo) {
          console.error(`❌ No plan info found for price ID: ${priceId} in transaction.updated`);
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
    await markEventAsProcessed(event_id, event_type);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Paddle webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { db } from './firebase-admin';
import { UserBilling, CheckoutRequest, CheckoutResponse, PLANS } from '../types/billing';
import { Paddle } from '@paddle/paddle-node-sdk';

// Paddle API configuration
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production' || 'sandbox',
});

// Get price IDs using the provided Paddle IDs
function getPriceIds() {
  return {
    payg: 'pri_01jxacd6cxdkgkt4dm69e1s8v9', // PAYG price ($8 for 150 mins)
    monthly: 'pri_01jx8b45hdcsgmd0w86hbs8t6c', // Monthly subscription price
    annual: 'pri_01jx8b5dgh1r5hned24zsz7rvm', // Annual subscription price
  };
}

export class BillingService {
  // Create a checkout session with Paddle
  static async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      const response = await paddle.transactions.create({
        items: [
          {
            priceId: request.priceId,
            quantity: 1,
          }
        ],
        customData: {
          user_id: request.userId,
        },
        customer: request.email ? {
          email: request.email,
          name: request.name,
        } : undefined,
        checkoutUrl: {
          successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
          discountId: undefined,
        },
      });

      return {
        checkoutUrl: response.checkoutUrl || '',
        checkoutId: response.id,
      };
    } catch (error) {
      console.error('Error creating Paddle checkout:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // Get user billing information
  static async getUserBilling(userId: string): Promise<UserBilling> {
    const userRef = db.collection('users').doc(userId);
    const billingRef = userRef.collection('billing').doc('current');
    
    const billingDoc = await billingRef.get();
    
    if (!billingDoc.exists) {
      // Initialize with free trial seconds
      const initialBilling: UserBilling = {
        secondsRemaining: PLANS.FREE.seconds,
        totalSecondsPurchased: PLANS.FREE.seconds,
        subscriptionStatus: 'none',
        lastUpdated: new Date(),
      };
      
      await billingRef.set({
        ...initialBilling,
        lastUpdated: new Date(),
      });
      
      return initialBilling;
    }
    
    const data = billingDoc.data()!;
    
    // Handle migration from minutes to seconds for existing users
    const legacyData = data as any;
    if (legacyData.minutesRemaining !== undefined && legacyData.secondsRemaining === undefined) {
      console.log(`Migrating user ${userId} from minutes to seconds`);
      const migratedBilling = {
        ...data,
        secondsRemaining: legacyData.minutesRemaining * 60,
        totalSecondsPurchased: legacyData.totalMinutesPurchased * 60,
        lastUpdated: new Date(),
      };
      
              // Remove old minute fields
        delete (migratedBilling as any).minutesRemaining;
        delete (migratedBilling as any).totalMinutesPurchased;
      
      await billingRef.set(migratedBilling);
      
      return {
        ...migratedBilling,
        lastUpdated: migratedBilling.lastUpdated,
        subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate(),
      } as UserBilling;
    }
    
    return {
      ...data,
      lastUpdated: data.lastUpdated.toDate(),
      subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
      subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate(),
    } as UserBilling;
  }

  // Update user billing information
  static async updateUserBilling(userId: string, billing: Partial<UserBilling>): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    const billingRef = userRef.collection('billing').doc('current');
    
    // Filter out undefined values to avoid Firestore errors
    const cleanedBilling: any = {
      lastUpdated: new Date(),
    };
    
    Object.keys(billing).forEach(key => {
      const value = (billing as any)[key];
      if (value !== undefined) {
        cleanedBilling[key] = value;
      }
    });
    
    await billingRef.set(cleanedBilling, { merge: true });
  }

  // Consume seconds from user's account
  static async consumeSeconds(userId: string, seconds: number): Promise<{ success: boolean; remainingSeconds: number; actualSecondsConsumed?: number }> {
    console.log(`💰 BillingService.consumeSeconds called - userId: ${userId}, seconds: ${seconds}`);
    
    const userRef = db.collection('users').doc(userId);
    const billingRef = userRef.collection('billing').doc('current');
    
    try {
      const result = await db.runTransaction(async (transaction) => {
        console.log(`💰 BillingService.consumeSeconds - Starting transaction for user ${userId}`);
        
        const billingDoc = await transaction.get(billingRef);
        
        if (!billingDoc.exists) {
          console.log(`💰 BillingService.consumeSeconds - No billing data found for user ${userId}`);
          throw new Error('User billing data not found');
        }
        
        const billing = billingDoc.data() as UserBilling;
        console.log(`💰 BillingService.consumeSeconds - Current billing data:`, {
          secondsRemaining: billing.secondsRemaining,
          requestedSeconds: seconds
        });
        
        // Always consume up to what the user has available - never fail due to insufficient seconds
        const actualSecondsToConsume = Math.min(seconds, billing.secondsRemaining);
        const newRemainingSeconds = billing.secondsRemaining - actualSecondsToConsume;
        
        console.log(`💰 BillingService.consumeSeconds - Will consume ${actualSecondsToConsume} seconds (requested: ${seconds}, available: ${billing.secondsRemaining})`);
        console.log(`💰 BillingService.consumeSeconds - Updating billing: ${billing.secondsRemaining} → ${newRemainingSeconds}`);
        
        transaction.update(billingRef, {
          secondsRemaining: newRemainingSeconds,
          lastUpdated: new Date(),
        });
        
        // Log the usage - record the actual seconds consumed, not the requested amount
        const usageRef = userRef.collection('usage').doc();
        const usageDocId = usageRef.id;
        console.log(`💰 BillingService.consumeSeconds - Creating usage document: ${usageDocId}`);
        
        const usageData = {
          secondsUsed: actualSecondsToConsume, // Use actual seconds consumed
          secondsRequested: seconds, // Track what was originally requested
          remainingAfter: newRemainingSeconds,
          timestamp: new Date(),
          sessionType: 'conversation', // Could be expanded for different types
        };
        
        console.log(`💰 BillingService.consumeSeconds - Usage data:`, usageData);
        
        transaction.set(usageRef, usageData);
        
        console.log(`💰 BillingService.consumeSeconds - Transaction completed successfully`);
        return { success: true, remainingSeconds: newRemainingSeconds, actualSecondsConsumed: actualSecondsToConsume };
      });
      
      console.log(`💰 BillingService.consumeSeconds - Final result:`, result);
      return result;
    } catch (error) {
      console.error(`💰 BillingService.consumeSeconds - Transaction failed:`, error);
      throw error;
    }
  }

  // Check if user has enough seconds (convenience method that converts minutes to seconds)
  static async hasEnoughMinutes(userId: string, requiredMinutes: number): Promise<boolean> {
    const billing = await this.getUserBilling(userId);
    const requiredSeconds = requiredMinutes * 60;
    return billing.secondsRemaining >= requiredSeconds;
  }

  // Check if user has enough seconds
  static async hasEnoughSeconds(userId: string, requiredSeconds: number): Promise<boolean> {
    const billing = await this.getUserBilling(userId);
    return billing.secondsRemaining >= requiredSeconds;
  }

  // Add minutes to user account (from purchase) - converts to seconds internally
  static async addMinutes(userId: string, minutes: number, planType: 'payg' | 'monthly' | 'annual'): Promise<void> {
    const seconds = minutes * 60;
    return this.addSeconds(userId, seconds, planType);
  }

  // Add seconds to user account (from purchase)
  static async addSeconds(userId: string, seconds: number, planType: 'payg' | 'monthly' | 'annual'): Promise<void> {
    const userRef = db.collection('users').doc(userId);
    const billingRef = userRef.collection('billing').doc('current');
    
    await db.runTransaction(async (transaction) => {
      const billingDoc = await transaction.get(billingRef);
      
      let currentBilling: UserBilling;
      if (!billingDoc.exists) {
        currentBilling = {
          secondsRemaining: 0,
          totalSecondsPurchased: 0,
          subscriptionStatus: 'none',
          lastUpdated: new Date(),
        };
      } else {
        const data = billingDoc.data()!;
        
        // Handle migration from minutes to seconds for existing users
        const legacyData = data as any;
        if (legacyData.minutesRemaining !== undefined && legacyData.secondsRemaining === undefined) {
          currentBilling = {
            ...data,
            secondsRemaining: legacyData.minutesRemaining * 60,
            totalSecondsPurchased: legacyData.totalMinutesPurchased * 60,
            lastUpdated: data.lastUpdated.toDate(),
            subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
            subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate(),
          } as UserBilling;
        } else {
          currentBilling = {
            ...data,
            lastUpdated: data.lastUpdated.toDate(),
            subscriptionEndsAt: data.subscriptionEndsAt?.toDate(),
            subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate(),
          } as UserBilling;
        }
      }
      
      // Only include defined fields to avoid Firestore "undefined" error
      const updateData: any = {
        secondsRemaining: currentBilling.secondsRemaining + seconds,
        totalSecondsPurchased: currentBilling.totalSecondsPurchased + seconds,
        planType,
        lastUpdated: new Date(),
      };

      // Only include subscription fields if they exist and are not undefined
      if (currentBilling.subscriptionStatus !== undefined) {
        updateData.subscriptionStatus = currentBilling.subscriptionStatus;
      }
      if (currentBilling.subscriptionId !== undefined) {
        updateData.subscriptionId = currentBilling.subscriptionId;
      }
      if (currentBilling.customerId !== undefined) {
        updateData.customerId = currentBilling.customerId;
      }
      if (currentBilling.subscriptionRenewsAt !== undefined) {
        updateData.subscriptionRenewsAt = currentBilling.subscriptionRenewsAt;
      }
      if (currentBilling.subscriptionEndsAt !== undefined) {
        updateData.subscriptionEndsAt = currentBilling.subscriptionEndsAt;
      }

      transaction.set(billingRef, updateData, { merge: true });
      
      // Log the purchase
      const purchaseRef = userRef.collection('purchases').doc();
      transaction.set(purchaseRef, {
        secondsAdded: seconds,
        planType,
        timestamp: new Date(),
      });
    });
  }

  // Get available price IDs for checkout
  static getPriceIds() {
    return getPriceIds();
  }
} 
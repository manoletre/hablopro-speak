import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionDuration } = body; // sessionDuration in seconds
    
    console.log('💰 API /session/end called with:', { userId, sessionDuration });
    
    if (!userId || typeof sessionDuration !== 'number') {
      console.log('💰 API /session/end - Invalid request data');
      return NextResponse.json(
        { error: 'Missing required fields: userId and sessionDuration' },
        { status: 400 }
      );
    }
    
    // Use exact seconds for billing - no rounding
    const secondsUsed = Math.max(0, sessionDuration);
    
    // Only deduct if user actually used some time (minimum 5 seconds to avoid micro-charges)
    if (secondsUsed >= 5) {
      console.log(`💰 API /session/end - About to consume ${secondsUsed} seconds for user ${userId}`);
      
      const result = await BillingService.consumeSeconds(userId, secondsUsed);
      
      console.log(`💰 API /session/end - BillingService.consumeSeconds result:`, result);
      
      // Use the actual seconds consumed from the billing service
      const actualSecondsUsed = result.actualSecondsConsumed ?? secondsUsed;
      
      return NextResponse.json({
        success: result.success,
        secondsUsed: actualSecondsUsed,
        secondsRequested: secondsUsed, // What was originally requested
        minutesUsed: Math.round(actualSecondsUsed / 60 * 100) / 100, // For display purposes
        remainingSeconds: result.remainingSeconds,
        remainingMinutes: Math.floor(result.remainingSeconds / 60), // For display purposes
      });
    }
    
    // If less than 5 seconds, don't charge but return current status
    console.log(`💰 API /session/end - Session too short (${secondsUsed}s), not billing`);
    const billing = await BillingService.getUserBilling(userId);
    return NextResponse.json({
      success: true,
      secondsUsed: 0,
      minutesUsed: 0,
      remainingSeconds: billing.secondsRemaining,
      remainingMinutes: Math.floor(billing.secondsRemaining / 60),
    });
    
  } catch (error) {
    console.error('💰 API /session/end - Error tracking session usage:', error);
    console.error('💰 API /session/end - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to track session usage' },
      { status: 500 }
    );
  }
} 
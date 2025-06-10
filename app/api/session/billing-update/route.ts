import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, secondsUsed } = body;
    
    if (!userId || typeof secondsUsed !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId and secondsUsed' },
        { status: 400 }
      );
    }
    
    // Only deduct if user actually used some time (minimum 1 second)
    if (secondsUsed >= 1) {
      const result = await BillingService.consumeSeconds(userId, secondsUsed);
      
      return NextResponse.json({
        success: result.success,
        secondsUsed,
        remainingSeconds: result.remainingSeconds,
        remainingMinutes: Math.floor(result.remainingSeconds / 60), // For display purposes
      });
    }
    
    // If less than 1 second, don't charge but return current status
    const billing = await BillingService.getUserBilling(userId);
    return NextResponse.json({
      success: true,
      secondsUsed: 0,
      remainingSeconds: billing.secondsRemaining,
      remainingMinutes: Math.floor(billing.secondsRemaining / 60),
    });
    
  } catch (error) {
    console.error('Error processing billing update:', error);
    return NextResponse.json(
      { error: 'Failed to process billing update' },
      { status: 500 }
    );
  }
} 
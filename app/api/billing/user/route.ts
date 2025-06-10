import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const billing = await BillingService.getUserBilling(userId);
    
    return NextResponse.json(billing);
    
  } catch (error) {
    console.error('Error getting user billing:', error);
    return NextResponse.json(
      { error: 'Failed to get user billing information' },
      { status: 500 }
    );
  }
} 
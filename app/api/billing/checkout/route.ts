import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';
import { CheckoutRequest } from '../../../types/billing';

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    
    // Validate required fields
    if (!body.priceId || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId and userId' },
        { status: 400 }
      );
    }

    // Create checkout with Paddle
    const checkout = await BillingService.createCheckout(body);
    
    return NextResponse.json(checkout);
    
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

// Get available price IDs for frontend
export async function GET() {
  try {
    const priceIds = BillingService.getPriceIds();
    return NextResponse.json(priceIds);
  } catch (error) {
    console.error('Error getting price IDs:', error);
    return NextResponse.json(
      { error: 'Failed to get price IDs' },
      { status: 500 }
    );
  }
} 
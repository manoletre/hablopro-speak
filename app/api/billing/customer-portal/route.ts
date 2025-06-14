import { NextRequest, NextResponse } from 'next/server';
import { CustomerPortalRequestBody } from '../../../types/billing';

export async function POST(request: NextRequest) {
  try {
    const { customerId, subscriptionIds } = await request.json();
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }

    // Paddle API base URL
    const baseUrl = process.env.PADDLE_ENVIRONMENT === 'production' 
      ? 'https://api.paddle.com' 
      : 'https://sandbox-api.paddle.com';

    // Prepare request body
    const requestBody: CustomerPortalRequestBody = {};
    if (subscriptionIds && subscriptionIds.length > 0) {
      requestBody.subscription_ids = subscriptionIds;
    }

    // Create customer portal session with Paddle API
    const response = await fetch(`${baseUrl}/customers/${customerId}/portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paddle API error:', response.status, errorText);
      throw new Error(`Paddle API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the portal URLs
    return NextResponse.json({
      overviewUrl: data.data.urls.general.overview,
      subscriptionUrls: data.data.urls.subscriptions || []
    });
    
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
} 
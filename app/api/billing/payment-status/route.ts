import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';

export async function POST(request: NextRequest) {
  try {
    const { userId, status, planType, amount } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await BillingService.updatePaymentStatus(userId, status, amount, planType);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await BillingService.clearPaymentStatus(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
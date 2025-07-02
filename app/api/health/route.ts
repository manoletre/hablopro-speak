import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';
import { BillingService } from '../../lib/billing';

export async function GET() {
  try {
    const checks = {
      database: false,
      paddle: false,
      environment: false,
      priceIds: false,
      timestamp: new Date().toISOString(),
    };

    const details = {
      environment: process.env.PADDLE_ENVIRONMENT,
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!process.env.PADDLE_API_KEY,
      hasWebhookSecret: !!process.env.PADDLE_WEBHOOK_SECRET,
      hasClientToken: !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      clientTokenPrefix: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.substring(0, 5) + '...',
      apiKeyPrefix: process.env.PADDLE_API_KEY?.substring(0, 8) + '...',
      priceIds: undefined as { payg: string; monthly: string; annual: string } | undefined,
    };

    // Check database connectivity
    try {
      await db.collection('health_check').doc('test').get();
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Paddle environment variables
    const requiredPaddleVars = [
      'PADDLE_API_KEY',
      'PADDLE_WEBHOOK_SECRET',
      'PADDLE_ENVIRONMENT',
    ];
    
    checks.paddle = requiredPaddleVars.every(varName => 
      process.env[varName] && process.env[varName] !== ''
    );

    // Check environment configuration
    checks.environment = process.env.NODE_ENV === 'production' ? 
      process.env.PADDLE_ENVIRONMENT === 'production' : true;

    // Validate price IDs are available
    try {
      const priceIds = BillingService.getPriceIds();
      checks.priceIds = !!(priceIds.payg && priceIds.monthly && priceIds.annual);
      details.priceIds = {
        payg: priceIds.payg,
        monthly: priceIds.monthly,
        annual: priceIds.annual
      };
    } catch (error) {
      console.error('Price ID check failed:', error);
      checks.priceIds = false;
    }

    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
      details,
      version: process.env.npm_package_version || 'unknown',
    }, {
      status: allHealthy ? 200 : 503,
    });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    }, {
      status: 500,
    });
  }
} 
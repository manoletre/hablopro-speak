import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

export async function GET() {
  try {
    const checks = {
      database: false,
      paddle: false,
      environment: false,
      timestamp: new Date().toISOString(),
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

    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
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
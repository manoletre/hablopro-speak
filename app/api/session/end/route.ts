import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '../../../lib/billing';
import { db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionDuration, sessionId } = body; // sessionDuration in seconds, sessionId for deduplication
    
    console.log('💰 API /session/end called with:', { userId, sessionDuration, sessionId });
    
    if (!userId || typeof sessionDuration !== 'number') {
      console.log('💰 API /session/end - Invalid request data');
      return NextResponse.json(
        { error: 'Missing required fields: userId and sessionDuration' },
        { status: 400 }
      );
    }
    
    // Generate a session ID if not provided (for backward compatibility)
    const effectiveSessionId = sessionId || `${userId}-${Date.now()}-${Math.random()}`;
    
    // Check if this session has already been billed to prevent duplicate charges
    if (sessionId) {
      try {
        const billedSessionRef = db.collection('users').doc(userId).collection('billed_sessions').doc(sessionId);
        const billedSessionDoc = await billedSessionRef.get();
        
        if (billedSessionDoc.exists) {
          const existingData = billedSessionDoc.data();
          console.log(`💰 API /session/end - Session ${sessionId} already billed, returning existing data`);
          return NextResponse.json({
            success: true,
            secondsUsed: existingData!.secondsUsed,
            secondsRequested: existingData!.secondsRequested,
            minutesUsed: Math.round((existingData!.secondsUsed || 0) / 60 * 100) / 100,
            remainingSeconds: existingData!.remainingSecondsAfter,
            remainingMinutes: Math.floor((existingData!.remainingSecondsAfter || 0) / 60),
            alreadyBilled: true
          });
        }
      } catch (deduplicationError) {
        console.error('💰 API /session/end - Error checking session deduplication:', deduplicationError);
        // Continue with billing if deduplication check fails to avoid blocking legitimate sessions
      }
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
      
      // Mark this session as billed to prevent future duplicate charges
      if (sessionId) {
        try {
          const billedSessionRef = db.collection('users').doc(userId).collection('billed_sessions').doc(sessionId);
          await billedSessionRef.set({
            secondsUsed: actualSecondsUsed,
            secondsRequested: secondsUsed,
            remainingSecondsAfter: result.remainingSeconds,
            billedAt: new Date(),
            sessionDuration: sessionDuration,
            // Auto-delete after 7 days to keep collection clean
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          console.log(`💰 API /session/end - Marked session ${sessionId} as billed`);
        } catch (markingError) {
          console.error('💰 API /session/end - Error marking session as billed:', markingError);
          // Non-blocking error - log but continue
        }
      }
      
      return NextResponse.json({
        success: result.success,
        secondsUsed: actualSecondsUsed,
        secondsRequested: secondsUsed, // What was originally requested
        minutesUsed: Math.round(actualSecondsUsed / 60 * 100) / 100, // For display purposes
        remainingSeconds: result.remainingSeconds,
        remainingMinutes: Math.floor(result.remainingSeconds / 60), // For display purposes
        alreadyBilled: false
      });
    }
    
    // If less than 5 seconds, don't charge but return current status
    console.log(`💰 API /session/end - Session too short (${secondsUsed}s), not billing`);
    const billing = await BillingService.getUserBilling(userId);
    
    // Still mark short sessions as "billed" (with 0 seconds) to prevent duplicate attempts
    if (sessionId) {
      try {
        const billedSessionRef = db.collection('users').doc(userId).collection('billed_sessions').doc(sessionId);
        await billedSessionRef.set({
          secondsUsed: 0,
          secondsRequested: secondsUsed,
          remainingSecondsAfter: billing.secondsRemaining,
          billedAt: new Date(),
          sessionDuration: sessionDuration,
          reason: 'too_short',
          // Auto-delete after 7 days to keep collection clean
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        console.log(`💰 API /session/end - Marked short session ${sessionId} as processed`);
      } catch (markingError) {
        console.error('💰 API /session/end - Error marking short session:', markingError);
        // Non-blocking error - log but continue
      }
    }
    
    return NextResponse.json({
      success: true,
      secondsUsed: 0,
      minutesUsed: 0,
      remainingSeconds: billing.secondsRemaining,
      remainingMinutes: Math.floor(billing.secondsRemaining / 60),
      alreadyBilled: false
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
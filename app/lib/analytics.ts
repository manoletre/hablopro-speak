/**
 * Analytics utilities for tracking events in the application
 */

import posthog from 'posthog-js';

// Event name constants - following UPPERCASE_WITH_UNDERSCORE convention
export const ANALYTICS_EVENTS = {
  SESSION_COMPLETED: 'session_completed',
  SESSION_STARTED: 'session_started',
  USER_IDENTIFIED: 'user_identified',
  DAILY_ACTIVE_USER: 'daily_active_user'
};

type SessionEventProperties = {
  language: string;
  difficulty_level: number;
  conversation_length?: number;
  duration_minutes?: number;
};

/**
 * Track when a user completes a session
 */
export function trackSessionCompleted(
  userId: string | null,
  properties: SessionEventProperties,
  userProps?: { email?: string; name?: string }
) {
  if (userId) {
    posthog.capture(ANALYTICS_EVENTS.SESSION_COMPLETED, {
      distinct_id: userId,
      ...properties,
      $set: userProps
    });
    
    // Also mark this user as active today
    trackDailyActiveUser(userId, userProps);
  } else {
    posthog.capture(ANALYTICS_EVENTS.SESSION_COMPLETED, properties);
  }
}

/**
 * Track when a user starts a session
 */
export function trackSessionStarted(
  userId: string | null,
  properties: SessionEventProperties
) {
  if (userId) {
    posthog.capture(ANALYTICS_EVENTS.SESSION_STARTED, {
      distinct_id: userId,
      ...properties
    });
  } else {
    posthog.capture(ANALYTICS_EVENTS.SESSION_STARTED, properties);
  }
}

/**
 * Track a user as a daily active user
 * This is specifically what we use to count DAUs
 */
export function trackDailyActiveUser(
  userId: string,
  userProps?: { email?: string; name?: string }
) {
  posthog.capture(ANALYTICS_EVENTS.DAILY_ACTIVE_USER, {
    distinct_id: userId,
    $set: userProps
  });
}

/**
 * Identify a user with their Firebase ID
 */
export function identifyUser(
  userId: string,
  userProps?: { email?: string; name?: string }
) {
  posthog.identify(userId, userProps);
  posthog.capture(ANALYTICS_EVENTS.USER_IDENTIFIED, {
    distinct_id: userId,
    $set: userProps
  });
} 
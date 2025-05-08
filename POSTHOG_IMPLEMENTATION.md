# PostHog Analytics Implementation Guide

This guide explains how we've implemented PostHog analytics to track daily active users (DAUs) in the HabloPro Speak application.

## Overview

We've integrated PostHog to track:

1. **Daily Active Users** - Users who complete at least one conversation session in a day
2. **Session Started Events** - When users begin a new conversation session
3. **Session Completed Events** - When users finish a conversation session
4. **User Identification** - Linking analytics events to specific Firebase users

## Setup

### 1. Environment Variables

Ensure your `.env.local` file includes these variables:

```
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=<ph_project_api_key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_PROJECT_ID=<ph_project_id>
```

Replace the placeholders with:
- `<ph_project_api_key>`: Your PostHog project API key
- `<ph_project_id>`: Your PostHog project ID (found in your PostHog project settings)

### 2. Implementation Details

We've implemented the following:

1. **Analytics Utility** (`app/lib/analytics.ts`):
   - Centralizes all analytics tracking
   - Implements consistent event naming and properties
   - Manages user identification

2. **Session Tracking**:
   - `VoiceChat.tsx`: Tracks session completion when a user finishes a conversation
   - `HomeScreen.tsx`: Tracks session start when a user initiates a conversation

3. **User Identification**:
   - When a user logs in via Firebase Auth, we identify them in PostHog
   - When a user logs out, we reset PostHog identification
   - All events include the user's Firebase UID as the `distinct_id`
   - User properties (email, name) are captured when available

4. **Admin Dashboard** (`app/admin/analytics/page.tsx`):
   - Provides direct access to PostHog dashboard
   - Shows key metrics and explanations
   - **Access Control**: Admin access is restricted to a specific user with UID: `IlLapv9gGqY7gKlDozNtDztbdkz1`

## Analytics Events

### Main Events

1. **`session_completed`**
   - Tracked when a user completes a conversation session
   - Properties:
     - `language`: The language the user practiced
     - `difficulty_level`: Difficulty level of the session
     - `conversation_length`: Number of messages exchanged
     - `duration_minutes`: Approximate duration of the session

2. **`session_started`**
   - Tracked when a user begins a new conversation session
   - Properties:
     - `language`: The language the user selected
     - `difficulty_level`: Difficulty level selected

3. **`daily_active_user`**
   - Tracked when a user completes a session
   - Used specifically for DAU calculations

4. **`user_identified`**
   - Tracked when a user is identified with their Firebase UID
   - Includes basic user properties for segmentation

## Viewing Analytics

1. Access the PostHog dashboard directly at https://us.posthog.com
2. Log in with your PostHog credentials
3. Navigate to your project
4. Go to Insights to create custom reports

### Key Insights to Create

1. **Daily Active Users**
   - Create a Trends insight
   - Select the "Active Users" chart type
   - Filter for the `daily_active_user` event

2. **Session Completion Rate**
   - Create a Trends insight
   - Compare counts of `session_started` vs `session_completed` events

3. **Language Popularity**
   - Create a breakdown of the `session_completed` event by the `language` property

4. **Average Session Duration**
   - Create an insight for `session_completed` events
   - Analyze the average of the `duration_minutes` property

## Notes for Developers

1. When adding new tracking, use the utility functions in `app/lib/analytics.ts`
2. Follow the naming convention for events: `UPPERCASE_WITH_UNDERSCORE` for event constants
3. Be consistent with property names across different events
4. Don't track PII or sensitive data

## Troubleshooting

If events aren't appearing in PostHog:

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Make sure ad blockers aren't preventing PostHog scripts from loading
4. Check the implementation of the PostHog reverse proxy in `next.config.ts` 
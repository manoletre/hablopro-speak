// Utility functions for time formatting and conversion

/**
 * Format seconds into a human-readable "Xm Ys" format
 * @param seconds - Total seconds to format
 * @returns Formatted string like "213m 40s" or "0m 30s"
 */
export function formatSecondsToMinutesAndSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Convert minutes to seconds
 * @param minutes - Number of minutes
 * @returns Number of seconds
 */
export function minutesToSeconds(minutes: number): number {
  return minutes * 60;
}

/**
 * Convert seconds to minutes (rounded down)
 * @param seconds - Number of seconds
 * @returns Number of minutes
 */
export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}

/**
 * Format seconds into a concise display format for billing widgets
 * Shows "Xm" for times over 1 minute, "Xs" for less than 1 minute
 * @param seconds - Total seconds to format
 * @returns Formatted string like "213m 40s" or "30s"
 */
export function formatSecondsForDisplay(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
} 
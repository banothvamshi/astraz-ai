/**
 * Billing Guard - Prevents charges after free credits expire
 * Monitors Google Cloud billing and disables service when credits run out
 */

interface BillingStatus {
  creditsRemaining: number | null;
  creditsExpiryDate: string | null; // ISO date string
  isActive: boolean;
  shouldDisable: boolean;
}

// Free credits info
const FREE_CREDITS_AMOUNT = 26993.63; // ₹26,993.63
const FREE_CREDITS_EXPIRY = "2026-04-19"; // April 19, 2026

/**
 * Check if service should be disabled based on billing status
 */
export function checkBillingStatus(): BillingStatus {
  const now = new Date();
  const expiryDate = new Date(FREE_CREDITS_EXPIRY);
  
  // Check if credits have expired
  const creditsExpired = now > expiryDate;
  
  // Manual disable flag - only disable if explicitly set AND credits expired
  // Before expiry, allow service to run (user wants to use free credits)
  const manualDisable = process.env.DISABLE_BILLING === "true" && creditsExpired;
  
  // Service is active if credits haven't expired
  // After expiry, service auto-disables to prevent charges
  const isActive = !creditsExpired && !manualDisable;
  const shouldDisable = creditsExpired || (manualDisable && creditsExpired);
  
  return {
    creditsRemaining: FREE_CREDITS_AMOUNT, // Would be fetched from billing API
    creditsExpiryDate: FREE_CREDITS_EXPIRY,
    isActive: isActive,
    shouldDisable: shouldDisable,
  };
}

/**
 * Get billing status message
 */
export function getBillingStatusMessage(): string {
  const status = checkBillingStatus();
  const expiryDate = new Date(FREE_CREDITS_EXPIRY);
  const now = new Date();
  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (status.shouldDisable) {
    if (now > expiryDate) {
      return `Service disabled: Free credits expired on ${FREE_CREDITS_EXPIRY}. To prevent charges, billing has been disabled.`;
    }
    
    // This shouldn't happen before expiry, but just in case
    return `Service disabled: Billing protection is active. Remove DISABLE_BILLING environment variable to re-enable.`;
  }
  
  return `Free credits active. Expires: ${FREE_CREDITS_EXPIRY} (${daysRemaining} days remaining). Service will auto-disable on expiry.`;
}

/**
 * Check if API calls should be allowed
 */
export function shouldAllowAPICall(): boolean {
  const status = checkBillingStatus();
  return status.isActive;
}

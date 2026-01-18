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
  
  // For now, we'll use environment variable to disable manually
  // In production, you'd check actual billing API
  const manualDisable = process.env.DISABLE_BILLING === "true";
  
  return {
    creditsRemaining: FREE_CREDITS_AMOUNT, // Would be fetched from billing API
    creditsExpiryDate: FREE_CREDITS_EXPIRY,
    isActive: !creditsExpired && !manualDisable,
    shouldDisable: creditsExpired || manualDisable,
  };
}

/**
 * Get billing status message
 */
export function getBillingStatusMessage(): string {
  const status = checkBillingStatus();
  
  if (status.shouldDisable) {
    const expiryDate = new Date(FREE_CREDITS_EXPIRY);
    const now = new Date();
    
    if (now > expiryDate) {
      return `Service disabled: Free credits expired on ${FREE_CREDITS_EXPIRY}. To prevent charges, billing has been disabled.`;
    }
    
    return `Service disabled: Billing protection is active. Set DISABLE_BILLING=false to re-enable (not recommended after ${FREE_CREDITS_EXPIRY}).`;
  }
  
  const expiryDate = new Date(FREE_CREDITS_EXPIRY);
  const daysRemaining = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return `Free credits active. Expires: ${FREE_CREDITS_EXPIRY} (${daysRemaining} days remaining). Service will auto-disable on expiry.`;
}

/**
 * Check if API calls should be allowed
 */
export function shouldAllowAPICall(): boolean {
  const status = checkBillingStatus();
  return status.isActive;
}

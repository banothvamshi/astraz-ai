/**
 * Cost Optimization - Track and optimize API usage to stay within free credits
 * ₹26,993.63 free credits until April 19, 2026
 */

interface CostEstimate {
  tokensUsed: number;
  estimatedCost: number; // in INR
  modelUsed: string;
}

// Cost per 1M tokens (approximate, varies by model)
const COST_PER_MILLION_TOKENS: Record<string, number> = {
  "gemini-2.0-flash": 0.075, // $0.075 per 1M input tokens (very cheap)
  "gemini-2.0-flash-001": 0.075,
  "gemini-2.5-flash": 0.10, // Slightly more expensive
  "gemini-flash-latest": 0.10,
  "gemini-2.0-flash-lite": 0.05, // Cheapest
  "gemini-pro-latest": 0.50, // More expensive
  "gemini-2.5-pro": 0.50,
};

// Exchange rate (approximate)
const USD_TO_INR = 83; // Approximate

/**
 * Estimate cost for a generation request
 */
export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  modelName: string
): CostEstimate {
  const costPerMillion = COST_PER_MILLION_TOKENS[modelName] || 0.10; // Default to flash pricing
  const totalTokens = inputTokens + outputTokens;
  
  // Cost in USD
  const costUSD = (totalTokens / 1_000_000) * costPerMillion;
  // Convert to INR
  const costINR = costUSD * USD_TO_INR;

  return {
    tokensUsed: totalTokens,
    estimatedCost: costINR,
    modelUsed: modelName,
  };
}

/**
 * Check if we're within budget
 */
export function isWithinBudget(estimatedCost: number): boolean {
  const FREE_CREDITS = 26993.63; // ₹26,993.63
  // For now, we'll track this in memory (in production, use database)
  // This is a simple check - in production, track actual spending
  return estimatedCost < FREE_CREDITS;
}

/**
 * Get cost optimization recommendations
 */
export function getCostOptimizationTips(): string[] {
  return [
    "Using gemini-2.0-flash for optimal cost/quality balance",
    "Caching enabled - duplicate requests use cache (free)",
    "Response caching reduces API calls by up to 80%",
    "Monitor usage at /api/billing-status",
    "Free credits expire: April 19, 2026",
  ];
}

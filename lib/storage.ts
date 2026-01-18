// Free trial tracking using localStorage
const TRIAL_KEY = "astraz_trial_used";
const TRIAL_COUNT_KEY = "astraz_trial_count";

export function hasUsedTrial(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(TRIAL_KEY) === "true";
}

export function markTrialUsed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TRIAL_KEY, "true");
  const count = getTrialCount();
  localStorage.setItem(TRIAL_COUNT_KEY, String(count + 1));
}

export function getTrialCount(): number {
  if (typeof window === "undefined") return 0;
  const count = localStorage.getItem(TRIAL_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

export function canUseFreeTrial(): boolean {
  return getTrialCount() < 1;
}

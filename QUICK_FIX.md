# 🚨 QUICK FIX: Service Disabled Error

## Problem
Getting error: "Service disabled: Billing protection is active"

## Solution

### Option 1: Remove DISABLE_BILLING Environment Variable (Recommended)

1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Find `DISABLE_BILLING`
4. **Delete it** (or set it to `false`)
5. **Redeploy** your project

### Option 2: Set DISABLE_BILLING=false

1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Update `DISABLE_BILLING` = `false`
4. **Redeploy** your project

## Why This Happened

The billing protection was set to disable the service. Since you want to **USE** your free credits (not disable), you need to remove or set `DISABLE_BILLING=false`.

## After Fix

- Service will work normally
- Uses your free credits (₹26,993.63)
- Will auto-disable on April 19, 2026
- No charges until then

## Verify

After redeploying, visit:
- `https://your-domain.com/api/billing-status`
- Should show: "Free credits active"

Then try generating a resume - it should work!

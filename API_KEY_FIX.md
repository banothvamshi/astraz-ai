# 🔴 CRITICAL: Fix Your Gemini API Key (404 Errors)

## The Problem
All Gemini models are returning 404 errors. This means your API key **doesn't have access** to the models.

## Root Cause
Your API key from [https://aistudio.google.com/app/api-keys](https://aistudio.google.com/app/api-keys) is likely:
1. **Associated with a project that has billing enabled** (even if you didn't set it up)
2. **Missing required API permissions**
3. **Not properly configured for free tier**

## ✅ SOLUTION: Create a NEW Free-Tier API Key

### Step 1: Create a NEW Google Cloud Project (NO BILLING)
1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Name it: `astraz-ai-free` (or any name)
4. **IMPORTANT**: Do NOT add a billing account
5. Click **"Create"**

### Step 2: Enable Required APIs
1. In your new project, go to: **APIs & Services** → **Library**
2. Search for: **"Generative Language API"**
3. Click **"Enable"**
4. Also enable: **"Gemini API"** (if available)

### Step 3: Create API Key in AI Studio
1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Select your **NEW project** (the one WITHOUT billing)
4. Click **"Create API key in new project"** or select your project
5. **Copy the API key** (starts with `AIza...`)

### Step 4: Verify It's Free Tier
- The key should work WITHOUT billing
- Check: https://console.cloud.google.com/apis/credentials
- Your API key should NOT show billing information

### Step 5: Update Vercel Environment Variable
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update: `GOOGLE_GEMINI_API_KEY` = your NEW API key
3. Make sure it's set for **Production**, **Preview**, and **Development**
4. **Redeploy** your project

## 🧪 Test Your API Key

After deploying, visit:
```
https://your-domain.com/api/test-gemini
```

This will test all models and show which one works.

## ✅ Expected Result

You should see:
- ✅ One of the models working (likely `gemini-1.5-flash`)
- ✅ Successful API response
- ✅ No more 404 errors

## ⚠️ Common Mistakes

1. **Using old API key** - Must create NEW one in project WITHOUT billing
2. **Not enabling APIs** - Must enable "Generative Language API"
3. **Wrong project** - Must use project WITHOUT billing account
4. **Not redeploying** - Must redeploy after updating env var

## 📝 Model Names That Should Work (Free Tier)

- `gemini-1.5-flash` ✅ (Most likely to work)
- `gemini-1.5-pro` ✅ (If available)
- `gemini-pro` ✅ (Legacy, should work)

## 🆘 Still Not Working?

1. **Check API key format**: Should start with `AIza` and be ~39 characters
2. **Verify no billing**: Project should show "No billing account"
3. **Check API enabled**: Generative Language API must be enabled
4. **Wait a few minutes**: API key changes can take 1-2 minutes to propagate
5. **Try test endpoint**: Visit `/api/test-gemini` to see detailed errors

## 💡 Why This Happens

Google AI Studio API keys can be created in two ways:
- **With billing** → Paid tier, models may require payment
- **Without billing** → Free tier, limited but free models

Your current key is likely associated with a project that has billing, so Google is trying to use paid models that don't exist or aren't accessible.

## ✅ Quick Checklist

- [ ] Created NEW Google Cloud project (NO billing)
- [ ] Enabled "Generative Language API"
- [ ] Created NEW API key in AI Studio
- [ ] Selected project WITHOUT billing
- [ ] Updated Vercel environment variable
- [ ] Redeployed application
- [ ] Tested with `/api/test-gemini`

Follow these steps exactly and your API key will work! 🚀

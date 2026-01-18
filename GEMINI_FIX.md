# Gemini API Model Fix Guide

## Issue
All Gemini models returning 404 errors. This is likely due to:
1. API key not having access to models
2. Wrong model names
3. API version mismatch

## Solution

### Step 1: Verify Your API Key
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key if needed
3. Make sure the API key is NOT restricted
4. Copy the full API key

### Step 2: Set Environment Variable
In your `.env.local` or Vercel environment variables:
```env
GOOGLE_GEMINI_API_KEY=your_full_api_key_here
```

### Step 3: Try Specific Model (Optional)
If automatic fallback doesn't work, set:
```env
GEMINI_MODEL=gemini-1.5-flash
```

### Step 4: Verify API Key Works
Test your API key with curl:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Common Issues

### Issue 1: API Key Invalid
- **Symptom**: 401 Unauthorized
- **Fix**: Regenerate API key at https://makersuite.google.com/app/apikey

### Issue 2: Model Not Found (404)
- **Symptom**: 404 Not Found for all models
- **Possible Causes**:
  - API key doesn't have access to Gemini models
  - API key is restricted
  - Wrong API endpoint
- **Fix**: 
  1. Check API key permissions
  2. Try creating a new API key
  3. Verify you're using the correct Google Cloud project

### Issue 3: Quota Exceeded
- **Symptom**: 429 Too Many Requests
- **Fix**: Wait or upgrade your quota

## Free Tier Models Available
- `gemini-1.5-flash` - Fast, free tier
- `gemini-1.5-pro` - More capable, free tier available
- `gemini-pro` - Legacy model

## Testing
After setting up, test the API:
1. Deploy to Vercel
2. Check logs for which model succeeded
3. If all fail, check API key validity

# Google Gemini API Setup (100% FREE)

## Why Google Gemini?

- ✅ **Completely FREE** - No credit card required
- ✅ **Generous Limits** - 60 requests per minute
- ✅ **High Quality** - Comparable to GPT-4
- ✅ **Fast** - Quick response times
- ✅ **Easy Setup** - Just need a Google account

## Step-by-Step Setup

### 1. Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. Select or create a Google Cloud project (or use default)
5. Copy your API key

### 2. Add to Environment Variables

Add this to your `.env.local` file:

```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### 3. That's It!

The app will automatically use Gemini for all AI generations.

## Free Tier Limits

- **60 requests per minute** - More than enough for most use cases
- **No daily limit** - Use as much as you need
- **No credit card** - Truly free

## Model Used

The app uses **Gemini 1.5 Flash** which is:
- Fast and efficient
- High quality outputs
- Perfect for text generation
- Free tier eligible

You can change the model in `lib/gemini.ts` if needed.

## Troubleshooting

### API Key Not Working?

1. Make sure you copied the entire key (it's long!)
2. Check there are no extra spaces in `.env.local`
3. Restart your dev server after adding the key

### Rate Limit Errors?

- Free tier allows 60 requests/minute
- If you hit this, wait a minute and try again
- Consider upgrading to paid tier if needed (very affordable)

## Alternative: Use Different Gemini Model

If you want to use a different model, edit `lib/gemini.ts`:

```typescript
const model = gemini.getGenerativeModel({
  model: "gemini-1.5-pro", // or "gemini-pro", etc.
  // ...
});
```

Check available models at [Google AI Studio](https://aistudio.google.com/app/apikey)

---

**Note**: Google Gemini is completely free for this use case. No payment required! 🎉

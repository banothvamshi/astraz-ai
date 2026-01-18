# Astraz AI - Setup Guide

## Quick Start

Follow these steps to get Astraz AI running locally.

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini Configuration (FREE)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings** → **API** to get your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Go to **SQL Editor** and run the SQL from `supabase-schema.sql`
4. This creates the necessary tables and RLS policies

### 3. Google Gemini Setup (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key and add it to your `.env.local` as `GOOGLE_GEMINI_API_KEY`

**Note**: 
- Google Gemini has a generous **FREE tier** (60 requests/minute)
- The app uses `gemini-1.5-flash` which is fast and high-quality
- No credit card required for free tier
- You can change the model in `lib/gemini.ts` if needed

### 4. Razorpay Setup

1. Go to [razorpay.com](https://razorpay.com) and create an account
2. Go to **Settings** → **API Keys**
3. Generate test keys (for development) or live keys (for production)
4. Add them to your `.env.local`:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same as KEY_ID)

**Test Mode**: Use test keys during development. Test card: `4111 1111 1111 1111`

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing the Application

### Free Trial Flow

1. Go to the landing page
2. Click "Try Free - No Signup"
3. Upload a PDF resume
4. Paste a job description
5. Click "Generate Resume & Cover Letter"
6. Download the generated PDFs

### Payment Flow (Test Mode)

1. After using the free trial, try generating again
2. Paywall modal should appear
3. Click "Upgrade Now"
4. Use Razorpay test card: `4111 1111 1111 1111`
5. Any future expiry date and CVV
6. Payment should succeed and mark you as premium

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy!

### Environment Variables for Production

Make sure to:
- Use **live** Razorpay keys (not test keys)
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Supabase project (or same one)

## Troubleshooting

### PDF Upload Not Working

- Ensure the file is a valid PDF
- Check file size (max 10MB recommended)
- Verify `pdf-parse` is installed

### OpenAI API Errors

- Check your API key is correct
- Ensure you have credits in your OpenAI account
- Check rate limits

### Razorpay Payment Not Loading

- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Check browser console for errors
- Ensure Razorpay script loads (check Network tab)

### Supabase Errors

- Verify your Supabase URL and keys
- Check RLS policies are set correctly
- Ensure tables are created

## Architecture Decisions

### Why Next.js 16?
- App Router for better performance
- Server Components for SEO
- API Routes for backend logic
- Edge-ready for fast deployments

### Why Supabase?
- PostgreSQL database
- Built-in authentication
- Row Level Security
- Real-time capabilities
- Free tier generous

### Why OpenAI GPT-4o-mini?
- Cost-effective ($0.15/1M input tokens)
- High quality outputs
- Fast response times
- Good for text generation

### Why Razorpay?
- Best for Indian market
- Supports UPI, Cards, Net Banking
- Easy integration
- Good documentation

### Why Tailwind + shadcn/ui?
- Rapid development
- Consistent design system
- Accessible components
- Easy customization

## Next Steps

- Add user authentication (Supabase Auth)
- Add email notifications
- Add analytics tracking
- Add more AI models as options
- Add resume templates
- Add cover letter templates

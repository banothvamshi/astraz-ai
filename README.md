# Astraz AI - Resume & Cover Letter Generator

A production-ready SaaS application that helps users create ATS-optimized resumes and cover letters using AI.

## Features

- 🚀 **AI-Powered Generation**: Uses Google Gemini (FREE) to generate tailored resumes and cover letters
- 📄 **PDF Processing**: Upload PDF resumes and download professional PDF outputs
- 🎯 **ATS Optimization**: Resumes optimized to pass Applicant Tracking Systems
- 💳 **Payment Integration**: Razorpay integration for Indian customers (UPI, Cards, Net Banking)
- 🆓 **Free Trial**: One free generation per user (tracked via localStorage)
- 🎨 **Modern UI**: Beautiful, minimalist design with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database & Auth**: Supabase (PostgreSQL)
- **AI**: Google Gemini 1.5 Flash (Free Tier)
- **Payments**: Razorpay
- **PDF Processing**: pdf-parse, jsPDF
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key (FREE - get from Google AI Studio)
- Razorpay account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd astraz-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API key (FREE from Google AI Studio)
- `RAZORPAY_KEY_ID`: Your Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay key secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Same as RAZORPAY_KEY_ID (for client-side)

4. Set up Supabase database:
   - Go to your Supabase project
   - Open SQL Editor
   - Run the SQL from `supabase-schema.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
astraz-ai/
├── app/
│   ├── api/
│   │   ├── generate/          # AI generation endpoint
│   │   ├── download-pdf/      # PDF generation endpoint
│   │   ├── create-order/      # Razorpay order creation
│   │   └── verify-payment/    # Payment verification
│   ├── dashboard/             # Main dashboard page
│   ├── payment/               # Payment page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Landing page
│   └── globals.css            # Global styles
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── paywall-modal.tsx      # Premium upgrade modal
│   └── upload-area.tsx        # File upload component
├── lib/
│   ├── openai.ts              # OpenAI client
│   ├── supabase.ts            # Supabase client
│   ├── storage.ts             # LocalStorage utilities
│   └── utils.ts               # Utility functions
└── supabase-schema.sql        # Database schema
```

## Features Explained

### Free Trial System
- Uses localStorage to track trial usage
- Each user gets 1 free generation
- After that, paywall modal appears

### Payment Flow
1. User clicks "Upgrade" → Redirected to `/payment`
2. Order created via `/api/create-order`
3. Razorpay checkout opens
4. Payment verified via `/api/verify-payment`
5. User marked as premium (localStorage + Supabase)

### AI Generation
1. User uploads PDF resume
2. PDF parsed using `pdf-parse`
3. Resume text + Job description sent to OpenAI
4. Two separate prompts generate:
   - ATS-optimized resume
   - Personalized cover letter
5. Results returned as markdown
6. Converted to PDF on download

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- Supabase credentials
- OpenAI API key
- Razorpay credentials

## Pricing

- **Free**: 1 generation per user
- **Premium**: ₹299 one-time payment for lifetime access

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

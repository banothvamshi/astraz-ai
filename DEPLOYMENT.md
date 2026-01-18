# Astraz AI - Production Deployment Guide

## 🚀 Deploy to Vercel with Custom Domain (astrazai.com)

### Prerequisites
- ✅ Domain purchased from Namecheap: `astrazai.com`
- ✅ GitHub account
- ✅ Vercel account (free tier works)
- ✅ All API keys ready (Gemini, Supabase, Razorpay)

---

## Step 1: Prepare Your Code

### 1.1 Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Astraz AI production ready"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/astraz-ai.git
git branch -M main
git push -u origin main
```

### 1.2 Update Environment Variables

Make sure your `.env.local` has all production values:
- `GOOGLE_GEMINI_API_KEY` ✅
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `RAZORPAY_KEY_ID` (use LIVE keys, not test)
- `RAZORPAY_KEY_SECRET` (use LIVE keys, not test)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (use LIVE keys)
- `NEXT_PUBLIC_APP_URL=https://astrazai.com`

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New Project"**
4. Import your `astraz-ai` repository
5. Click **"Import"**

### 2.2 Configure Build Settings

Vercel auto-detects Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

### 2.3 Add Environment Variables

In Vercel project settings, add ALL these variables:

```
GOOGLE_GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RAZORPAY_KEY_ID=your_live_razorpay_key_id
RAZORPAY_KEY_SECRET=your_live_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_live_razorpay_key_id
NEXT_PUBLIC_APP_URL=https://astrazai.com
```

**Important**: 
- Use **LIVE** Razorpay keys (not test keys)
- Make sure `NEXT_PUBLIC_APP_URL` matches your domain

### 2.4 Deploy

Click **"Deploy"** and wait for build to complete (~2-3 minutes)

You'll get a URL like: `astraz-ai.vercel.app`

---

## Step 3: Configure Custom Domain (astrazai.com)

### 3.1 Add Domain in Vercel

1. Go to your project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `astrazai.com`
4. Also add: `www.astrazai.com` (for www version)
5. Click **"Add"**

Vercel will show you DNS records to add.

### 3.2 Configure DNS in Namecheap

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to **Domain List** → Click **"Manage"** next to `astrazai.com`
3. Go to **Advanced DNS** tab

#### Add These Records:

**For Root Domain (astrazai.com):**
```
Type: A Record
Host: @
Value: 76.76.21.21
TTL: Automatic

Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

**OR Use Vercel's Nameservers (Recommended):**

1. In Namecheap, go to **Domain** → **Nameservers**
2. Select **"Custom DNS"**
3. Add Vercel nameservers (shown in Vercel dashboard):
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

### 3.3 Wait for DNS Propagation

- Usually takes 5-30 minutes
- Can take up to 24 hours (rare)
- Check status in Vercel dashboard

### 3.4 Verify SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt. Wait a few minutes after DNS propagates.

---

## Step 4: Configure Supabase for Production

### 4.1 Update Supabase Settings

1. Go to Supabase project → **Settings** → **API**
2. Add your domain to **Allowed URLs**:
   - `https://astrazai.com`
   - `https://www.astrazai.com`

### 4.2 Update RLS Policies (if needed)

Ensure your RLS policies allow public access where needed.

---

## Step 5: Configure Razorpay for Production

### 5.1 Switch to Live Mode

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Generate **LIVE** keys (not test keys)
4. Update environment variables in Vercel with LIVE keys

### 5.2 Add Webhook URL (Optional but Recommended)

1. In Razorpay Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://astrazai.com/api/verify-payment`
3. Select events: `payment.captured`, `payment.failed`

---

## Step 6: Final Checks

### 6.1 Test Your Site

Visit `https://astrazai.com` and test:
- ✅ Landing page loads
- ✅ Dashboard works
- ✅ PDF upload works
- ✅ Generation works
- ✅ PDF download works
- ✅ Payment flow works (test with small amount first!)

### 6.2 Performance Optimization

Vercel automatically:
- ✅ CDN caching
- ✅ Edge functions
- ✅ Image optimization
- ✅ Automatic HTTPS

### 6.3 Monitor Your Site

- **Vercel Analytics**: Enable in project settings (free tier available)
- **Error Tracking**: Consider adding Sentry (optional)
- **Uptime Monitoring**: Use UptimeRobot (free) or similar

---

## Step 7: SEO & Marketing Setup

### 7.1 Update Metadata

Update `app/layout.tsx` with your production metadata:

```typescript
export const metadata: Metadata = {
  title: "Astraz AI - Beat ATS with AI-Powered Resumes",
  description: "Generate ATS-optimized resumes and cover letters. Upload your resume, paste the job description, and get perfectly tailored application materials.",
  keywords: "resume builder, ATS resume, cover letter generator, job application, resume optimization",
  openGraph: {
    title: "Astraz AI - Beat ATS with AI-Powered Resumes",
    description: "Generate ATS-optimized resumes and cover letters",
    url: "https://astrazai.com",
    siteName: "Astraz AI",
    type: "website",
  },
};
```

### 7.2 Add Google Analytics (Optional)

1. Create Google Analytics account
2. Get tracking ID
3. Add to `app/layout.tsx`:

```typescript
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
  strategy="afterInteractive"
/>
```

### 7.3 Submit to Search Engines

- **Google Search Console**: Submit sitemap
- **Bing Webmaster Tools**: Submit sitemap

---

## Step 8: Launch Checklist

- [ ] Domain configured and SSL active
- [ ] All environment variables set in Vercel
- [ ] Supabase configured for production
- [ ] Razorpay LIVE keys configured
- [ ] Tested full user flow
- [ ] Tested payment flow (with small amount)
- [ ] Error handling working
- [ ] Mobile responsive tested
- [ ] SEO metadata updated
- [ ] Analytics configured (optional)

---

## Troubleshooting

### Domain Not Working?

1. Check DNS propagation: [whatsmydns.net](https://www.whatsmydns.net)
2. Verify DNS records in Namecheap
3. Check Vercel domain status

### Build Fails?

1. Check build logs in Vercel
2. Verify all environment variables are set
3. Check for TypeScript errors locally: `npm run build`

### Payment Not Working?

1. Verify Razorpay LIVE keys (not test)
2. Check Razorpay dashboard for errors
3. Verify webhook URL if using webhooks

### PDF Generation Issues?

1. Check Gemini API key is valid
2. Verify API quota not exceeded
3. Check server logs in Vercel

---

## Cost Estimates

### Free Tier (Good for Starting)

- **Vercel**: Free (Hobby plan)
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Google Gemini**: Free (60 requests/minute)
- **Domain**: ~$10-15/year (Namecheap)

**Total**: ~$10-15/year

### When You Scale

- **Vercel Pro**: $20/month (when you need more)
- **Supabase Pro**: $25/month (when you exceed free tier)
- **Gemini**: Still free for most use cases

---

## Next Steps After Launch

1. **Marketing**: Share on social media, Reddit (r/resumes), LinkedIn
2. **Content**: Write blog posts about resume tips
3. **SEO**: Optimize for keywords like "ATS resume builder"
4. **Feedback**: Collect user feedback and iterate
5. **Analytics**: Monitor usage and optimize conversion

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables
4. Test locally first: `npm run dev`

---

**Congratulations! Your site is now live at astrazai.com! 🎉**

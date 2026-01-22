# Astraz AI - Professional Email Templates for Supabase

Go to **Supabase Dashboard** → **Authentication** → **Email Templates** and paste these:

---

## 1. Confirm Signup Email

**Subject:** Welcome to Astraz AI - Confirm Your Email ✨

**Message:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px 24px; border-radius: 16px; margin-bottom: 24px;">
                <span style="font-size: 32px;">✨</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Astraz AI</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 12px 0 0;">Your AI-Powered Resume Engineer</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">Thank you for joining Astraz AI! You're one click away from creating ATS-optimized resumes that land interviews.</p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">Confirm My Email</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">If you didn't create an account, you can safely ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">© 2026 Astraz AI. Engineered for Excellence.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password Email

**Subject:** Reset Your Astraz AI Password 🔐

**Message:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px 24px; border-radius: 16px; margin-bottom: 24px;">
                <span style="font-size: 32px;">🔐</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 12px 0 0;">Let's get you back into your account</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">We received a request to reset your password. Click the button below to create a new password.</p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">Reset Password</a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #fbbf24; font-size: 14px; margin: 0; text-align: center;">⏱️ This link expires in 1 hour</p>
              </div>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">If you didn't request this reset, please ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">© 2026 Astraz AI. Engineered for Excellence.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link Email

**Subject:** Your Astraz AI Login Link 🔗

**Message:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px 24px; border-radius: 16px; margin-bottom: 24px;">
                <span style="font-size: 32px;">🔗</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Magic Login Link</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 12px 0 0;">One click to access your account</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">Click the button below to securely sign in to your Astraz AI account. No password needed!</p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">Sign In Now</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">This link expires in 10 minutes.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">© 2026 Astraz AI. Engineered for Excellence.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Invite User Email

**Subject:** You're Invited to Astraz AI 🚀

**Message:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 16px 24px; border-radius: 16px; margin-bottom: 24px;">
                <span style="font-size: 32px;">🚀</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">You're Invited!</h1>
              <p style="color: #94a3b8; font-size: 16px; margin: 12px 0 0;">Join the AI-Powered Resume Revolution</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e2e8f0; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">You've been invited to join Astraz AI - the premier platform for creating ATS-optimized resumes that land interviews.</p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0f172a; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">Accept Invitation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 24px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #64748b; font-size: 13px; margin: 0;">© 2026 Astraz AI. Engineered for Excellence.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Important: URL Configuration

In **Supabase → Authentication → URL Configuration**, set:

| Setting | Value |
|---------|-------|
| Site URL | `https://astrazai.com` |
| Redirect URLs | `https://astrazai.com/auth/confirm` |
| | `https://astrazai.com/reset-password` |
| | `https://astrazai.com/dashboard` |

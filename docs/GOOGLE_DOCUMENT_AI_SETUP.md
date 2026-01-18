# Google Document AI Setup Guide

This guide explains how to configure Google Document AI for enhanced resume parsing in your application.

## Overview

Google Document AI provides superior OCR and document parsing capabilities compared to traditional PDF parsers. It can accurately extract text from both text-based and image-based PDFs, including scanned resumes.

## Prerequisites

1. **Google Cloud Project**: You need a GCP project with billing enabled
2. **Document AI API**: The Document AI API must be enabled for your project
3. **Service Account**: A service account with appropriate permissions

## Setup Steps

### 1. Enable Document AI API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Document AI API" and enable it

### 2. Create a Document AI Processor

1. Go to the [Document AI Console](https://console.cloud.google.com/ai/document-ai)
2. Click "Create Processor"
3. Choose the appropriate processor type:
   - For resumes: "Document OCR" or "Form Parser"
   - Location: Choose the closest region to your users (e.g., `us`, `eu`)
4. Give your processor a name (e.g., "resume-parser")
5. Click "Create"

### 3. Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "document-ai-service")
4. Grant the following roles:
   - "Document AI API User" (`roles/documentai.user`)
   - "Document AI Processor" (`roles/documentai.processor`)
5. Create and download the JSON key file

### 4. Configure Environment Variables

Add the following environment variables to your application:

```bash
# Required
GCP_PROJECT_ID=your-gcp-project-id
DOC_AI_PROCESSOR_ID=your-processor-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

# Optional
DOC_AI_LOCATION=us  # Default: 'us'
```

### 5. Deploy the Service Account Key

**For Development:**
- Place the JSON key file in your project directory
- Update `GOOGLE_APPLICATION_CREDENTIALS` with the relative path

**For Production (Vercel/Cloud Run):**
- Use environment variables to store the JSON content
- Create the credentials file at runtime from environment variables

Example for Vercel:
```bash
# Add the entire JSON content as an environment variable
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"..."}'
```

## Processor ID Format

The processor ID is the last part of the processor name. For example:
- Full processor name: `projects/your-project/locations/us/processors/1234567890123456789`
- Processor ID: `1234567890123456789`

## Testing the Setup

1. Restart your application
2. Check the console logs for initialization messages
3. Upload a resume to test the parsing

You should see logs like:
```
Google Document AI: Client initialized successfully
Attempting to parse PDF using Google Document AI...
Successfully parsed PDF using Google Document AI
```

## Fallback Behavior

If Google Document AI is not configured or fails, the system automatically falls back to the built-in PDF parser. This ensures your application continues to work even without Document AI setup.

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure the service account has the correct roles
   - Verify the Document AI API is enabled
   - Check that the processor ID is correct

2. **Authentication Failed**
   - Verify the service account key file path
   - Ensure the JSON key file is valid
   - Check file permissions

3. **Processor Not Found**
   - Verify the processor ID is correct
   - Ensure the processor exists in the specified location
   - Check that the project ID is correct

4. **Quota Exceeded**
   - Check your Document AI quota limits
   - Consider upgrading your quota if needed

### Debug Mode

Set `NODE_ENV=development` to see detailed error messages and debugging information.

## Cost Considerations

- Document AI pricing is based on pages processed
- Free tier: First 1000 pages per month (varies by region)
- Monitor your usage in the Google Cloud Console
- Consider implementing usage limits for cost control

## Security Best Practices

1. Never commit service account keys to version control
2. Use environment variables in production
3. Rotate service account keys regularly
4. Limit service account permissions to minimum required
5. Monitor API usage for unusual activity

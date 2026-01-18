import { ParsedResume } from './pdf-parser';

export interface DocumentAIProvider {
  name: string;
  isAvailable(): boolean;
  parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume>;
}

export class GoogleDocumentAIProvider implements DocumentAIProvider {
  name = 'Google Document AI';
  
  private projectId?: string;
  private location?: string;
  private processorId?: string;
  private client?: any;

  constructor() {
    this.loadCredentials();
  }

  private loadCredentials() {
    try {
      // Check for required environment variables
      this.projectId = process.env.GCP_PROJECT_ID;
      this.location = process.env.DOC_AI_LOCATION || 'us';
      this.processorId = process.env.DOC_AI_PROCESSOR_ID;
      
      // Check for credentials file
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!this.projectId || !this.processorId) {
        console.warn('Google Document AI: Missing GCP_PROJECT_ID or DOC_AI_PROCESSOR_ID environment variables');
        return;
      }

      if (!credentialsPath) {
        console.warn('Google Document AI: Missing GOOGLE_APPLICATION_CREDENTIALS environment variable');
        return;
      }

      // Import and initialize the client
      // Note: @google-cloud/documentai is optional - gracefully skip if not available
      try {
        // Safely require the package
        let DocumentProcessorServiceClient;
        try {
          const pkg = require('@google-cloud/documentai');
          DocumentProcessorServiceClient = pkg.v1?.DocumentProcessorServiceClient;
        } catch (e) {
          // Package not installed - this is OK, it's optional
          console.info('Google Document AI: Package not installed (optional). Install @google-cloud/documentai to use this provider.');
          return;
        }
        
        if (!DocumentProcessorServiceClient) {
          console.warn('Google Document AI: Could not find DocumentProcessorServiceClient');
          return;
        }
        
        this.client = new DocumentProcessorServiceClient({
          keyFilename: credentialsPath,
        });
        console.log('Google Document AI: Client initialized successfully');
      } catch (initError: any) {
        console.warn('Google Document AI: Failed to initialize client:', initError.message);
        this.client = undefined;
      }
    } catch (error: any) {
      console.warn('Google Document AI: Failed to load credentials:', error.message);
      this.client = undefined;
    }
  }

  isAvailable(): boolean {
    return !!(this.client && this.projectId && this.processorId);
  }

  async parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume> {
    if (!this.isAvailable()) {
      throw new Error('Google Document AI is not properly configured');
    }

    try {
      const name = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
      
      // Convert buffer to base64 for the API
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const request = {
        name,
        rawDocument: {
          content: pdfBase64,
          mimeType: 'application/pdf',
        },
      };

      console.log('Google Document AI: Processing document...');
      const [result] = await this.client.processDocument(request);
      
      // Extract text from the response
      const { document } = result;
      let extractedText = '';
      
      if (document.text) {
        extractedText = document.text;
      } else {
        // Fallback to extracting text from pages
        for (const page of document.pages || []) {
          for (const paragraph of page.paragraphs || []) {
            const paragraphText = this.getTextFromLayout(paragraph.layout, document);
            if (paragraphText) {
              extractedText += paragraphText + '\n\n';
            }
          }
        }
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text extracted from Document AI');
      }

      // Extract metadata if available
      const metadata: any = {};
      if (document.properties) {
        // Extract any document properties
      }

      return {
        text: extractedText.trim(),
        pages: document.pages?.length || 1,
        metadata: {
          title: metadata.title,
          author: metadata.author,
          subject: metadata.subject,
        },
      };
    } catch (error: any) {
      console.error('Google Document AI processing error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Google Document AI permission denied. Check your service account permissions and ensure the Document AI API is enabled.');
      } else if (error.message.includes('NOT_FOUND')) {
        throw new Error('Google Document AI processor not found. Check your DOC_AI_PROCESSOR_ID and GCP_PROJECT_ID.');
      } else if (error.message.includes('UNAUTHENTICATED')) {
        throw new Error('Google Document AI authentication failed. Check your GOOGLE_APPLICATION_CREDENTIALS path.');
      } else {
        throw new Error(`Google Document AI processing failed: ${error.message}`);
      }
    }
  }

  private getTextFromLayout(layout: any, document: any): string {
    if (!layout) return '';
    
    let text = '';
    if (layout.textAnchor?.textSegments) {
      for (const segment of layout.textAnchor.textSegments) {
        const startIndex = segment.startIndex || 0;
        const endIndex = segment.endIndex || document.text.length;
        text += document.text.substring(startIndex, endIndex);
      }
    }
    return text;
  }
}

export class FallbackPDFParser implements DocumentAIProvider {
  name = 'Fallback PDF Parser';
  
  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  async parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume> {
    // Import the original parser dynamically
    const { parseResumePDF: originalParser } = await import('./pdf-parser');
    return originalParser(pdfBuffer);
  }
}

export class DocumentAIService {
  private providers: DocumentAIProvider[] = [];

  constructor() {
    // Initialize providers in order of preference
    this.providers.push(new GoogleDocumentAIProvider());
    this.providers.push(new FallbackPDFParser());
  }

  async parseResumePDF(pdfBuffer: Buffer): Promise<ParsedResume> {
    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        if (provider.isAvailable()) {
          console.log(`Attempting to parse PDF using ${provider.name}...`);
          const result = await provider.parseResumePDF(pdfBuffer);
          console.log(`Successfully parsed PDF using ${provider.name}`);
          return result;
        }
      } catch (error: any) {
        console.warn(`${provider.name} failed:`, error.message);
        lastError = error;
        continue;
      }
    }

    // If all providers failed, throw the last error
    throw lastError || new Error('All document parsing providers failed');
  }

  getAvailableProviders(): string[] {
    return this.providers
      .filter(provider => provider.isAvailable())
      .map(provider => provider.name);
  }
}

// Export singleton instance
export const documentAIService = new DocumentAIService();

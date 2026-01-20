/**
 * Astraz AI Email Configuration
 * 
 * Different sender addresses for different scenarios:
 * - info@astrazai.com: General notifications, authentication
 * - hello@astrazai.com: User outreach, campaigns
 * - support@astrazai.com: Support tickets, error reports
 */

export const EMAIL_CONFIG = {
    // Authentication & general notifications
    auth: {
        from: "Astraz AI <info@astrazai.com>",
        replyTo: "info@astrazai.com",
    },

    // Verification emails (password reset, email confirm)
    verification: {
        from: "Astraz AI <info@astrazai.com>",
        senderName: "Astraz AI",
        replyTo: "info@astrazai.com",
    },

    // Contact form inquiries
    contactForm: {
        to: "info@astrazai.com",
        from: "Astraz AI Contact <info@astrazai.com>",
        replyTo: "info@astrazai.com",
    },

    // User outreach & campaigns
    outreach: {
        from: "Astraz AI <hello@astrazai.com>",
        replyTo: "hello@astrazai.com",
    },

    // Support tickets & error reports
    support: {
        from: "Astraz AI Support <support@astrazai.com>",
        replyTo: "support@astrazai.com",
    },

    // Default fallback
    default: {
        from: "Astraz AI <info@astrazai.com>",
        replyTo: "info@astrazai.com",
    },
};

export type EmailType = "auth" | "verification" | "contactForm" | "outreach" | "support" | "default";

export function getEmailConfig(type: EmailType = "default") {
    return EMAIL_CONFIG[type] || EMAIL_CONFIG.default;
}

/**
 * Send email using Resend API
 */
export async function sendEmail({
    to,
    subject,
    html,
    type = "default",
}: {
    to: string;
    subject: string;
    html: string;
    type?: EmailType;
}) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
        console.log(`[EMAIL] Would send to: ${to}, Subject: ${subject}, Type: ${type}`);
        return { success: false, message: "Email service not configured" };
    }

    const config = getEmailConfig(type);

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: config.from,
                to,
                subject,
                html,
                reply_to: config.replyTo,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[EMAIL] Send error:", error);
            return { success: false, message: error };
        }

        return { success: true };
    } catch (error) {
        console.error("[EMAIL] Exception:", error);
        return { success: false, message: "Failed to send email" };
    }
}

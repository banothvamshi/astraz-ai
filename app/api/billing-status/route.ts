import { NextResponse } from "next/server";
import { checkBillingStatus, getBillingStatusMessage } from "@/lib/billing-guard";

/**
 * Check billing status and credit expiry
 */
export async function GET() {
  try {
    const status = checkBillingStatus();
    const message = getBillingStatusMessage();
    
    const expiryDate = new Date("2026-04-19");
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return NextResponse.json({
      status: "ok",
      billing: {
        freeCreditsAmount: 26993.63,
        freeCreditsCurrency: "INR",
        expiryDate: "2026-04-19",
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpired: now > expiryDate,
        isActive: status.isActive,
        shouldDisable: status.shouldDisable,
        message: message,
      },
      protection: {
        autoDisableEnabled: true,
        manualDisable: process.env.DISABLE_BILLING === "true",
        recommendation: daysRemaining < 30 
          ? "Credits expiring soon. Consider disabling billing to prevent charges."
          : "Service is protected. Will auto-disable on expiry.",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

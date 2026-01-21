import { NextResponse } from "next/server";

export async function GET() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    let status = "missing";
    let role = "unknown";
    let keyPrefix = "none";

    if (serviceKey) {
        status = "present";
        keyPrefix = serviceKey.substring(0, 5) + "...";
        try {
            // JWT is header.payload.signature
            const parts = serviceKey.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                role = payload.role || "undefined";
            } else {
                status = "invalid_format";
            }
        } catch (e) {
            status = "parse_error";
        }
    }

    return NextResponse.json({
        env_var_check: {
            SUPABASE_SERVICE_ROLE_KEY: {
                status,
                role_claim: role,
                prefix: keyPrefix,
                is_valid_service_role: role === 'service_role'
            }
        },
        message: role === 'service_role'
            ? "✅ Configuration Correct. Key is a service_role key."
            : "❌ Configuration Mismatch. Loaded key is NOT a service_role key. Did you redeploy?"
    });
}

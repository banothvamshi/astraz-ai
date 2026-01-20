import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            userId,
            jobTitle,
            companyName,
            jobLocation,
            resumeContent,
            originalResumeText,
            jobDescriptionText,
            isFreeGeneration
        } = body;

        const supabase = getSupabaseAdmin();

        // Insert generation record
        const { data: generation, error: genError } = await supabase
            .from("generations")
            .insert({
                user_id: userId || null,
                job_title: jobTitle || null,
                company_name: companyName || null,
                job_location: jobLocation || null,
                resume_content: resumeContent || null,
                original_resume_text: originalResumeText || null,
                job_description_text: jobDescriptionText || null,
                is_free_generation: isFreeGeneration || false,
            })
            .select()
            .single();

        if (genError) {
            console.error("Generation save error:", genError);
            // Don't fail the request if save fails
            return NextResponse.json({ success: true, saved: false });
        }

        // Also save to pdf_history if content exists
        if (resumeContent && generation) {
            await supabase
                .from("pdf_history")
                .insert({
                    user_id: userId || null,
                    generation_id: generation.id,
                    content: resumeContent,
                    job_title: jobTitle || null,
                    company_name: companyName || null,
                });
        }

        // Increment user's total_generations count if user exists
        if (userId) {
            await supabase.rpc("increment_generation_count", { user_uuid: userId });
        }

        return NextResponse.json({
            success: true,
            saved: true,
            generationId: generation?.id
        });

    } catch (error) {
        console.error("Save generation error:", error);
        return NextResponse.json({ success: true, saved: false });
    }
}

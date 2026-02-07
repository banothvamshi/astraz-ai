import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
    title: "Login | Astraz AI - Access Your Dashboard",
    description: "Sign in to Astraz AI to access your resume builder dashboard, premium features, and job applications.",
    alternates: {
        canonical: "https://www.astrazai.com/login",
    },
};

export default function LoginPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [{
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.astrazai.com"
        }, {
            "@type": "ListItem",
            "position": 2,
            "name": "Login",
            "item": "https://www.astrazai.com/login"
        }]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LoginForm />
        </>
    );
}

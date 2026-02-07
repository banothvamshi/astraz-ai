"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackVisit } from "@/app/actions/analytics";

function Tracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Debounce or just fire?
        // Fire on path change.
        // We pass pathname + searchParams to capture ?ref= etc
        const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

        // We can't await server actions in useEffect directly without voiding
        // We use a small timeout to not block hydration
        const timer = setTimeout(() => {
            trackVisit(url);
        }, 1000);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return null;
}

export function AnalyticsTracker() {
    return (
        <Suspense fallback={null}>
            <Tracker />
        </Suspense>
    );
}

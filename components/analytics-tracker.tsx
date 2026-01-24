"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackVisit } from "@/app/actions/analytics";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

        // De-bounce/Prevent duplicates if strict mode double-fires
        if (lastTrackedPath.current === url) return;

        lastTrackedPath.current = url;

        // Fire and forget
        trackVisit(url);

    }, [pathname, searchParams]);

    return null;
}

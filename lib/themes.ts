export interface ResumeTheme {
    id: string;
    name: string;
    description: string;
    colors: {
        primary: number[];   // Main Headers (Name, Section Titles)
        secondary: number[]; // Subheaders (Role, Company)
        text: number[];      // Body Text
        accent: number[];    // Links, Dividers, Highlights
        background?: number[]; // Optional background (usually white)
    };
    fonts: {
        header: string; // "helvetica", "times", "courier"
        body: string;   // "helvetica", "times", "courier"
    };
    layout: {
        contentWidthOffset: number; // For margins
        lineHeight: number;
    };
}

export const THEMES: Record<string, ResumeTheme> = {
    professional: {
        id: "professional",
        name: "Professional",
        description: "Clean, traditional layout perfect for corporate roles.",
        colors: {
            primary: [15, 23, 42],    // Slate 900 (Deep Navy)
            secondary: [51, 65, 85],  // Slate 700
            text: [30, 41, 59],       // Slate 800
            accent: [79, 70, 229],    // Indigo 600
        },
        fonts: {
            header: "helvetica",
            body: "times",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.5,
        }
    },
    modern: {
        id: "modern",
        name: "Modern",
        description: "Sleek, sans-serif design for tech and startup roles.",
        colors: {
            primary: [0, 0, 0],       // Black
            secondary: [75, 85, 99],  // Gray 600
            text: [31, 41, 55],       // Gray 800
            accent: [16, 185, 129],   // Emerald 500 (Subtle pop)
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 6.0, // More breathing room
        }
    },
    creative: {
        id: "creative",
        name: "Creative",
        description: "Bold colors and distinctive typography for creative fields.",
        colors: {
            primary: [88, 28, 135],   // Purple 900
            secondary: [107, 33, 168], // Purple 700
            text: [17, 24, 39],       // Gray 900
            accent: [219, 39, 119],   // Pink 600
        },
        fonts: {
            header: "helvetica", // Ideally closer to Gotham/Futura if available in jsPDF standard
            body: "helvetica",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.8,
        }
    },
    executive: {
        id: "executive",
        name: "Executive",
        description: "High-contrast, authoritative design for leadership roles.",
        colors: {
            primary: [0, 0, 0],         // Pure Black
            secondary: [64, 64, 64],    // Dark Gray
            text: [0, 0, 0],            // Pure Black
            accent: [180, 83, 9],       // Amber 700 (Gold-ish)
        },
        fonts: {
            header: "times",
            body: "times",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.5,
        }
    }
};

export function getTheme(id?: string): ResumeTheme {
    return THEMES[id?.toLowerCase() || "professional"] || THEMES["professional"];
}

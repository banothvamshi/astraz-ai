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
        headerStyle?: "clean" | "banner" | "sidebar" | "left-border"; // NEW: Left-border style
    };
    isPremium?: boolean;
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
            headerStyle: "clean",
        },
        isPremium: false
    },
    modern: {
        id: "modern",
        name: "Modern",
        description: "Sleek, sans-serif design with a bold header.",
        colors: {
            primary: [31, 41, 55],    // Dark Gray (Was White - Fixed for Section Headers)
            secondary: [75, 85, 99],  // Gray 600
            text: [31, 41, 55],       // Gray 800
            accent: [16, 185, 129],   // Emerald 500
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 6.0,
            headerStyle: "banner", // Enable Banner
        },
        isPremium: false
    },
    creative: {
        id: "creative",
        name: "Creative",
        description: "Bold colors and unique layout for creative fields.",
        colors: {
            primary: [126, 34, 206],  // Purple 700 (Was White)
            secondary: [107, 33, 168], // Purple 700
            text: [17, 24, 39],       // Gray 900
            accent: [219, 39, 119],   // Pink 600
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.8,
            headerStyle: "banner", // Enable Banner
        },
        isPremium: true
    },
    executive: {
        id: "executive",
        name: "Executive",
        description: "High-contrast, authoritative design.",
        colors: {
            primary: [0, 0, 0],         // Pure Black
            secondary: [64, 64, 64],    // Dark Gray
            text: [0, 0, 0],            // Pure Black
            accent: [180, 83, 9],       // Amber 700
        },
        fonts: {
            header: "times",
            body: "times",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.5,
            headerStyle: "clean",
        },
        isPremium: true
    },
    harvard: {
        id: "harvard",
        name: "Harvard",
        description: "Classic Ivy League style. Serious and academic.",
        colors: {
            primary: [164, 16, 52],     // Harvard Crimson
            secondary: [0, 0, 0],       // Black
            text: [0, 0, 0],            // Black
            accent: [164, 16, 52],      // Crimson
        },
        fonts: {
            header: "times",
            body: "times",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.4,
            headerStyle: "clean",
        },
        isPremium: false
    },
    minimalist: {
        id: "minimalist",
        name: "Minimalist",
        description: "Maximum whitespace, elegant typography.",
        colors: {
            primary: [0, 0, 0],
            secondary: [100, 100, 100],
            text: [50, 50, 50],
            accent: [0, 0, 0], // Monochrome
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            contentWidthOffset: 10, // Narrower content
            lineHeight: 7.0, // Airy
            headerStyle: "left-border", // Stylish left border
        },
        isPremium: true
    },
    tech: {
        id: "tech",
        name: "Tech / Code",
        description: "Monospaced font for software engineers.",
        colors: {
            primary: [37, 99, 235],    // Royal Blue
            secondary: [75, 85, 99],
            text: [17, 24, 39],
            accent: [245, 158, 11],    // Amber
        },
        fonts: {
            header: "courier",
            body: "courier",
        },
        layout: {
            contentWidthOffset: 0,
            lineHeight: 5.0, // Dense
            headerStyle: "clean",
        },
        isPremium: true
    }
};

export function getTheme(id?: string): ResumeTheme {
    return THEMES[id?.toLowerCase() || "professional"] || THEMES["professional"];
}

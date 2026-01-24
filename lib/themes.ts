
export interface ResumeTheme {
    id: string;
    name: string;
    description: string;
    colors: {
        primary: number[];   // Main Headers (Name, Section Titles)
        secondary: number[]; // Subheaders (Role, Company)
        text: number[];      // Body Text
        accent: number[];    // Links, Dividers, Highlights
        background?: number[]; // Optional background
    };
    fonts: {
        header: string; // "helvetica", "times", "courier"
        body: string;   // "helvetica", "times", "courier"
    };
    layout: {
        headerStyle: "clean" | "banner" | "sidebar" | "left-border" | "centered";
        margin: number;         // Page margin (mm)
        headerBottomMargin: number; // Space after header (mm)
        sectionSpacing: number; // Space between sections (mm)
        itemSpacing: number;    // Space between job entries (mm)
        lineHeight: number;     // Body line height multiplier
        sidebarWidth?: number;  // For sidebar layouts (mm)
    };
    typography: {
        size: {
            name: number;
            title: number;    // Section Headers (e.g. "Experience")
            subtitle: number; // Job Titles / Companies
            body: number;     // Bullet points
            small: number;    // Dates, locations
        };
        weight: {
            header: "normal" | "bold" | "italic" | "bolditalic";
            body: "normal" | "bold" | "italic" | "bolditalic";
        };
    };
    isPremium?: boolean;
}

export const THEMES: Record<string, ResumeTheme> = {
    professional: {
        id: "professional",
        name: "Professional",
        description: "Clean, traditional layout perfect for corporate roles.",
        colors: {
            primary: [15, 23, 42],    // Slate 900
            secondary: [51, 65, 85],  // Slate 700
            text: [30, 41, 59],       // Slate 800
            accent: [79, 70, 229],    // Indigo 600
        },
        fonts: {
            header: "helvetica",
            body: "times",
        },
        layout: {
            headerStyle: "clean",
            margin: 20,
            headerBottomMargin: 10,
            sectionSpacing: 6,
            itemSpacing: 3,
            lineHeight: 1.4,
        },
        typography: {
            size: { name: 24, title: 14, subtitle: 12, body: 10.5, small: 9 },
            weight: { header: "bold", body: "normal" },
        },
        isPremium: false
    },
    modern: {
        id: "modern",
        name: "Modern",
        description: "Sleek, sans-serif design with a bold header.",
        colors: {
            primary: [31, 41, 55],    // Gray 800
            secondary: [75, 85, 99],  // Gray 600
            text: [31, 41, 55],       // Gray 800
            accent: [16, 185, 129],   // Emerald 500
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            headerStyle: "banner",
            margin: 18,
            headerBottomMargin: 15,
            sectionSpacing: 7,
            itemSpacing: 4,
            lineHeight: 1.5,
        },
        typography: {
            size: { name: 28, title: 15, subtitle: 12, body: 10, small: 9 },
            weight: { header: "bold", body: "normal" },
        },
        isPremium: false
    },
    creative: {
        id: "creative",
        name: "Creative",
        description: "Bold colors and unique layout for creative fields.",
        colors: {
            primary: [126, 34, 206],  // Purple 700
            secondary: [107, 33, 168], // Purple 700
            text: [17, 24, 39],       // Gray 900
            accent: [219, 39, 119],   // Pink 600
            background: [250, 245, 255] // Very light purple bg hint? No, PDF background is complex. Keep white for now.
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            headerStyle: "banner",
            margin: 15,
            headerBottomMargin: 12,
            sectionSpacing: 8,
            itemSpacing: 5,
            lineHeight: 1.6,
        },
        typography: {
            size: { name: 32, title: 16, subtitle: 13, body: 10.5, small: 9.5 },
            weight: { header: "bold", body: "normal" },
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
            headerStyle: "centered",
            margin: 25.4, // 1 inch
            headerBottomMargin: 15,
            sectionSpacing: 7,
            itemSpacing: 4,
            lineHeight: 1.5,
        },
        typography: {
            size: { name: 26, title: 16, subtitle: 14, body: 11, small: 10 },
            weight: { header: "bold", body: "normal" },
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
            headerStyle: "clean",
            margin: 15, // Compact
            headerBottomMargin: 8,
            sectionSpacing: 5,
            itemSpacing: 2,
            lineHeight: 1.3,
        },
        typography: {
            size: { name: 22, title: 14, subtitle: 12, body: 10, small: 9 },
            weight: { header: "bold", body: "normal" },
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
            accent: [0, 0, 0],
        },
        fonts: {
            header: "helvetica",
            body: "helvetica",
        },
        layout: {
            headerStyle: "left-border",
            margin: 20,
            headerBottomMargin: 20,
            sectionSpacing: 10,
            itemSpacing: 6,
            lineHeight: 1.8,
        },
        typography: {
            size: { name: 24, title: 12, subtitle: 11, body: 9.5, small: 8.5 },
            weight: { header: "normal", body: "normal" },
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
            headerStyle: "clean",
            margin: 15,
            headerBottomMargin: 10,
            sectionSpacing: 6,
            itemSpacing: 3,
            lineHeight: 1.2,
        },
        typography: {
            size: { name: 20, title: 14, subtitle: 12, body: 10, small: 9 },
            weight: { header: "bold", body: "normal" },
        },
        isPremium: true
    }
};

export function getTheme(id?: string): ResumeTheme {
    return THEMES[id?.toLowerCase() || "professional"] || THEMES["professional"];
}

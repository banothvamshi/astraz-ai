import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Astraz AI Resume Builder',
        short_name: 'Astraz AI',
        description: 'The #1 Free AI Resume Builder. ATS-friendly, No Sign-up required. Create professional resumes in seconds.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#6366f1',
        icons: [
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            }
        ],
    };
}

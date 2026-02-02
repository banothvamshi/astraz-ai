import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/api/'],
        },
        sitemap: 'https://www.astrazai.com/sitemap.xml',
    };
}

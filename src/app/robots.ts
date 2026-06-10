import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/login-admin/', '/api/'],
        },
        sitemap: 'https://groomersincathome.com/sitemap.xml',
    };
}

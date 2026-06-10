import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://groomersincathome.com';
    const locales = ['en', 'es'];
    const paths = ['', '/transformaciones'];

    const routes = locales.flatMap((locale) =>
        paths.map((path) => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: path === '' ? 1 : 0.8,
        }))
    );

    return routes;
}

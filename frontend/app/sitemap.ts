import { MetadataRoute } from 'next';
import axios from 'axios';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const STATIC_ROUTES = ['', '/products', '/track', '/wishlist', '/cart'];

// Safety cap so a runaway catalog (or an API bug) can never turn this into
// an unbounded loop at build time.
const MAX_PAGES = 20;
const PAGE_SIZE = 50;

async function getAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await axios.get(`${API_URL}/products`, {
        params: { page, limit: PAGE_SIZE },
        timeout: 5000,
      });
      const items: { slug: string }[] = res.data?.items ?? [];
      slugs.push(...items.map((p) => p.slug));
      if (items.length < PAGE_SIZE) break;
    }
  } catch {
    // Sitemap generation must never fail the build — worst case, it just
    // ships without product URLs for this run.
    return [];
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${SITE_URL}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticEntries, ...productEntries];
}

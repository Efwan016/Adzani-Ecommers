import type { ReactNode } from 'react';
import type { Product } from '../types/types';

export type SeoConfig = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

const SITE_NAME = 'Adzani Store';

/**
 * Site origin. Prefer an explicit env override (set VITE_SITE_URL in production /
 * CI) so generated absolute URLs, canonicals and sitemaps match the real domain.
 * Falls back to the current browser origin (or placeholder during SSR/prerender).
 */
export const SITE_ORIGIN: string =
  (import.meta.env?.VITE_SITE_URL && String(import.meta.env.VITE_SITE_URL).replace(/\/$/, '')) ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://adzani-store.example.com');

export const SITE_URL = `${SITE_ORIGIN}/`;

/** Build an absolute URL from an absolute or root-relative path. */
export function absoluteUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** Default OG image (absolute). */
export const OG_IMAGE = absoluteUrl('/og-image.png');

/** Canonical of the current path (root-relative). */
export function currentCanonical(): string {
  if (typeof window === 'undefined') return SITE_URL;
  return `${SITE_ORIGIN}${window.location.pathname}`;
}

export const DEFAULT_SEO: SeoConfig = {
  title: `${SITE_NAME} | Katalog Elektronik, Aksesoris HP & Voucher`,
  description:
    'Belanja produk elektronik, aksesoris HP, dan voucher lewat katalog Adzani Store dengan cart dan checkout WhatsApp.',
  canonical: SITE_URL,
  ogTitle: `${SITE_NAME} | Katalog Elektronik, Aksesoris HP & Voucher`,
  ogDescription:
    'Belanja produk elektronik, aksesoris HP, dan voucher lewat katalog Adzani Store dengan cart dan checkout WhatsApp.',
  ogImage: OG_IMAGE,
  ogType: 'website',
  noIndex: false,
};

/**
 * Site-wide structured data: Organization + WebSite (with a Sitelink SearchAction).
 * Emitted on every page via DEFAULT_SEO so search engines get the publisher identity
 * and an on-site search box even before crawling anything else.
 */
export function buildSiteJsonLd(): Record<string, unknown>[] {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.svg'),
    image: OG_IMAGE,
    description:
      'Konter elektronik dan aksesoris HP dengan katalog online, stok jelas, dan checkout cepat lewat WhatsApp.',
    sameAs: [],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_ORIGIN}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_ORIGIN}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return [organization, website];
}

/** Product structured data for a product detail page. */
export function buildProductJsonLd(product: Product): Record<string, unknown> {
  const inStock = product.stock > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description:
      product.description || `Detail ${product.name} kategori ${product.category} di Adzani Store.`,
    category: product.category,
    image: product.image_url ? [product.image_url] : [OG_IMAGE],
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/products/${product.slug}`),
      priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10),
      seller: { '@id': `${SITE_ORIGIN}/#organization` },
    },
  };
}

/** BreadcrumbList structured data from an array of { name, url }. */
export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function applySeo(meta: SeoConfig = DEFAULT_SEO) {
  if (typeof document === 'undefined') {
    return;
  }

  const title = meta.title || DEFAULT_SEO.title || '';
  const description = meta.description || DEFAULT_SEO.description || '';
  const canonical = meta.canonical || DEFAULT_SEO.canonical || SITE_URL;
  const ogTitle = meta.ogTitle || title;
  const ogDescription = meta.ogDescription || description;
  const ogImage = meta.ogImage || DEFAULT_SEO.ogImage || OG_IMAGE;
  const ogType = meta.ogType || DEFAULT_SEO.ogType || 'website';

  document.title = title;

  const upsertMeta = (selector: string, attrs: Record<string, string>) => {
    let el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
    if (!el) {
      el = document.createElement(selector.includes('link') ? 'link' : 'meta');
      if (selector.includes('link')) {
        (el as HTMLLinkElement).rel = 'canonical';
      }
      document.head.appendChild(el);
    }
    if (el instanceof HTMLMetaElement) {
      Object.entries(attrs).forEach(([key, value]) => el!.setAttribute(key, value));
    } else {
      (el as HTMLLinkElement).href = attrs.href;
    }
  };

  upsertMeta('meta[name="description"]', { name: 'description', content: description });
  upsertMeta('meta[name="keywords"]', {
    name: 'keywords',
    content:
      'Adzani Store, Adzani E-commerce, katalog elektronik, aksesoris HP, voucher, konter HP, checkout WhatsApp',
  });
  upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonical });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: ogTitle });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: ogDescription });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: ogType });
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME });
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'id_ID' });
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ogTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ogDescription });
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: meta.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
  });

  // JSON-LD. Always include site-level data, then append page-specific blocks.
  const jsonLdBlocks: Record<string, unknown>[] = buildSiteJsonLd();
  if (meta.jsonLd) {
    if (Array.isArray(meta.jsonLd)) {
      jsonLdBlocks.push(...meta.jsonLd);
    } else {
      jsonLdBlocks.push(meta.jsonLd);
    }
  }

  // Remove previously injected SEO JSON-LD blocks, then write the fresh set.
  document.querySelectorAll('script[data-seo-jsonld]').forEach((node) => node.remove());
  jsonLdBlocks.forEach((block) => {
    const scriptEl = document.createElement('script');
    scriptEl.type = 'application/ld+json';
    scriptEl.setAttribute('data-seo-jsonld', 'true');
    scriptEl.textContent = JSON.stringify(block);
    document.head.appendChild(scriptEl);
  });
}

export function RouteSeo({ meta }: { meta: SeoConfig }) {
  if (typeof window !== 'undefined') {
    applySeo({ ...DEFAULT_SEO, ...meta });
  }
  return null;
}

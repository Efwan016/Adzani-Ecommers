import type { ReactNode } from 'react';

export type SeoConfig = {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | null;
};

export const DEFAULT_SEO: SeoConfig = {
  title: 'Adzani Store | Katalog Elektronik, Aksesoris HP & Voucher',
  description:
    'Belanja produk elektronik, aksesoris HP, dan voucher lewat katalog Adzani Store dengan cart dan checkout WhatsApp.',
  canonical: typeof window !== 'undefined' ? window.location.origin : undefined,
  ogTitle: 'Adzani Store | Katalog Elektronik, Aksesoris HP & Voucher',
  ogDescription:
    'Belanja produk elektronik, aksesoris HP, dan voucher lewat katalog Adzani Store dengan cart dan checkout WhatsApp.',
  noIndex: false,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Adzani Store',
    description:
      'Katalog produk konter elektronik, aksesoris HP, voucher, dan checkout cepat via WhatsApp.',
  },
};

export function applySeo(meta: SeoConfig = DEFAULT_SEO) {
  if (typeof document === 'undefined') {
    return;
  }

  const title = meta.title || DEFAULT_SEO.title || '';
  const description = meta.description || DEFAULT_SEO.description || '';
  const canonical = meta.canonical || DEFAULT_SEO.canonical || '';
  const ogTitle = meta.ogTitle || title;
  const ogDescription = meta.ogDescription || description;

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
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: ogTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: ogDescription });
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: meta.noIndex ? 'noindex,nofollow' : 'index,follow',
  });

  const existingJsonLd = document.querySelector('script[data-seo-jsonld]');
  if (meta.jsonLd) {
    let scriptEl = existingJsonLd as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.setAttribute('data-seo-jsonld', 'true');
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(meta.jsonLd, null, 2);
  } else if (existingJsonLd) {
    existingJsonLd.remove();
  }
}

export function RouteSeo({ meta }: { meta: SeoConfig }) {
  if (typeof window !== 'undefined') {
    applySeo({ ...DEFAULT_SEO, ...meta });
  }
  return null;
}

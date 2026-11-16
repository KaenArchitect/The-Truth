export const CANONICAL_PUBLISHED_ORIGIN = 'https://the-truth.ai.studio';
export const SOCIAL_CARD_IMAGE_VERSION = '2';

export interface SocialHeaderBag {
  host?: string;
  xForwardedHost?: string;
  xForwardedProto?: string;
  xOriginalHost?: string;
  forwarded?: string;
  protocol?: string;
  configuredAppUrl?: string;
}

function firstCommaToken(raw: string | undefined): string {
  return String(raw || '')
    .split(',')[0]
    .trim()
    .replace(/\/+$/, '');
}

function parseForwardedHost(forwardedHeader: string | undefined): string {
  if (!forwardedHeader) return '';
  const match = String(forwardedHeader).match(/(?:^|[;,]\s*)host=([^;,\s"]+|"[^"]+")/i);
  if (!match) return '';
  return match[1].replace(/^"|"$/g, '').trim();
}

function isPreviewOrDevHost(host: string): boolean {
  return /^(?:ais-dev-|ais-pre-)/i.test(host);
}

function isLocalHost(host: string): boolean {
  return /^localhost(?::|$)|^127\.0\.0\.1(?::|$)|^0\.0\.0\.0(?::|$)/i.test(host);
}

function isProductionCloudRunAliasHost(host: string): boolean {
  if (!host || isPreviewOrDevHost(host) || isLocalHost(host)) return false;
  return /^the-truth-[a-z0-9-]+\.(?:[a-z0-9-]+\.)?run\.app(?::\d+)?$/i.test(host);
}

export function resolvePublicOriginFromHeaders(headers: SocialHeaderBag): string {
  const configured = String(headers.configuredAppUrl || '')
    .trim()
    .replace(/\/+$/, '');
  const origHost = firstCommaToken(headers.xOriginalHost);
  const fwdHost = parseForwardedHost(headers.forwarded);
  const xfHost = firstCommaToken(headers.xForwardedHost);
  const rawHost = origHost || fwdHost || xfHost || firstCommaToken(headers.host);

  if (origHost && !isProductionCloudRunAliasHost(origHost)) {
    const proto = firstCommaToken(headers.xForwardedProto) || (isLocalHost(origHost) ? 'http' : 'https');
    return `${proto}://${origHost}`;
  }
  if (fwdHost && !isProductionCloudRunAliasHost(fwdHost)) {
    const proto = firstCommaToken(headers.xForwardedProto) || (isLocalHost(fwdHost) ? 'http' : 'https');
    return `${proto}://${fwdHost}`;
  }

  // Published `.ai.studio` custom domains proxy requests to the underlying `the-truth-*.run.app` Cloud Run URL
  // and overwrite `Host` / `X-Forwarded-Host` with the `.run.app` backend hostname. Canonicalize back to
  // `https://the-truth.ai.studio` so `og:url`, `canonical`, `og:image`, and `twitter:image` match the shared URL.
  if (isProductionCloudRunAliasHost(rawHost)) {
    return CANONICAL_PUBLISHED_ORIGIN;
  }

  if (!xfHost && configured) {
    return isProductionCloudRunAliasHost(configured.replace(/^https?:\/\//i, ''))
      ? CANONICAL_PUBLISHED_ORIGIN
      : configured;
  }

  if (!rawHost) {
    return configured || CANONICAL_PUBLISHED_ORIGIN;
  }

  const local = isLocalHost(rawHost);
  const xfProto = firstCommaToken(headers.xForwardedProto);
  const proto = xfProto || (local ? headers.protocol || 'http' : 'https');
  return `${proto}://${rawHost}`;
}

export function escapeHtmlAttr(val: string): string {
  return String(val || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface SocialMetaUpdate {
  origin: string;
  title: string;
  description: string;
  urlPath: string;
}

export function injectCanonicalSocialMeta(html: string, meta: SocialMetaUpdate): string {
  const origin = String(meta.origin || CANONICAL_PUBLISHED_ORIGIN).replace(/\/+$/, '');
  const hostname = origin.replace(/^https?:\/\//i, '').split('/')[0] || 'the-truth.ai.studio';
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.description);
  const cleanPath = meta.urlPath.startsWith('/') ? meta.urlPath : `/${meta.urlPath}`;
  const safeUrl = escapeHtmlAttr(`${origin}${cleanPath}`);
  const safeDomain = escapeHtmlAttr(hostname);
  const safeImage = escapeHtmlAttr(`${origin}/og-card.jpg?v=${SOCIAL_CARD_IMAGE_VERSION}`);

  let out = html.replace(/https:\/\/the-truth\.ai\.studio/g, () => origin);
  out = out
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${safeTitle}</title>`)
    .replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/i,
      () => `<link rel="canonical" href="${safeUrl}" />`
    )
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/i,
      () => `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:url" content="${safeUrl}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:image" content="${safeImage}" />`
    )
    .replace(
      /<meta property="og:image:secure_url" content="[^"]*"\s*\/?>/i,
      () => `<meta property="og:image:secure_url" content="${safeImage}" />`
    )
    .replace(
      /<meta name="twitter:domain" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:domain" content="${safeDomain}" />`
    )
    .replace(
      /<meta name="twitter:url" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:url" content="${safeUrl}" />`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:image" content="${safeImage}" />`
    )
    .replace(
      /<meta name="twitter:image:src" content="[^"]*"\s*\/?>/i,
      () => `<meta name="twitter:image:src" content="${safeImage}" />`
    );

  return out;
}

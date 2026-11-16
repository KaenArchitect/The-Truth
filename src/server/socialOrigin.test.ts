import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANONICAL_PUBLISHED_ORIGIN,
  SOCIAL_CARD_IMAGE_VERSION,
  injectCanonicalSocialMeta,
  resolvePublicOriginFromHeaders
} from './socialOrigin.ts';

test('resolvePublicOriginFromHeaders maps proxied Cloud Run prod hostname back to the-truth.ai.studio', () => {
  const origin = resolvePublicOriginFromHeaders({
    host: 'the-truth-990317922634.us-west1.run.app',
    xForwardedHost: 'the-truth-990317922634.us-west1.run.app',
    xForwardedProto: 'https'
  });
  assert.equal(origin, CANONICAL_PUBLISHED_ORIGIN);
});

test('resolvePublicOriginFromHeaders preserves ais-dev and ais-pre preview domains', () => {
  const devOrigin = resolvePublicOriginFromHeaders({
    host: 'ais-dev-jxqs2f4so3rsybstzpgomr-513913905337.us-east5.run.app',
    xForwardedHost: 'ais-dev-jxqs2f4so3rsybstzpgomr-513913905337.us-east5.run.app',
    xForwardedProto: 'https'
  });
  assert.equal(devOrigin, 'https://ais-dev-jxqs2f4so3rsybstzpgomr-513913905337.us-east5.run.app');

  const preOrigin = resolvePublicOriginFromHeaders({
    host: 'ais-pre-jxqs2f4so3rsybstzpgomr-513913905337.us-east5.run.app',
    xForwardedProto: 'https'
  });
  assert.equal(preOrigin, 'https://ais-pre-jxqs2f4so3rsybstzpgomr-513913905337.us-east5.run.app');
});

test('resolvePublicOriginFromHeaders respects X-Original-Host and Forwarded host headers', () => {
  const viaForwarded = resolvePublicOriginFromHeaders({
    host: 'the-truth-990317922634.us-west1.run.app',
    forwarded: 'for=1.2.3.4;proto=https;host="the-truth.ai.studio"',
    xForwardedProto: 'https'
  });
  assert.equal(viaForwarded, 'https://the-truth.ai.studio');
});

test('injectCanonicalSocialMeta rewrites canonical, OG, and Twitter image tags consistently with versioned URL', () => {
  const sampleHtml = `<!doctype html><html><head>
    <title>Old Title</title>
    <link rel="canonical" href="https://the-truth.ai.studio/" />
    <meta name="description" content="Old" />
    <meta property="og:url" content="https://the-truth.ai.studio/" />
    <meta property="og:title" content="Old" />
    <meta property="og:description" content="Old" />
    <meta property="og:image" content="https://the-truth.ai.studio/og-card.jpg" />
    <meta property="og:image:secure_url" content="https://the-truth.ai.studio/og-card.jpg" />
    <meta name="twitter:domain" content="the-truth.ai.studio" />
    <meta name="twitter:url" content="https://the-truth.ai.studio/" />
    <meta name="twitter:title" content="Old" />
    <meta name="twitter:description" content="Old" />
    <meta name="twitter:image" content="https://the-truth.ai.studio/og-card.jpg" />
    <meta name="twitter:image:src" content="https://the-truth.ai.studio/og-card.jpg" />
  </head><body><div id="root"></div></body></html>`;

  const out = injectCanonicalSocialMeta(sampleHtml, {
    origin: 'https://the-truth.ai.studio',
    title: 'The Truth — $KAS: Grade A+ (6.0/6.0)',
    description: 'BlockDAG PoW verification.',
    urlPath: '/?asset=KAS'
  });

  const expectedImg = `https://the-truth.ai.studio/og-card.jpg?v=${SOCIAL_CARD_IMAGE_VERSION}`;
  assert.ok(out.includes('<link rel="canonical" href="https://the-truth.ai.studio/?asset=KAS" />'));
  assert.ok(out.includes(`<meta property="og:image" content="${expectedImg}" />`));
  assert.ok(out.includes(`<meta name="twitter:image" content="${expectedImg}" />`));
  assert.ok(out.includes(`<meta name="twitter:image:src" content="${expectedImg}" />`));
  assert.ok(out.includes('<meta name="twitter:domain" content="the-truth.ai.studio" />'));
  assert.ok(out.includes('<title>The Truth — $KAS: Grade A+ (6.0/6.0)</title>'));
});

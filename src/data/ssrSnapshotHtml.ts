import {
  buildArchiveComparison,
  findArchivedAudit,
  parseDeepLinkSearchParams,
  summarizeArchivedAudit
} from './agentArchiveApi.ts';
import {
  type AuditData,
  formatScore,
  sortAuditTickersByGrade
} from './rubricSpec.ts';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAuditDetailSection(audit: AuditData, headingTag: 'h2' | 'h3' = 'h2'): string {
  const summary = summarizeArchivedAudit(audit);
  const invRows = (audit.invariants || [])
    .slice(0, 6)
    .map((inv, idx) => {
      const title = escapeHtml(inv.title || inv.shortName || `Invariant 0${idx + 1}`);
      const id = escapeHtml(inv.id || `0${idx + 1}`);
      const scoreStr = `${formatScore(inv.score)} / 1.00`;
      const telemetry = escapeHtml(inv.telemetry || '');
      const quickSummary = escapeHtml(inv.quickSummary || '');
      const paragraph = escapeHtml(inv.paragraph || '');
      const geniusParagraph = escapeHtml(inv.geniusParagraph || '');
      const receipts = (inv.receipts || [])
        .filter(Boolean)
        .map((r) => `<li>${escapeHtml(r)}</li>`)
        .join('');

      return `<article style="margin:14px 0;padding:14px;border:1px solid #1f2430;border-radius:10px;background:#121418;">
  <h4 style="margin:0 0 6px 0;font-size:15px;color:#49EACB;">[${id}] ${title} — ${scoreStr}</h4>
  ${telemetry ? `<p style="margin:0 0 6px 0;font-size:13px;color:#9CA3AF;"><strong>Telemetry:</strong> ${telemetry}</p>` : ''}
  ${quickSummary ? `<p style="margin:0 0 8px 0;"><strong>Verdict:</strong> ${quickSummary}</p>` : ''}
  ${paragraph ? `<p style="margin:0 0 8px 0;"><strong>Summary Analysis:</strong> ${paragraph}</p>` : ''}
  ${
    geniusParagraph && geniusParagraph !== paragraph
      ? `<p style="margin:0 0 8px 0;color:#D1D5DB;"><strong>GENIUS Forensic Audit:</strong> ${geniusParagraph}</p>`
      : ''
  }
  ${receipts ? `<ul style="margin:6px 0 0 18px;padding:0;color:#9CA3AF;font-size:13px;">${receipts}</ul>` : ''}
</article>`;
    })
    .join('\n');

  return `<section style="margin:22px 0;padding:18px;border:1px solid #262b38;border-radius:14px;background:#0F1116;">
  <${headingTag} style="margin:0 0 8px 0;font-size:20px;color:#FFFFFF;">${escapeHtml(audit.name)} ($${escapeHtml(audit.ticker)}) — Grade ${escapeHtml(audit.grade)} (${formatScore(audit.totalScore)} / 6.00)</${headingTag}>
  <p style="margin:0 0 10px 0;color:#D1D5DB;">
    <strong>Category:</strong> ${escapeHtml(summary.categoryLabel)} |
    <strong>Consensus Family:</strong> ${escapeHtml(audit.consensusFamily)} |
    <strong>Architecture:</strong> ${escapeHtml(audit.architecture)} |
    <strong>Certainty:</strong> ${escapeHtml(audit.certainty)}
  </p>
  <p style="margin:0 0 14px 0;"><strong>GRADE Conclusion:</strong> ${escapeHtml(audit.conclusion)}</p>
  ${invRows}
</section>`;
}

export function buildSsrRootInnerHtml(
  originalUrl: string,
  origin: string,
  auditsMap: Record<string, AuditData>,
  dynamicAliases: Record<string, string> = {}
): string {
  const safeOrigin = escapeHtml(origin.replace(/\/+$/, ''));
  const qIdx = originalUrl.indexOf('?');
  const search = qIdx !== -1 ? originalUrl.slice(qIdx) : '';
  const parsed = parseDeepLinkSearchParams(search);
  const orderedTickers = sortAuditTickersByGrade(auditsMap);

  let focusHtml = '';

  if (parsed.compareTickers.length >= 2) {
    const comp = buildArchiveComparison(auditsMap, parsed.compareTickers, {
      mode: parsed.mode || 'GENIUS',
      dynamicAliases
    });
    if (comp.ok) {
      const matrixRows = comp.invariantMatrix
        .map((row) => {
          const cells = comp.assets
            .map((a) => {
              const cell = row.scoresByTicker[a.ticker];
              return `<td style="padding:8px;border:1px solid #1f2430;"><strong>${formatScore(cell?.score ?? 0)}</strong><br/><span style="font-size:12px;color:#9CA3AF;">${escapeHtml(cell?.telemetry || '')}</span></td>`;
            })
            .join('');
          return `<tr>
  <td style="padding:8px;border:1px solid #1f2430;"><strong>${escapeHtml(row.id)} ${escapeHtml(row.title)}</strong></td>
  ${cells}
</tr>`;
        })
        .join('\n');

      const assetHeaders = comp.assets
        .map(
          (a) =>
            `<th style="padding:8px;border:1px solid #1f2430;text-align:left;">$${escapeHtml(a.ticker)} (${escapeHtml(a.grade)} • ${formatScore(a.totalScore)}/6.00)</th>`
        )
        .join('');

      const assetBreakdowns = comp.assets
        .map((a) => {
          const fullAudit = auditsMap[a.ticker];
          return fullAudit ? renderAuditDetailSection(fullAudit, 'h3') : '';
        })
        .join('\n');

      focusHtml = `<section style="margin:20px 0;">
  <h2 style="margin:0 0 8px 0;font-size:22px;color:#49EACB;">Side-by-Side Thermodynamic Comparison: ${comp.tickers.map((t) => `$${escapeHtml(t)}`).join(' vs ')}</h2>
  <p style="margin:0 0 10px 0;"><strong>Leader:</strong> $${escapeHtml(comp.leaderTicker)} | <strong>Score Spread:</strong> ${formatScore(comp.spreadScore)} / 6.00 | <strong>Physics Verdict:</strong> ${escapeHtml(comp.posVsPowContrast.physicsVerdict)}</p>
  <table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;">
    <thead>
      <tr style="background:#151922;">
        <th style="padding:8px;border:1px solid #1f2430;text-align:left;">Thermodynamic Invariant</th>
        ${assetHeaders}
      </tr>
    </thead>
    <tbody>
      ${matrixRows}
    </tbody>
  </table>
  ${assetBreakdowns}
</section>`;
    }
  } else if (parsed.assetTicker) {
    const hit = findArchivedAudit(auditsMap, parsed.assetTicker, dynamicAliases);
    if (hit) {
      focusHtml = renderAuditDetailSection(hit, 'h2');
    }
  }

  if (!focusHtml) {
    const spotlightTickers = ['KAS', 'BTC', 'LTC', 'XAU', 'XAG', 'ETH', 'SOL', 'ZEC'].filter((tk) =>
      Boolean(auditsMap[tk])
    );
    if (spotlightTickers.length > 0) {
      focusHtml = `<section style="margin:20px 0;">
  <h2 style="margin:0 0 10px 0;font-size:20px;color:#49EACB;">Flagship Thermodynamic Benchmark Audits</h2>
  ${spotlightTickers.map((tk) => renderAuditDetailSection(auditsMap[tk], 'h3')).join('\n')}
</section>`;
    }
  }

  const scorecardRows = orderedTickers
    .map((tk, idx) => {
      const audit = auditsMap[tk];
      if (!audit) return '';
      const summary = summarizeArchivedAudit(audit);
      const invCells = [0, 1, 2, 3, 4, 5]
        .map((i) => `<td style="padding:6px 8px;border:1px solid #1f2430;">${formatScore(audit.invariants?.[i]?.score ?? 0)}</td>`)
        .join('');
      const assetHref = `${safeOrigin}/?asset=${encodeURIComponent(audit.ticker)}`;
      return `<tr>
  <td style="padding:6px 8px;border:1px solid #1f2430;">${idx + 1}</td>
  <td style="padding:6px 8px;border:1px solid #1f2430;"><a href="${assetHref}" style="color:#49EACB;">$${escapeHtml(audit.ticker)}</a></td>
  <td style="padding:6px 8px;border:1px solid #1f2430;">${escapeHtml(audit.name)}</td>
  <td style="padding:6px 8px;border:1px solid #1f2430;">${escapeHtml(summary.categoryLabel)}</td>
  <td style="padding:6px 8px;border:1px solid #1f2430;">${escapeHtml(audit.consensusFamily)}</td>
  <td style="padding:6px 8px;border:1px solid #1f2430;"><strong>${escapeHtml(audit.grade)}</strong></td>
  <td style="padding:6px 8px;border:1px solid #1f2430;"><strong>${formatScore(audit.totalScore)} / 6.00</strong></td>
  ${invCells}
  <td style="padding:6px 8px;border:1px solid #1f2430;font-size:12px;color:#D1D5DB;">${escapeHtml(audit.architecture)}</td>
</tr>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<main class="truth-ssr-snapshot" style="background:#0B0C0E;color:#E5E7EB;font-family:Inter,system-ui,-apple-system,sans-serif;max-width:1120px;margin:0 auto;padding:28px 20px;line-height:1.55;">
  <header style="border-bottom:1px solid #1f2430;padding-bottom:16px;margin-bottom:20px;">
    <h1 style="margin:0 0 8px 0;font-size:26px;color:#FFFFFF;">The Truth — Sovereign Thermodynamic Verification Engine</h1>
    <p style="margin:0 0 8px 0;color:#D1D5DB;">
      Independent verification engine grading Layer-1 cryptocurrencies, consensus overlays, and physical Periodic Table metals strictly against six immutable laws of thermodynamics and information physics (0.00–6.00 scale).
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      <strong>Archived Audits (${orderedTickers.length}):</strong> ${orderedTickers.map((t) => `$${escapeHtml(t)}`).join(', ')}
    </p>
  </header>

  <section style="margin:18px 0;padding:16px;border:1px solid #1f2430;border-radius:12px;background:#121418;">
    <h2 style="margin:0 0 8px 0;font-size:18px;color:#FFFFFF;">Thermodynamic Laws &amp; Deterministic Grading Scale (6.00 Max)</h2>
    <ul style="margin:0;padding-left:20px;color:#D1D5DB;">
      <li><strong>Six Invariants (1.00 each, max 6.00):</strong> [01] Existential Sovereignty &amp; Entity Decoupling, [02] Thermodynamic Cost Floor (E &gt; 0), [03] Historical Immutability &amp; Arrow of Time (Landauer ΔQ ≥ kB·T·ln2), [04] Dynamic Availability (Wartime Partition &amp; Cable Resplice), [05] State Machine Topology, [06] Thermodynamic Velocity (M = 1.0).</li>
      <li><strong>Conservation of Energy Floor (E = 0 → F):</strong> Any zero-joule consensus network (PoS, DPoS, PoH, PoA, FBA, PoX, or single-sequencer systems) has Cost Floor = 0.00 and automatically receives Terminal Grade <strong>F</strong> (0.00 / 6.00).</li>
      <li><strong>Energy-Arbitrage Law (Sovereignty = 0 → Grade ≤ D+):</strong> Any genesis premine, VC/ICO pre-allocation, or mandatory protocol developer tax triggers Invariant 01 = 0.00, caps Cost Floor at ≤ 0.35, and hard-caps Terminal Grade at <strong>D+</strong>.</li>
      <li><strong>Physical Metals as Layer-1 Substrates:</strong> Raw elemental metals (Gold/Au/XAU, Silver/Ag/XAG, Copper/Cu/XCU, Platinum/Pt/XPT, Palladium/Pd/XPD, etc.) are graded as primary Layer-1 <em>Physical Commodity</em> substrates (never L2 overlays).</li>
      <li><strong>Grade Brackets:</strong> A+ (5.70–6.00), A (5.20–5.69), A- (4.70–5.19), B+ (4.20–4.69), B (3.70–4.19), B- (3.20–3.69), C+ (2.70–3.19), C (2.20–2.69), C- (1.80–2.19), D+ (1.40–1.79), D (1.00–1.39), F (&lt; 1.00 or E = 0).</li>
    </ul>
  </section>

  ${focusHtml}

  <section style="margin:24px 0;">
    <h2 style="margin:0 0 10px 0;font-size:20px;color:#FFFFFF;">Complete Archived Thermodynamic Scorecard (${orderedTickers.length} Verified Assets)</h2>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#151922;color:#FFFFFF;">
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">#</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Ticker</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Asset</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Layer Category</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Consensus Family</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Grade</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Total</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">01 Sov</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">02 Cost</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">03 Imm</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">04 Avail</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">05 State</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">06 Vel</th>
            <th style="padding:6px 8px;border:1px solid #1f2430;text-align:left;">Architecture</th>
          </tr>
        </thead>
        <tbody>
          ${scorecardRows}
        </tbody>
      </table>
    </div>
  </section>

  <footer style="margin-top:24px;padding-top:16px;border-top:1px solid #1f2430;font-size:13px;color:#9CA3AF;">
    <p style="margin:0 0 6px 0;"><strong>Machine-Readable Endpoints (0-Credit Archive Access):</strong></p>
    <p style="margin:0;">
      <a href="${safeOrigin}/api/agent/archive" style="color:#49EACB;">/api/agent/archive</a> •
      <a href="${safeOrigin}/api/agent/compare?tickers=KAS,ETH,ZEC&amp;mode=GENIUS" style="color:#49EACB;">/api/agent/compare</a> •
      <a href="${safeOrigin}/llms.txt" style="color:#49EACB;">/llms.txt</a> •
      <a href="${safeOrigin}/openapi.json" style="color:#49EACB;">/openapi.json</a> •
      <a href="${safeOrigin}/mcp" style="color:#49EACB;">/mcp</a> •
      <a href="${safeOrigin}/sitemap.xml" style="color:#49EACB;">/sitemap.xml</a>
    </p>
  </footer>
</main>`;
}

export function injectSsrRootHtml(html: string, ssrInnerHtml: string): string {
  const rootRegex = /<div\s+id=["']root["']\s*>\s*<\/div>/i;
  if (!rootRegex.test(html)) {
    return html;
  }
  return html.replace(rootRegex, () => `<div id="root">\n${ssrInnerHtml}\n</div>`);
}

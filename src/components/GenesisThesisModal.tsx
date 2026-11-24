import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Atom, Check, Copy, Flame, Layers, Scale, ShieldAlert, Sparkles, X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  GENESIS_THESIS_GENIUS_PARAGRAPHS,
  GENESIS_THESIS_GENIUS_RAW_MARKDOWN,
  GENESIS_THESIS_PARAGRAPHS,
  GENESIS_THESIS_SUBTITLE,
  GENESIS_THESIS_TITLE,
  getGenesisThesisParagraphs,
  type ThesisChapterId
} from '../data/genesisThesisData.ts';

export { GENESIS_THESIS_PARAGRAPHS, GENESIS_THESIS_GENIUS_PARAGRAPHS };

function renderKatexHtml(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: 'ignore'
    });
  } catch {
    return latex;
  }
}

function renderInlineAtomicTokens(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Matches either `inline code` or inline LaTeX $...$ (including escaped \$ inside math)
  const tokenRe = /`([^`\n]+)`|(?<!\\)\$((?:\\\$|[^$\n])+?)\$/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null = tokenRe.exec(text);
  let idx = 0;

  while (match !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }

    if (match[1] !== undefined) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${idx}`}
          className="font-mono text-[12.5px] px-1.5 py-0.5 rounded bg-[#0D1117] border border-white/[0.08] text-neutral-100"
        >
          {match[1]}
        </code>
      );
    } else if (match[2] !== undefined) {
      const html = renderKatexHtml(match[2], false);
      nodes.push(
        <span
          key={`${keyPrefix}-math-${idx}`}
          className="inline-block align-baseline text-neutral-100"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    lastIdx = match.index + match[0].length;
    idx += 1;
    match = tokenRe.exec(text);
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }

  return nodes;
}

function renderItalicAndAtomicTokens(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const italicRe = /(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null = italicRe.exec(text);
  let idx = 0;

  while (match !== null) {
    if (match.index > lastIdx) {
      nodes.push(...renderInlineAtomicTokens(text.slice(lastIdx, match.index), `${keyPrefix}-p-${idx}`));
    }
    nodes.push(
      <em key={`${keyPrefix}-em-${idx}`} className="italic text-neutral-300">
        {renderInlineAtomicTokens(match[1], `${keyPrefix}-emi-${idx}`)}
      </em>
    );
    lastIdx = match.index + match[0].length;
    idx += 1;
    match = italicRe.exec(text);
  }

  if (lastIdx < text.length) {
    nodes.push(...renderInlineAtomicTokens(text.slice(lastIdx), `${keyPrefix}-tail`));
  }

  return nodes;
}

function renderRichInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const boldRe = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null = boldRe.exec(text);
  let idx = 0;

  while (match !== null) {
    if (match.index > lastIdx) {
      nodes.push(
        ...renderItalicAndAtomicTokens(text.slice(lastIdx, match.index), `${keyPrefix}-pre-${idx}`)
      );
    }
    nodes.push(
      <strong key={`${keyPrefix}-b-${idx}`} className="font-semibold text-white">
        {renderItalicAndAtomicTokens(match[1], `${keyPrefix}-bi-${idx}`)}
      </strong>
    );
    lastIdx = match.index + match[0].length;
    idx += 1;
    match = boldRe.exec(text);
  }

  if (lastIdx < text.length) {
    nodes.push(...renderItalicAndAtomicTokens(text.slice(lastIdx), `${keyPrefix}-end`));
  }

  return nodes;
}

function ThesisBodyContent({ text, sectionId }: { text: string; sectionId: number }) {
  const blocks = useMemo(() => text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean), [text]);

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        const keyBase = `s${sectionId}-b${bIdx}`;

        if (block.startsWith('$$') && block.endsWith('$$') && block.length > 4) {
          const expr = block.slice(2, -2).trim();
          const html = renderKatexHtml(expr, true);
          return (
            <div
              key={keyBase}
              data-testid="thesis-display-equation"
              className="rounded-xl bg-[#0D1117] border border-white/[0.07] px-4 py-3 overflow-x-auto no-scrollbar text-neutral-100 text-[13px] sm:text-[14px]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0 && lines.every((l) => l.startsWith('* '))) {
          return (
            <ul
              key={keyBase}
              className="list-disc pl-5 space-y-2 text-[13.5px] sm:text-[14.5px] leading-[1.72] text-neutral-200 marker:text-neutral-500"
            >
              {lines.map((line, lIdx) => (
                <li key={`${keyBase}-ul-${lIdx}`}>
                  {renderRichInline(line.replace(/^\*\s+/, ''), `${keyBase}-uli-${lIdx}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l))) {
          return (
            <ol
              key={keyBase}
              className="list-decimal pl-5 space-y-2.5 text-[13.5px] sm:text-[14.5px] leading-[1.72] text-neutral-200 marker:text-neutral-400 marker:font-mono"
            >
              {lines.map((line, lIdx) => (
                <li key={`${keyBase}-ol-${lIdx}`}>
                  {renderRichInline(line.replace(/^\d+\.\s+/, ''), `${keyBase}-oli-${lIdx}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={keyBase}
            className="text-[13.5px] sm:text-[14.5px] leading-[1.72] text-neutral-200 font-normal"
          >
            {renderRichInline(block, keyBase)}
          </p>
        );
      })}
    </div>
  );
}

interface GenesisThesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  accent: GradeAccent;
  isGeniusMode: boolean;
  onSetGeniusMode: (next: boolean) => void;
  onCopyFullThesis: (fullText: string) => void;
  copiedTarget: string | null;
}

export function GenesisThesisModal({
  isOpen,
  onClose,
  accent,
  isGeniusMode,
  onSetGeniusMode,
  onCopyFullThesis,
  copiedTarget
}: GenesisThesisModalProps) {
  const [chapter, setChapter] = useState<ThesisChapterId>('ALL');

  const activeParagraphs = useMemo(
    () => getGenesisThesisParagraphs(isGeniusMode ? 'GENIUS' : 'NORMIE'),
    [isGeniusMode]
  );

  const filteredParagraphs = useMemo(() => {
    if (chapter === 'ALL') return activeParagraphs;
    return activeParagraphs.filter((p) => p.chapter === chapter);
  }, [activeParagraphs, chapter]);

  if (!isOpen) return null;

  const editionLabel = isGeniusMode ? 'GENIUS' : 'NORMIE';
  const totalCount = activeParagraphs.length;

  const fullCopyText = isGeniusMode
    ? GENESIS_THESIS_GENIUS_RAW_MARKDOWN
    : [
        `# ${GENESIS_THESIS_TITLE} (${editionLabel} EDITION)`,
        `**${GENESIS_THESIS_SUBTITLE}**`,
        '',
        ...activeParagraphs.map((p, idx) => {
          const prevPart = idx > 0 ? activeParagraphs[idx - 1].partTitle : null;
          const partPrefix = prevPart !== p.partTitle ? `## ${p.partTitle}\n\n` : '';
          const lawsBlock = p.laws
            .map((l) => `**Law:** ${l.law}\n**Equation:** \`${l.equation}\``)
            .join('\n');
          return `${partPrefix}### [${p.tag}]\n\n${lawsBlock}\n\n${p.text}`;
        })
      ].join('\n\n---\n\n');

  return (
    <div
      data-testid="genesis-thesis-modal"
      onClick={onClose}
      className="animate-modal-backdrop fixed inset-0 z-[70] bg-black/88 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="What Led The Truth To The Truth"
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-sheet w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#0D1014] border flex flex-col overflow-hidden shadow-[0_32px_100px_rgba(0,0,0,0.92)]"
        style={{ borderColor: accent.border }}
      >
        {/* Top Modal Header */}
        <div className="shrink-0 px-4 sm:px-7 py-4 bg-[#080A0D]/95 border-b border-white/[0.08] space-y-1.5">
          <div
            className="font-mono text-[9.5px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.2em] flex items-center gap-1.5 leading-none whitespace-nowrap"
            style={{ color: accent.primary }}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>
              ORIGIN THESIS // {totalCount} AXIOMS • {editionLabel}
            </span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-[17px] sm:text-2xl font-bold text-white tracking-tight leading-snug pt-0.5 min-w-0">
              What Led The Truth To... The Truth
            </h2>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onCopyFullThesis(fullCopyText)}
                  className="h-8 px-3 rounded-full bg-[#141820] hover:bg-[#1B202B] border border-white/15 font-mono text-[11px] font-semibold inline-flex items-center gap-1.5 transition"
                  style={{ color: accent.primary }}
                >
                  {copiedTarget === 'genesis-thesis' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Copied Thesis</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Copy Full Thesis</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-testid="genesis-modal-close"
                  aria-label="Close Genesis Thesis"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#141820] hover:bg-neutral-800 border border-white/15 flex items-center justify-center text-neutral-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                data-testid="genesis-depth-switch"
                className="h-7 p-0.5 rounded-full bg-[#121418] border border-white/10 inline-flex items-center font-mono text-[10.5px] leading-none shrink-0"
                role="group"
                aria-label="Genesis Thesis Depth Mode Switch"
              >
                <button
                  type="button"
                  onClick={() => onSetGeniusMode(false)}
                  className={`h-full px-3 rounded-full transition inline-flex items-center justify-center border border-transparent leading-none ${
                    !isGeniusMode
                      ? 'bg-[#1D212A] text-white font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  NORMIE
                </button>
                <button
                  type="button"
                  onClick={() => onSetGeniusMode(true)}
                  className={`h-full px-3 rounded-full transition inline-flex items-center justify-center gap-1 leading-none ${
                    isGeniusMode ? 'font-bold' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  style={
                    isGeniusMode
                      ? {
                          backgroundColor: accent.softBg,
                          color: accent.primary,
                          border: `1px solid ${accent.border}`
                        }
                      : { border: '1px solid transparent' }
                  }
                >
                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                  <span>GENIUS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Receipt Benchmarks + Chapter Tabs */}
        <div className="shrink-0 px-4 sm:px-7 py-3 bg-[#0A0C10] border-b border-white/[0.07] space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
            <div className="p-2.5 rounded-2xl bg-[#11151B] border border-white/[0.07]">
              <div className="text-[9.5px] uppercase tracking-wider text-neutral-500">
                Landauer Floor
              </div>
              <div className="text-xs font-bold mt-0.5" style={{ color: accent.primary }}>
                ΔQ ≥ kB·T·ln 2
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#11151B] border border-white/[0.07]">
              <div className="text-[9.5px] uppercase tracking-wider text-neutral-500">
                Weekly Labor
              </div>
              <div className="text-xs font-bold text-amber-300 mt-0.5">
                ~100 MJ (4,184 J/kcal)
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#11151B] border border-white/[0.07]">
              <div className="text-[9.5px] uppercase tracking-wider text-neutral-500">
                Weimar Kindling
              </div>
              <div className="text-xs font-bold text-orange-300 mt-0.5">
                ~16 MJ/kg Cellulose
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-[#11151B] border border-white/[0.07]">
              <div className="text-[9.5px] uppercase tracking-wider text-neutral-500">
                Cosmic Proof
              </div>
              <div className="text-xs font-bold text-emerald-300 mt-0.5">
                Canyon • Sequoia • Fossil
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
            {(
              [
                ['ALL', `All (${totalCount})`, Layers],
                ['INVARIANTS', 'I. Six Invariants (1–6)', Atom],
                ['INFLATION', 'II. 100 MJ Inflation (7–12)', Flame],
                ['COSMOS', 'III. Cosmic & Observer (13–19)', Sparkles],
                ['BETRAYAL', 'IV. Satoshi’s Betrayal (20–22)', ShieldAlert],
                ['UNIFIED', 'V. Unified Law (23)', Scale]
              ] as const
            ).map(([id, label, Icon]) => {
              const active = chapter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChapter(id)}
                  className={`h-7 px-2.5 rounded-full border leading-none transition inline-flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? 'font-bold'
                      : 'bg-[#12151C] text-neutral-400 border-white/10 hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: accent.softBg,
                          borderColor: accent.border,
                          color: accent.primary
                        }
                      : undefined
                  }
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manifesto Scroll Body */}
        <div
          data-testid="genesis-thesis-body"
          data-thesis-mode={isGeniusMode ? 'GENIUS' : 'NORMIE'}
          className="flex-1 overflow-y-auto px-4 sm:px-7 py-5 space-y-4"
        >
          {filteredParagraphs.map((para, idx) => {
            const showPartHeader =
              idx === 0 || filteredParagraphs[idx - 1].partTitle !== para.partTitle;
            return (
              <Fragment key={`${isGeniusMode ? 'G' : 'N'}-${para.id}`}>
                {showPartHeader && (
                  <div
                    data-testid={`thesis-part-header-${para.chapter}`}
                    className={`font-mono text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400 border-b border-white/[0.08] pb-2 ${
                      idx > 0 ? 'pt-3' : ''
                    }`}
                  >
                    {para.partTitle}
                  </div>
                )}

                <article
                  data-testid={`thesis-section-${para.id}`}
                  className="p-4 sm:p-5 rounded-2xl bg-[#090B0E] border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
                    <span style={{ color: accent.primary }}>{para.tag}</span>
                    <span className="text-neutral-600 shrink-0 whitespace-nowrap tabular-nums">
                      #{String(para.id).padStart(2, '0')} / {totalCount}
                    </span>
                  </div>

                  {para.laws.length > 0 && (
                    <div
                      data-testid="thesis-section-laws"
                      className="rounded-xl bg-[#0D1117] border border-white/[0.07] px-3.5 py-2.5 space-y-1.5"
                    >
                      {para.laws.map((item, lIdx) => (
                        <div key={lIdx} className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: accent.secondary }}
                            />
                            <span>{renderRichInline(item.law, `law-${para.id}-${lIdx}`)}</span>
                          </div>
                          <div
                            className="font-mono text-[11.5px] sm:text-[12.5px] font-semibold tracking-wide overflow-x-auto no-scrollbar whitespace-nowrap sm:whitespace-normal"
                            style={{ color: accent.primary }}
                          >
                            {item.equation}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <ThesisBodyContent text={para.text} sectionId={para.id} />
                </article>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Atom, Check, Copy, Flame, Layers, Sparkles, X } from 'lucide-react';
import type { GradeAccent } from '../data/rubricSpec.ts';
import {
  GENESIS_THESIS_PARAGRAPHS,
  GENESIS_THESIS_GENIUS_PARAGRAPHS,
  getGenesisThesisParagraphs,
  type ThesisChapterId
} from '../data/genesisThesisData.ts';

export { GENESIS_THESIS_PARAGRAPHS, GENESIS_THESIS_GENIUS_PARAGRAPHS };

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

  const fullCopyText = [
    `THE TRUTH // FIRST PRINCIPLES — WHAT LED THE TRUTH TO... THE TRUTH (${editionLabel} EDITION)`,
    'Physics Over Consensus • Thermodynamics, 100 MJ Human Work & Cosmic Proof-of-Work',
    '',
    ...activeParagraphs.map((p) => {
      const lawsBlock = p.laws
        .map((l) => `Law: ${l.law}\nEquation: ${l.equation}`)
        .join('\n');
      return `[${p.tag}]\n${lawsBlock}\n${p.text}`;
    })
  ].join('\n\n');

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
              ORIGIN THESIS // 17 AXIOMS • {editionLabel}
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
                Canyon • Sequoia • Rust
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px]">
            {(
              [
                ['ALL', 'All (17)', Layers],
                ['INVARIANTS', 'I. Six Invariants (1–6)', Atom],
                ['INFLATION', 'II. 100 MJ Inflation (7–12)', Flame],
                ['COSMOS', 'III. Cosmic PoW (13–17)', Sparkles]
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
          {filteredParagraphs.map((para) => (
            <article
              key={`${isGeniusMode ? 'G' : 'N'}-${para.id}`}
              data-testid={`thesis-section-${para.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-[#090B0E] border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
                <span style={{ color: accent.primary }}>{para.tag}</span>
                <span className="text-neutral-600 shrink-0 whitespace-nowrap">
                  #{String(para.id).padStart(2, '0')} / 17
                </span>
              </div>

              {para.laws.length > 0 && (
                <div
                  data-testid="thesis-section-laws"
                  className="rounded-xl bg-[#0D1117] border border-white/[0.07] px-3.5 py-2.5 space-y-1.5"
                >
                  {para.laws.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: accent.secondary }}
                        />
                        <span>{item.law}</span>
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

              <p className="text-[13.5px] sm:text-[14.5px] leading-[1.72] text-neutral-200 font-normal">
                {para.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

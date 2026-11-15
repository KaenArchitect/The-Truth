/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode
} from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Columns,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Flame,
  FlaskConical,
  Globe,
  Heart,
  Info,
  Layers,
  Lock,
  Pin,
  RefreshCw,
  Scale,
  Scissors,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
  Upload,
  X,
  ZoomIn,
  type LucideIcon
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { onSnapshot, query, where } from 'firebase/firestore';
import { PRELOADED_AUDITS, getGeniusForensicParagraphs } from './data/preloadedAudits.ts';
import {
  ALIAS_MAP,
  CORE_SCAN_STAGES,
  DEFAULT_SHORT_NAMES,
  DEFAULT_TITLES,
  GRADING_RUBRIC_SPEC,
  ORBIT_ANGLES_DEG,
  canonicalizeAuditsCollection,
  clampSingleInvariantByPhysics,
  computeRunningAuditAccent,
  deriveGradeFromTotal,
  enforceEnergyArbitrageLawOnAudit,
  formatScore,
  getGradeAccent,
  getHarmonizedScoreStyle,
  getScoreStyle,
  inspectStreamedAuditProgress,
  isResponseTextTruncated,
  resolveCanonicalAssetTicker,
  sanitizeInvLogsMap,
  sortAuditTickersByGrade,
  stripTrailingDash,
  type AuditData,
  type GroundingSource,
  type InvariantData,
  type InvariantLogEntry
} from './data/rubricSpec.ts';
import { PRIMARY_ADMIN_EMAIL } from './data/adminAccess.ts';
import {
  OperationType,
  collection,
  deleteAuditDocumentFromFirestore,
  firebaseAuth,
  firestoreDb,
  getFirebaseIdToken,
  handleFirestoreError,
  isVerifiedAdminUser,
  persistAuditDocumentToFirestore,
  signInWithGoogleArchive,
  signOutArchive,
  testFirestoreConnection
} from './lib/firebase.ts';
import {
  DEFAULT_NUCLEUS_ECHO_D,
  DEFAULT_NUCLEUS_INNER_D,
  DEFAULT_NUCLEUS_MAIN_D,
  DEFAULT_SAT_ECHO_D,
  DEFAULT_SAT_INNER_D,
  DEFAULT_SAT_MAIN_D,
  HarmonicProjectBubble,
  NUCLEUS_LUT_ECHO,
  NUCLEUS_LUT_INNER,
  NUCLEUS_LUT_MAIN,
  PinnedOrbitalNode,
  SAT_LUT_ECHO,
  SAT_LUT_INNER,
  SAT_LUT_MAIN,
  buildFastWavePath,
  getConstellationLayout,
  setGlobalWavePaused,
  subscribeSharedWave,
  type FourFormationMode,
  type ThreeFormationMode
} from './components/OrbitalNodes.tsx';
import { WartimeSpliceSimulator } from './components/WartimeSpliceSimulator.tsx';
import { ThermodynamicGainsModal } from './components/ThermodynamicGainsModal.tsx';
import {
  buildBasketSyncedCohortRecord,
  computeCohortAggregateSummary,
  formatPctSigned
} from './data/gainsCohortData.ts';
import { TutorialOverlay } from './components/TutorialOverlay.tsx';
import {
  MOBILE_TUTORIAL_STEPS,
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  clampTutorialStepIndex,
  type TutorialActionId
} from './data/tutorialSteps.ts';
import { resolvePinOrientationMode } from './data/constellationOrientation.ts';
import {
  DAILY_NEW_FULL_PULL_LIMIT,
  type QuotaStatus
} from './data/auditQuotaAndScope.ts';
import {
  CORE_REFERENCE_TICKERS,
  ECOSYSTEM_OVERLAY_TICKERS,
  classifyAuditQueryForSandbox,
  getAuditProvenance,
  getAuditRevisionAnalysis,
  isSandboxUrlEnabled,
  partitionTickersByEcosystem
} from './data/auditProvenance.ts';
import { GenesisThesisModal } from './components/GenesisThesisModal.tsx';
import { GeniusSearchWaveRings } from './components/GeniusSearchWaveRings.tsx';
import { AuditChaosWaveRings } from './components/AuditChaosWaveRings.tsx';
import { GeniusUniverseBackground } from './components/GeniusUniverseBackground.tsx';
import { ARCHIVE_PULL_STAGE_MS } from './data/auditChaosWave.ts';
import {
  answerArchiveResearchQuestion,
  buildArchiveComparison,
  findArchivedAudit,
  listArchivedAudits,
  parseDeepLinkSearchParams,
  summarizeArchivedAudit,
  type ArchivedAuditListFilters
} from './data/agentArchiveApi.ts';
import { computeDisplayLayoutMetrics } from './data/displayScale.ts';

const INVARIANT_ICONS: Record<string, LucideIcon> = {
  '01': ShieldCheck,
  '02': Flame,
  '03': Clock,
  '04': Globe,
  '05': Cpu,
  '06': Activity
};

const LOCAL_AUDITS_STORAGE_KEY = 'truth_custom_audits_v1';
const SANDBOX_AUDITS_STORAGE_KEY = 'truth_sandbox_audits_v1';
const LOCAL_LOGS_STORAGE_KEY = 'truth_inv_logs_v1';
const LOCAL_QUOTA_CLIENT_ID_KEY = 'truth_quota_client_id_v1';

function getOrCreateClientQuotaId(): string {
  if (typeof window === 'undefined') return 'ssr-client';
  try {
    const existing = window.localStorage.getItem(LOCAL_QUOTA_CLIENT_ID_KEY);
    if (existing && existing.trim().length >= 8) return existing.trim();
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `truth-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(LOCAL_QUOTA_CLIENT_ID_KEY, generated);
    return generated;
  } catch {
    return 'ephemeral-client';
  }
}

interface ExitingPinEntry {
  ghostId: string;
  auditObj: AuditData;
  x: number;
  y: number;
  nodeScale: number;
}

interface ArchiveToastState {
  text: string;
  tone: 'hit' | 'saved' | 'warn';
}

interface SingleInvBusyState {
  key: string;
  mode: 'REAUDIT' | 'CHALLENGE' | 'BREAKDOWN';
}

interface SingleInvNoticeState {
  type: 'warn' | 'error';
  text: string;
}

interface AuditStreamTracker {
  done: boolean;
  failed: boolean;
  outOfScope: boolean;
  outOfScopeMessage: string | null;
  error: Error | null;
  result: AuditData | null;
  quota: QuotaStatus | null;
  sandbox: boolean;
  unlockedCount: number;
  colors: Record<number, string>;
  scores: Record<number, number>;
  freshSources: GroundingSource[];
}

interface AuditSseEvent {
  type: 'intel' | 'chunk' | 'done' | 'error';
  sources?: GroundingSource[];
  text?: string;
  audit?: AuditData | null;
  outOfScope?: boolean;
  sandbox?: boolean;
  maxRank?: number;
  detectedRank?: number | null;
  cachedHit?: boolean;
  message?: string;
  quota?: QuotaStatus;
}

interface SingleInvariantPatchPayload {
  score: number;
  telemetry?: string;
  quickSummary?: string;
  paragraph?: string;
  geniusParagraph?: string;
  receipts?: string[];
  hasGenesisPremineOrVcOrIco?: boolean;
  hasProtocolDevTaxOrKillSwitch?: boolean;
  carrierLayerOneVelocityCap?: number;
}

function loadLocalAuditsSnapshot(): Record<string, AuditData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_AUDITS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AuditData>;
    if (!parsed || typeof parsed !== 'object') return {};
    return canonicalizeAuditsCollection(parsed);
  } catch {
    return {};
  }
}

function loadSandboxAuditsSnapshot(): Record<string, AuditData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SANDBOX_AUDITS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, AuditData>;
    if (!parsed || typeof parsed !== 'object') return {};
    return canonicalizeAuditsCollection(parsed);
  } catch {
    return {};
  }
}

function loadLocalLogsSnapshot(): Record<string, InvariantLogEntry[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_LOGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return sanitizeInvLogsMap(parsed);
  } catch {
    return {};
  }
}

function ProvenanceBadgesStrip({
  audit,
  isSandbox,
  compact = false
}: {
  audit: AuditData;
  isSandbox: boolean;
  compact?: boolean;
}) {
  const prov = getAuditProvenance(audit, {
    preloadedTickers: new Set(Object.keys(PRELOADED_AUDITS)),
    isSandbox
  });

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 ${
        compact ? 'text-[9.5px]' : 'text-[10px]'
      } font-mono`}
    >
      <span
        tabIndex={0}
        title={prov.methodologyTooltip}
        className={`group relative inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border cursor-help ${
          prov.isDeterministicReference
            ? 'bg-[#49EACB]/10 text-[#49EACB] border-[#49EACB]/35'
            : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/35'
        }`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: prov.isDeterministicReference ? '#49EACB' : '#FACC15' }}
        />
        <span className="font-semibold">{prov.provenanceBadge}</span>
        <Info className="w-2.5 h-2.5 opacity-75 shrink-0" />
        <span
          role="tooltip"
          className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-64 sm:w-72 p-2.5 rounded-xl bg-[#07080A] border border-white/15 text-[10px] leading-relaxed text-neutral-200 text-left shadow-[0_12px_30px_rgba(0,0,0,0.85)] font-normal"
        >
          {prov.methodologyTooltip}
        </span>
      </span>

      {prov.categoryBadge && (
        <span
          title="Ecosystem application, L2 rollup, channel overlay, or fiat currency overlay."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/12 text-indigo-300 border border-indigo-400/35 font-semibold"
        >
          <Layers className="w-2.5 h-2.5 shrink-0" />
          <span>{prov.categoryBadge}</span>
        </span>
      )}

      {prov.isSandbox && (
        <span
          title="Sandbox / Local Preview audit stored strictly in browser localStorage and excluded from the public archive."
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-300 border border-amber-400/40 font-semibold"
        >
          <FlaskConical className="w-2.5 h-2.5 shrink-0" />
          <span>Sandbox • Local Only</span>
        </span>
      )}
    </div>
  );
}

function ThermodynamicAuditApp() {
  const [sandboxTickers, setSandboxTickers] = useState<string[]>(() =>
    Object.keys(loadSandboxAuditsSnapshot())
  );
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() =>
    typeof window !== 'undefined' ? isSandboxUrlEnabled(window.location.search) : false
  );
  const [audits, setAudits] = useState<Record<string, AuditData>>(() =>
    canonicalizeAuditsCollection({
      ...PRELOADED_AUDITS,
      ...loadLocalAuditsSnapshot(),
      ...loadSandboxAuditsSnapshot()
    })
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  // Mode Toggle: false = Normie Mode (Default), true = Genius Mode (Full 6-Paragraph Forensic Audit)
  const [isGeniusMode, setIsGeniusMode] = useState(false);
  const [isRubricOpen, setIsRubricOpen] = useState(false);

  // Shared Persistent Archive & API Credit Shield State
  const [archiveUser, setArchiveUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [serverIsAdmin, setServerIsAdmin] = useState(false);
  const [adminActionBusy, setAdminActionBusy] = useState<string | null>(null);
  const isAdminSession = Boolean(archiveUser && (isVerifiedAdminUser(archiveUser) || serverIsAdmin));
  const [archiveStatus, setArchiveStatus] = useState<'CONNECTING' | 'SYNCED' | 'SESSION_ARCHIVE'>(
    firestoreDb ? 'CONNECTING' : 'SESSION_ARCHIVE'
  );
  const [archivedCloudCount, setArchivedCloudCount] = useState(0);
  const [zeroTokenHits, setZeroTokenHits] = useState(0);
  const [dynamicAliases, setDynamicAliases] = useState<Record<string, string>>({});
  const [strictCreditLock, setStrictCreditLock] = useState(false);
  const [dailyQuota, setDailyQuota] = useState<QuotaStatus>({
    limit: DAILY_NEW_FULL_PULL_LIMIT,
    used: 0,
    remaining: DAILY_NEW_FULL_PULL_LIMIT,
    allowed: true,
    dayKey: '',
    resetAtUtc: ''
  });
  const [confirmFullReauditKey, setConfirmFullReauditKey] = useState<string | null>(null);
  const [archiveToast, setArchiveToast] = useState<ArchiveToastState | null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isGainsModalOpen, setIsGainsModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isGenesisModalOpen, setIsGenesisModalOpen] = useState(false);
  const [truthDotHoldProgress, setTruthDotHoldProgress] = useState(0);
  const [truthExplosionActive, setTruthExplosionActive] = useState(false);
  const truthDotRafRef = useRef<number | null>(null);
  const truthDotStartRef = useRef<number | null>(null);
  const truthDotTriggeredRef = useRef(false);
  const truthExplosionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPillRef = useRef<HTMLDivElement | null>(null);
  const [donateConfig, setDonateConfig] = useState<{
    kasAddress?: string;
    btcAddress?: string;
    ethAddress?: string;
    solAddress?: string;
  }>({});
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    if (parseDeepLinkSearchParams(window.location.search).hasDeepLink) return false;
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) !== '1';
  });
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  // Orbital Fission & Multi-Bubble Pinning / Constellation Formation State
  const [isArenaHovered, setIsArenaHovered] = useState(false);
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [exitingPins, setExitingPins] = useState<ExitingPinEntry[]>([]);
  const [threeFormation, setThreeFormation] = useState<ThreeFormationMode>('TRIANGLE');
  const [fourFormation, setFourFormation] = useState<FourFormationMode>('RHOMBUS');
  const [expandAllOrbits, setExpandAllOrbits] = useState(true);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const singleStageWrapRef = useRef<HTMLDivElement | null>(null);
  const heroDockRef = useRef<HTMLDivElement | null>(null);
  const searchDockRef = useRef<HTMLFormElement | null>(null);
  const backdropRootRef = useRef<HTMLDivElement | null>(null);
  const constellationMeasureRef = useRef<HTMLDivElement | null>(null);
  const [constellationWrapWidth, setConstellationWrapWidth] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
      ? Math.max(280, window.innerWidth - 24)
      : 1120
  );
  const [hoveredInvId, setHoveredInvId] = useState<string | null>(null);
  const [expandedSyncInvId, setExpandedSyncInvId] = useState<string | null>(null);
  const [isScanningPulse, setIsScanningPulse] = useState(false);

  // Modal Sheet State & Wartime Simulator Anchor Refs
  const [modalInvId, setModalInvId] = useState<string | null>(null);
  const [essayViewMode, setEssayViewMode] = useState(false);
  const [showScoreConditions, setShowScoreConditions] = useState(false);
  const isModalOpen = Boolean(modalInvId);
  useEffect(() => {
    setShowScoreConditions(false);
  }, [isModalOpen, activeKey]);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const simAnchorRef = useRef<HTMLDivElement | null>(null);
  const syncComparisonAnchorRef = useRef<HTMLDivElement | null>(null);

  // Clipboard Feedback State
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  // Live Custom Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStatusMsg, setAuditStatusMsg] = useState('');
  const [auditError, setAuditError] = useState<string | null>(null);
  const [scanTargetTicker, setScanTargetTicker] = useState('');
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [scanCodeTick, setScanCodeTick] = useState(0);
  const [scanProgressPct, setScanProgressPct] = useState(0);
  const [resolvedStepColors, setResolvedStepColors] = useState<Record<number, string>>({});
  const [resolvedStepScores, setResolvedStepScores] = useState<Record<number, number>>({});

  // Single-Invariant Interactive Console State (Challenge / More Breakdown / Low-Token 1-Inv Re-Audit)
  const [invPromptInputs, setInvPromptInputs] = useState<Record<string, string>>({});
  const [invLogs, setInvLogs] = useState<Record<string, InvariantLogEntry[]>>(() =>
    loadLocalLogsSnapshot()
  );
  const [singleInvBusy, setSingleInvBusy] = useState<SingleInvBusyState | null>(null);
  const [singleInvNotice, setSingleInvNotice] = useState<SingleInvNoticeState | null>(null);
  const [viewportMetrics, setViewportMetrics] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
    isCoarsePointer:
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)').matches
        : false
  }));
  const isMobileViewport = viewportMetrics.width < 768;
  const isLgDesktop = viewportMetrics.width >= 1024;
  const displayMetrics = useMemo(
    () => computeDisplayLayoutMetrics(viewportMetrics),
    [viewportMetrics]
  );
  const pinOrientationMode = resolvePinOrientationMode(viewportMetrics);

  // Refs for the Grade-Scaled Harmonic Wave Circle Shape (when not hovering)
  const mainWavePathRef = useRef<SVGPathElement | null>(null);
  const echoWavePathRef = useRef<SVGPathElement | null>(null);
  const innerWavePathRef = useRef<SVGPathElement | null>(null);
  const waveStateRef = useRef({ phase: 0, amp: 0 });

  // Refs for the 6 Satellite Invariant Bubbles (energy transfers here when expanded)
  const satMainWaveRefs = useRef<Array<SVGPathElement | null>>([]);
  const satEchoWaveRefs = useRef<Array<SVGPathElement | null>>([]);
  const satInnerWaveRefs = useRef<Array<SVGPathElement | null>>([]);
  const satWaveStatesRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({ phase: i * 1.05, amp: 0 }))
  );

  const isAnyModalOpen = Boolean(
    modalInvId ||
      isRubricOpen ||
      isArchiveModalOpen ||
      isGainsModalOpen ||
      isDonateModalOpen ||
      isGenesisModalOpen
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const updateViewport = () => {
      const isCoarsePointer =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(pointer: coarse)').matches
          : false;
      setViewportMetrics({
        width: window.innerWidth,
        height: window.innerHeight,
        isCoarsePointer
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    const orientationMq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(orientation: portrait)')
        : null;
    if (orientationMq) {
      if (orientationMq.addEventListener) {
        orientationMq.addEventListener('change', updateViewport);
      } else {
        orientationMq.addListener(updateViewport);
      }
    }
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      if (orientationMq) {
        if (orientationMq.removeEventListener) {
          orientationMq.removeEventListener('change', updateViewport);
        } else {
          orientationMq.removeListener(updateViewport);
        }
      }
    };
  }, []);

  useEffect(() => {
    setGlobalWavePaused(isAnyModalOpen);
    return () => setGlobalWavePaused(false);
  }, [isAnyModalOpen]);

  // Escape key closes open dialogs cleanly
  useEffect(() => {
    if (!isAnyModalOpen) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isGenesisModalOpen) setIsGenesisModalOpen(false);
        else if (isDonateModalOpen) setIsDonateModalOpen(false);
        else if (isGainsModalOpen) setIsGainsModalOpen(false);
        else if (isArchiveModalOpen) setIsArchiveModalOpen(false);
        else if (isRubricOpen) setIsRubricOpen(false);
        else if (modalInvId) setModalInvId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isAnyModalOpen,
    isGenesisModalOpen,
    isDonateModalOpen,
    isGainsModalOpen,
    isArchiveModalOpen,
    isRubricOpen,
    modalInvId
  ]);

  useEffect(() => {
    if (isAnyModalOpen && isTutorialOpen) {
      setIsTutorialOpen(false);
    }
  }, [isAnyModalOpen, isTutorialOpen]);

  const sortedTickers = sortAuditTickersByGrade(audits);
  const passedTickers = sortedTickers.filter((tk) => {
    const a = audits[tk];
    return a && Number(a.totalScore) > 1.0 && String(a.grade || '').toUpperCase() !== 'F';
  });
  const failedTickers = sortedTickers.filter((tk) => {
    const a = audits[tk];
    return a && (Number(a.totalScore) <= 1.0 || String(a.grade || '').toUpperCase() === 'F');
  });
  const { coreTickers: corePassedTickers, ecosystemTickers: ecosystemPassedTickers } = useMemo(
    () => partitionTickersByEcosystem(passedTickers, audits),
    [passedTickers, audits]
  );
  const { coreTickers: coreFailedTickers, ecosystemTickers: ecosystemFailedTickers } = useMemo(
    () => partitionTickersByEcosystem(failedTickers, audits),
    [failedTickers, audits]
  );
  const { coreTickers: coreDirectoryTickers, ecosystemTickers: ecosystemDirectoryTickers } = useMemo(
    () => partitionTickersByEcosystem(sortedTickers, audits),
    [sortedTickers, audits]
  );
  const sandboxTickerSet = useMemo(() => new Set(sandboxTickers), [sandboxTickers]);

  const basketGainsSummary = useMemo(() => {
    const synced = buildBasketSyncedCohortRecord(audits);
    const toLiquid = (arr: typeof synced.passed) =>
      arr
        .filter((i) => i.liquidCycle && i.basePrice && i.snapshotSpot)
        .map((i) => ({
          ticker: i.ticker,
          cyclePct: ((i.snapshotSpot! - i.basePrice!) / i.basePrice!) * 100,
          multiple: i.snapshotSpot! / i.basePrice!,
          tactical90dPct: i.tactical90dPct,
          liquidCycle: i.liquidCycle,
          isOutlier: i.isOutlier
        }));
    return computeCohortAggregateSummary(
      toLiquid(synced.passed),
      toLiquid(synced.failed),
      1000,
      false
    );
  }, [audits]);

  const flashArchiveToast = (text: string, tone: ArchiveToastState['tone'] = 'hit') => {
    setArchiveToast({ text, tone });
  };

  useEffect(() => {
    if (!archiveToast) return undefined;
    const t = setTimeout(() => setArchiveToast(null), 3600);
    return () => clearTimeout(t);
  }, [archiveToast]);

  // Persist custom/updated audits & sandbox previews separately so sandbox tests never leak into shared vaults
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const customOrUpdated: Record<string, AuditData> = {};
      const sandboxSnapshot: Record<string, AuditData> = {};
      Object.entries(audits).forEach(([k, val]) => {
        if (sandboxTickerSet.has(k) && !PRELOADED_AUDITS[k]) {
          sandboxSnapshot[k] = val;
        } else if (!PRELOADED_AUDITS[k] || val.lastFreshAuditAt || val.archivedAtLabel) {
          customOrUpdated[k] = val;
        }
      });
      window.localStorage.setItem(LOCAL_AUDITS_STORAGE_KEY, JSON.stringify(customOrUpdated));
      window.localStorage.setItem(SANDBOX_AUDITS_STORAGE_KEY, JSON.stringify(sandboxSnapshot));
    } catch {
      // Ignore storage quota errors
    }
  }, [audits, sandboxTickerSet]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_LOGS_STORAGE_KEY, JSON.stringify(invLogs));
    } catch {
      // Ignore storage quota errors
    }
  }, [invLogs]);

  const syncServerConfigAndQuota = useCallback(async (userOverride?: User | null) => {
    const clientId = getOrCreateClientQuotaId();
    const idToken = userOverride !== null ? await getFirebaseIdToken() : null;
    try {
      const res = await fetch('/api/config', {
        headers: {
          'x-truth-client-id': clientId,
          ...(userOverride?.uid ? { 'x-truth-user-id': userOverride.uid } : {}),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        }
      });
      if (!res.ok) return;
      const cfg = (await res.json()) as {
        strictCreditLock?: boolean;
        isAdmin?: boolean;
        dailyQuota?: QuotaStatus;
        donate?: {
          kasAddress?: string;
          btcAddress?: string;
          ethAddress?: string;
          solAddress?: string;
        };
      } | null;
      if (!cfg) return;
      setServerIsAdmin(Boolean(cfg.isAdmin));
      setStrictCreditLock(Boolean(cfg.strictCreditLock));
      if (cfg.dailyQuota) {
        setDailyQuota(cfg.dailyQuota);
      }
      if (cfg.donate) {
        setDonateConfig(cfg.donate);
      }
    } catch {
      // Ignore transient offline config fetch failure
    }
  }, []);

  // Hydrate server config (STRICT_CREDIT_LOCK, admin capability, daily quota) and persistent server disk cache (/api/cache)
  useEffect(() => {
    let active = true;
    void syncServerConfigAndQuota(firebaseAuth?.currentUser || undefined);

    fetch('/api/cache')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { audits?: Record<string, AuditData> } | null) => {
        if (!active || !payload?.audits) return;
        const serverAudits: Record<string, AuditData> = {};
        const serverAliases: Record<string, string> = {};
        Object.entries(payload.audits).forEach(([tk, item]) => {
          if (item && Array.isArray(item.invariants) && item.invariants.length >= 6) {
            const cleanTk = String(item.ticker || tk).toUpperCase();
            serverAudits[cleanTk] = enforceEnergyArbitrageLawOnAudit({
              ...item,
              ticker: cleanTk,
              isArchived: true
            });
            if (Array.isArray(item.queryAliases)) {
              item.queryAliases.forEach((al) => {
                const norm = String(al || '')
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '');
                if (norm) serverAliases[norm] = cleanTk;
              });
            }
          }
        });
        if (Object.keys(serverAudits).length > 0) {
          setDynamicAliases((prev) => ({ ...prev, ...serverAliases }));
          setAudits((prev) =>
            canonicalizeAuditsCollection({ ...PRELOADED_AUDITS, ...prev, ...serverAudits })
          );
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [syncServerConfigAndQuota]);

  // Observe Google Auth state for verified Firestore Cloud Archive writes & admin / daily pull quota
  useEffect(() => {
    if (!firebaseAuth) return undefined;
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setArchiveUser(u);
      if (!u) {
        setServerIsAdmin(false);
      }
      void syncServerConfigAndQuota(u);
    });
    return () => unsub();
  }, [syncServerConfigAndQuota]);

  // Public 0-Credit Firestore Archive Listener + Reachability Check
  useEffect(() => {
    if (!firestoreDb) {
      setArchiveStatus('SESSION_ARCHIVE');
      return undefined;
    }

    let active = true;
    testFirestoreConnection().then((ok) => {
      if (active && !ok) {
        setArchiveStatus('SESSION_ARCHIVE');
      }
    });

    const archiveColRef = collection(firestoreDb, 'archived_audits');
    const archiveQuery = query(archiveColRef, where('isArchived', '==', true));

    const unsubSnapshot = onSnapshot(
      archiveQuery,
      (snapshot) => {
        const remoteAudits: Record<string, AuditData> = {};
        const remoteLogs: Record<string, InvariantLogEntry[]> = {};
        const remoteAliases: Record<string, string> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          if (
            !data ||
            !data.ticker ||
            !Array.isArray(data.invariants) ||
            data.invariants.length < 6
          ) {
            return;
          }
          const tk = String(data.ticker)
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, '');
          if (!tk) return;

          const archivedInvLogs = data.archivedInvLogs as
            | Record<string, InvariantLogEntry[]>
            | undefined;
          const docSources = Array.isArray(data.sources)
            ? (data.sources as GroundingSource[])
            : undefined;

          const candidateAudit = {
            ...(data as unknown as AuditData),
            ticker: tk,
            freshSources: docSources || (data.freshSources as GroundingSource[] | undefined),
            isArchived: true
          };

          remoteAudits[tk] = enforceEnergyArbitrageLawOnAudit(candidateAudit);

          if (archivedInvLogs && typeof archivedInvLogs === 'object') {
            const cleanedMap = sanitizeInvLogsMap(archivedInvLogs);
            Object.entries(cleanedMap).forEach(([invId, logsArr]) => {
              if (Array.isArray(logsArr) && logsArr.length > 0) {
                remoteLogs[`${tk}:${invId}`] = logsArr;
              }
            });
          }

          if (Array.isArray(data.queryAliases)) {
            data.queryAliases.forEach((al) => {
              const norm = String(al || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
              if (norm) remoteAliases[norm] = tk;
            });
          }
        });

        setArchivedCloudCount(Object.keys(remoteAudits).length);
        setDynamicAliases((prev) => ({ ...prev, ...remoteAliases }));
        setAudits((prev) =>
          canonicalizeAuditsCollection({
            ...PRELOADED_AUDITS,
            ...prev,
            ...remoteAudits
          })
        );
        setInvLogs((prev) => ({
          ...prev,
          ...remoteLogs
        }));
        setArchiveStatus('SYNCED');
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'archived_audits');
        setArchiveStatus('SESSION_ARCHIVE');
      }
    );

    return () => {
      active = false;
      unsubSnapshot();
    };
  }, []);

  // Writes an audited or contested asset + its invariant logs into local vault + verified Firestore archive
  const persistAuditToArchive = async (
    auditToSave: AuditData,
    logsStateOverride: Record<string, InvariantLogEntry[]> | null = null,
    extraAliases: string[] = []
  ): Promise<boolean> => {
    if (!auditToSave || !auditToSave.ticker) return false;
    const tk = String(auditToSave.ticker)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!tk) return false;

    const activeLogsSource = logsStateOverride || invLogs;
    const archivedInvLogs: Record<string, InvariantLogEntry[]> = {};
    ['01', '02', '03', '04', '05', '06'].forEach((invId) => {
      const key = `${tk}:${invId}`;
      if (Array.isArray(activeLogsSource[key]) && activeLogsSource[key].length > 0) {
        archivedInvLogs[invId] = activeLogsSource[key].slice(0, 10);
      }
    });

    const aliasSet = new Set(
      [
        tk,
        auditToSave.name,
        ...(Array.isArray(auditToSave.queryAliases) ? auditToSave.queryAliases : []),
        ...extraAliases
      ]
        .map((s) =>
          String(s || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
        )
        .filter(Boolean)
    );
    const mergedAliases = Array.from(aliasSet).slice(0, 20);

    setDynamicAliases((prev) => {
      const next = { ...prev };
      mergedAliases.forEach((al) => {
        next[al] = tk;
      });
      return next;
    });

    return persistAuditDocumentToFirestore(auditToSave, archivedInvLogs, mergedAliases);
  };

  const handleGoogleArchiveAuth = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      if (archiveUser) {
        await signOutArchive();
        setServerIsAdmin(false);
        flashArchiveToast('Signed out of Cloud Archive Sync (Public Read-Only active)', 'hit');
      } else {
        const signedIn = await signInWithGoogleArchive();
        if (signedIn) {
          setAuditError(null);
          await syncServerConfigAndQuota(signedIn);
          if (isVerifiedAdminUser(signedIn)) {
            flashArchiveToast(
              `Admin Access Active (${signedIn.email}) • Unlimited Pulls Unlocked`,
              'saved'
            );
          } else {
            flashArchiveToast(
              `Google Cloud Sync Active (${signedIn.email || 'Verified'})`,
              'saved'
            );
          }
        }
      }
    } catch (err) {
      flashArchiveToast(
        err instanceof Error ? err.message : 'Google authentication cancelled or blocked.',
        'warn'
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminClearQuota = async () => {
    if (!isAdminSession || adminActionBusy) return;
    setAdminActionBusy('clear-quota');
    try {
      const idToken = await getFirebaseIdToken(true);
      if (!idToken) throw new Error('Verified Google Admin session required.');
      const res = await fetch('/api/admin/clear-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });
      const payload = (await res.json().catch(() => null)) as {
        dailyQuota?: QuotaStatus;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
      if (payload?.dailyQuota) setDailyQuota(payload.dailyQuota);
      flashArchiveToast('Admin: Daily quota ledger & IP rate limits cleared', 'saved');
    } catch (err) {
      flashArchiveToast(
        err instanceof Error ? err.message : 'Failed to clear server quotas.',
        'warn'
      );
    } finally {
      setAdminActionBusy(null);
    }
  };

  const handleAdminPurgeCache = async () => {
    if (!isAdminSession || adminActionBusy) return;
    setAdminActionBusy('purge-cache');
    try {
      const idToken = await getFirebaseIdToken(true);
      if (!idToken) throw new Error('Verified Google Admin session required.');
      const res = await fetch('/api/admin/purge-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        }
      });
      const payload = (await res.json().catch(() => null)) as {
        cachedCount?: number;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);
      flashArchiveToast(
        `Admin: Server vault re-synced (${payload?.cachedCount ?? sortedTickers.length} assets)`,
        'saved'
      );
    } catch (err) {
      flashArchiveToast(
        err instanceof Error ? err.message : 'Failed to re-sync server cache.',
        'warn'
      );
    } finally {
      setAdminActionBusy(null);
    }
  };

  const handleAdminDeleteAudit = async (ticker: string) => {
    if (!isAdminSession || adminActionBusy) return;
    const cleanTk = String(ticker || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (!cleanTk) return;

    setAdminActionBusy(`delete:${cleanTk}`);
    try {
      const idToken = await getFirebaseIdToken(true);
      if (!idToken) throw new Error('Verified Google Admin session required.');
      const res = await fetch('/api/admin/delete-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ ticker: cleanTk })
      });
      const payload = (await res.json().catch(() => null)) as {
        restoredBaseline?: boolean;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(payload?.error || `HTTP ${res.status}`);

      await deleteAuditDocumentFromFirestore(cleanTk);

      setAudits((prev) => {
        const next = { ...prev };
        if (PRELOADED_AUDITS[cleanTk]) {
          next[cleanTk] = PRELOADED_AUDITS[cleanTk];
        } else {
          delete next[cleanTk];
        }
        return canonicalizeAuditsCollection(next);
      });
      if (!PRELOADED_AUDITS[cleanTk]) {
        setPinnedKeys((prev) => prev.filter((k) => k !== cleanTk));
        setActiveKey((prev) => (prev === cleanTk ? null : prev));
      }
      flashArchiveToast(
        PRELOADED_AUDITS[cleanTk]
          ? `Admin: Reset $${cleanTk} to deterministic baseline`
          : `Admin: Deleted $${cleanTk} from Vault`,
        'saved'
      );
    } catch (err) {
      flashArchiveToast(
        err instanceof Error ? err.message : `Failed to delete $${cleanTk}.`,
        'warn'
      );
    } finally {
      setAdminActionBusy(null);
    }
  };

  const handleImportArchiveSnapshot = async () => {
    const raw = importJsonText.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        audits?: Record<string, AuditData>;
        invLogs?: Record<string, InvariantLogEntry[]>;
      } & Record<string, unknown>;
      const mapCandidate =
        parsed.audits && typeof parsed.audits === 'object' ? parsed.audits : parsed;
      const importedAudits: Record<string, AuditData> = {};
      let importedCount = 0;

      Object.entries(mapCandidate).forEach(([k, val]) => {
        const candidate = val as AuditData | undefined;
        if (
          candidate &&
          typeof candidate === 'object' &&
          Array.isArray(candidate.invariants) &&
          candidate.invariants.length === 6
        ) {
          const tk = String(candidate.ticker || k)
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, '');
          if (tk) {
            importedAudits[tk] = enforceEnergyArbitrageLawOnAudit({
              ...candidate,
              ticker: tk,
              isArchived: true
            });
            importedCount++;
          }
        }
      });

      if (importedCount === 0) {
        flashArchiveToast('No valid 6-invariant audits found in JSON.', 'warn');
        return;
      }

      setAudits((prev) => canonicalizeAuditsCollection({ ...prev, ...importedAudits }));
      const cleanedImportedLogs =
        parsed.invLogs && typeof parsed.invLogs === 'object'
          ? sanitizeInvLogsMap(parsed.invLogs)
          : {};
      const nextLogsMap =
        Object.keys(cleanedImportedLogs).length > 0
          ? { ...invLogs, ...cleanedImportedLogs }
          : invLogs;
      if (Object.keys(cleanedImportedLogs).length > 0) {
        setInvLogs(nextLogsMap);
      }

      if (firestoreDb && archiveUser?.emailVerified) {
        for (const tk of Object.keys(importedAudits)) {
          await persistAuditToArchive(importedAudits[tk], nextLogsMap, [tk]);
        }
      }

      setImportJsonText('');
      setShowImportBox(false);
      flashArchiveToast(`Imported & archived ${importedCount} token audits (0 API credits).`, 'saved');
    } catch {
      flashArchiveToast('Invalid JSON snapshot format.', 'warn');
    }
  };

  const validPinnedKeys = pinnedKeys.filter((k) => Boolean(audits[k]));
  const hasActiveAudit = Boolean(activeKey && audits[activeKey]);
  const isPinned = Boolean(hasActiveAudit && activeKey && validPinnedKeys.includes(activeKey));
  const stageTickers: string[] = isAuditing
    ? hasActiveAudit && activeKey
      ? [activeKey]
      : []
    : validPinnedKeys.length > 0
    ? hasActiveAudit && activeKey && !validPinnedKeys.includes(activeKey)
      ? validPinnedKeys.length < 4
        ? [...validPinnedKeys, activeKey]
        : [...validPinnedKeys.slice(0, 3), activeKey]
      : validPinnedKeys.slice(0, 4)
    : hasActiveAudit && activeKey
    ? [activeKey]
    : [];
  const isMultiStage = !isAuditing && stageTickers.length > 1;
  const isLandingIdle = !isAuditing && !hasActiveAudit && validPinnedKeys.length === 0;

  useEffect(() => {
    if (!isMultiStage && expandedSyncInvId) {
      setExpandedSyncInvId(null);
    }
  }, [isMultiStage, expandedSyncInvId]);

  useEffect(() => {
    if (!isMultiStage) return undefined;
    const el = constellationMeasureRef.current;
    if (!el) return undefined;

    const updateWidth = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 180) setConstellationWrapWidth(Math.floor(w));
    };

    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isMultiStage, stageTickers.length]);

  useLayoutEffect(() => {
    const syncForegroundCenterToBackdrop = () => {
      const root = backdropRootRef.current;
      const rootRect = root ? root.getBoundingClientRect() : null;
      const backdropCenterY =
        rootRect && rootRect.height > 0 ? rootRect.top + rootRect.height / 2 : window.innerHeight * 0.5;

      const heroEl = heroDockRef.current;
      const searchEl = searchDockRef.current;
      if (isLandingIdle && heroEl && searchEl) {
        const m = new DOMMatrixReadOnly(window.getComputedStyle(heroEl).transform);
        const currentTy = Number.isFinite(m.m42) ? m.m42 : 0;
        const searchRect = searchEl.getBoundingClientRect();
        if (searchRect.height > 0) {
          const searchCenterAtTy0 = searchRect.top + searchRect.height / 2 - currentTy;
          const targetTy = Math.max(0, backdropCenterY - searchCenterAtTy0);
          heroEl.style.setProperty('--hero-landing-y', `${targetTy.toFixed(2)}px`);
        }
      }

      const wrapEl = singleStageWrapRef.current;
      const arenaEl = arenaRef.current;
      if (wrapEl && arenaEl && !isLandingIdle && !isMultiStage) {
        if (isMobileViewport) {
          wrapEl.style.paddingTop = '0px';
          wrapEl.style.marginTop = '0px';
        } else {
          const wrapStyle = window.getComputedStyle(wrapEl);
          const currentPt = Number.parseFloat(wrapStyle.paddingTop) || 0;
          const currentMt = Number.parseFloat(wrapStyle.marginTop) || 0;
          const wrapTransform = wrapStyle.transform;
          const wrapMatrix =
            wrapTransform && wrapTransform !== 'none' ? new DOMMatrixReadOnly(wrapTransform) : null;
          const currentWrapTy =
            wrapMatrix && Number.isFinite(wrapMatrix.m42) ? wrapMatrix.m42 : 0;
          const arenaRect = arenaEl.getBoundingClientRect();
          if (arenaRect.height > 0) {
            const arenaCenterBase =
              arenaRect.top + arenaRect.height / 2 - currentPt - currentMt - currentWrapTy;
            const deltaY = backdropCenterY - arenaCenterBase;
            if (deltaY >= 0) {
              wrapEl.style.paddingTop = `${deltaY.toFixed(2)}px`;
              wrapEl.style.marginTop = '0px';
            } else {
              wrapEl.style.paddingTop = '0px';
              wrapEl.style.marginTop = `${Math.max(-28, deltaY).toFixed(2)}px`;
            }
          }
        }
      }
    };

    syncForegroundCenterToBackdrop();
    const rafId = window.requestAnimationFrame(syncForegroundCenterToBackdrop);
    const settleTimer = window.setTimeout(syncForegroundCenterToBackdrop, 420);
    const postEnterTimer = window.setTimeout(syncForegroundCenterToBackdrop, 520);
    const postTransitionTimer = window.setTimeout(syncForegroundCenterToBackdrop, 780);
    const heroElForTransition = heroDockRef.current;
    const onHeroTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'transform') syncForegroundCenterToBackdrop();
    };
    heroElForTransition?.addEventListener('transitionend', onHeroTransitionEnd);
    window.addEventListener('resize', syncForegroundCenterToBackdrop, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncForegroundCenterToBackdrop);
      if (document.body) ro.observe(document.body);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      window.clearTimeout(postEnterTimer);
      window.clearTimeout(postTransitionTimer);
      heroElForTransition?.removeEventListener('transitionend', onHeroTransitionEnd);
      window.removeEventListener('resize', syncForegroundCenterToBackdrop);
      if (ro) ro.disconnect();
    };
  }, [
    isLandingIdle,
    isMultiStage,
    hasActiveAudit,
    isAuditing,
    isMobileViewport,
    viewportMetrics.width,
    viewportMetrics.height,
    displayMetrics.stageSizePx,
    activeKey,
    auditError,
    archiveToast
  ]);

  const currentAudit = hasActiveAudit && activeKey ? audits[activeKey] : audits.KAS;
  const baseAccent = hasActiveAudit
    ? getGradeAccent(currentAudit.grade)
    : {
        primary: '#49EACB',
        secondary: '#34D399',
        softBg: 'rgba(73, 234, 203, 0.10)',
        secondarySoftBg: 'rgba(52, 211, 153, 0.10)',
        border: 'rgba(73, 234, 203, 0.32)',
        secondaryBorder: 'rgba(52, 211, 153, 0.28)',
        glow: 'rgba(73, 234, 203, 0.16)',
        secondaryGlow: 'rgba(52, 211, 153, 0.14)',
        gradientCss: 'linear-gradient(135deg, #49EACB 0%, #34D399 100%)',
        textOnAccent: '#041713'
      };
  const activeScanStage = CORE_SCAN_STAGES[scanStepIdx] || CORE_SCAN_STAGES[0];
  const runningAuditState = isAuditing ? computeRunningAuditAccent(resolvedStepScores) : null;
  const accent = isAuditing && runningAuditState ? runningAuditState.accent : baseAccent;

  const activeTutorialSteps = isMobileViewport ? MOBILE_TUTORIAL_STEPS : TUTORIAL_STEPS;
  const activeTutorialStep =
    activeTutorialSteps[clampTutorialStepIndex(tutorialStepIndex, activeTutorialSteps.length)];

  const isSplitOpen =
    !isAuditing &&
    hasActiveAudit &&
    (isArenaHovered ||
      isPinned ||
      Boolean(hoveredInvId) ||
      Boolean(modalInvId) ||
      (isTutorialOpen && activeTutorialStep?.targetId === 'center-arena'));

  const activeHoveredInvariant =
    currentAudit.invariants.find((i) => i.id === hoveredInvId) || null;
  const activeModalInvariant =
    currentAudit.invariants.find((i) => i.id === modalInvId) || currentAudit.invariants[0];
  const currentGeniusParagraphs = getGeniusForensicParagraphs(currentAudit);

  // Drives the harmonic wave perimeter (+25% amplitude upgrade) on the center nucleus when collapsed,
  // and transfers that wave energy into the 6 invariant bubbles when expanded (isSplitOpen).
  // Any 0.0 score (Grade F or 0.0 invariant) remains completely flat (amplitude = 0).
  useEffect(() => {
    if ((!hasActiveAudit && !isAuditing) || isMultiStage) return undefined;
    const rawScore = Math.max(0, Math.min(6, Number(currentAudit?.totalScore) || 0));
    const isZeroFlat = rawScore === 0;

    // +25% harmonic wave amplitude upgrade (1.25x crest multiplier); E=0 remains flatlined (0)
    const targetCenterAmp =
      isSplitOpen || isAuditing || isZeroFlat
        ? 0
        : 1.25 * (3.5 + Math.pow(rawScore / 6.0, 1.12) * 14.5);

    const invList = currentAudit?.invariants || [];
    const targetSatAmps = Array.from({ length: 6 }, (_, idx) => {
      const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));
      if (!isSplitOpen || isAuditing || invScore <= 0) return 0;
      return 1.25 * (1.8 + Math.pow(invScore, 1.12) * 6.8);
    });

    let centerSettledZero = false;
    const satSettledZero = [false, false, false, false, false, false];

    const stepCenterAndSats = (dt = 1) => {
      let keepAnimating = false;

      // 1. Update Center Nucleus Wave
      const st = waveStateRef.current;
      st.amp += (targetCenterAmp - st.amp) * 0.16;
      if (Math.abs(targetCenterAmp - st.amp) < 0.04) {
        st.amp = targetCenterAmp;
      }

      const centerSpeed = (0.018 + (rawScore / 6.0) * 0.028) * 1.3 * Math.min(1.6, dt);
      if (st.amp > 0.01) {
        st.phase += centerSpeed;
      }

      if (st.amp > 0.01 || targetCenterAmp > 0.01 || !centerSettledZero) {
        if (mainWavePathRef.current) {
          mainWavePathRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_MAIN, 140, 140, 102, st.amp, st.phase, 0.82, 1.35)
          );
        }
        if (echoWavePathRef.current) {
          echoWavePathRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_ECHO, 140, 140, 106, st.amp * 0.78, -st.phase * 0.9, 0.82, 1.35)
          );
        }
        if (innerWavePathRef.current) {
          innerWavePathRef.current.setAttribute(
            'd',
            buildFastWavePath(NUCLEUS_LUT_INNER, 140, 140, 90, st.amp * 0.45, st.phase * 1.25, 0.82, 1.35)
          );
        }
        centerSettledZero = st.amp <= 0.01 && targetCenterAmp <= 0.01;
      }

      if (st.amp > 0.01 || Math.abs(targetCenterAmp - st.amp) > 0.01) {
        keepAnimating = true;
      }

      // 2. Update 6 Satellite Invariant Bubble Waves (only when expanded or settling back to 0)
      for (let idx = 0; idx < 6; idx++) {
        const satSt = satWaveStatesRef.current[idx];
        const tAmp = targetSatAmps[idx];
        const invScore = Math.max(0, Math.min(1, Number(invList[idx]?.score) || 0));

        satSt.amp += (tAmp - satSt.amp) * 0.16;
        if (Math.abs(tAmp - satSt.amp) < 0.03) {
          satSt.amp = tAmp;
        }

        const satSpeed = (0.02 + invScore * 0.032) * 1.3 * Math.min(1.6, dt);
        if (satSt.amp > 0.01) {
          satSt.phase += satSpeed;
        }

        if (satSt.amp > 0.01 || tAmp > 0.01 || !satSettledZero[idx]) {
          const mainEl = satMainWaveRefs.current[idx];
          const echoEl = satEchoWaveRefs.current[idx];
          const innerEl = satInnerWaveRefs.current[idx];

          if (mainEl) {
            mainEl.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_MAIN, 70, 70, 45, satSt.amp, satSt.phase, 0.82, 1.35)
            );
          }
          if (echoEl) {
            echoEl.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_ECHO, 70, 70, 47.5, satSt.amp * 0.76, -satSt.phase * 0.88, 0.82, 1.35)
            );
          }
          if (innerEl) {
            innerEl.setAttribute(
              'd',
              buildFastWavePath(SAT_LUT_INNER, 70, 70, 39, satSt.amp * 0.44, satSt.phase * 1.22, 0.82, 1.35)
            );
          }
          satSettledZero[idx] = satSt.amp <= 0.01 && tAmp <= 0.01;
        }

        if (satSt.amp > 0.01 || Math.abs(tAmp - satSt.amp) > 0.01) {
          keepAnimating = true;
        }
      }

      return keepAnimating;
    };

    if (!stepCenterAndSats(1)) return undefined;
    let unsub: (() => void) | null = null;
    unsub = subscribeSharedWave((dt) => {
      if (!stepCenterAndSats(dt) && unsub) {
        unsub();
        unsub = null;
      }
    }, 30);

    return () => {
      if (unsub) unsub();
    };
  }, [currentAudit, hasActiveAudit, isSplitOpen, isAuditing, isMultiStage]);

  const getActiveInvariantParagraph = (invObj: InvariantData | undefined): string => {
    if (!invObj) return '';
    if (!isGeniusMode) return invObj.paragraph;
    if (invObj.geniusParagraph) return invObj.geniusParagraph;
    return invObj.paragraph;
  };

  const triggerScanPulse = () => {
    setIsScanningPulse(true);
    setTimeout(() => setIsScanningPulse(false), 380);
  };

  const selectCachedAuditRef = useRef<(key: string) => void>(() => {});
  const togglePinTickerRef = useRef<(key: string) => void>(() => {});

  const selectCachedAudit = (key: string) => {
    if (!audits[key] || isAuditing) return;
    setAuditError(null);
    setConfirmFullReauditKey(null);
    setHoveredInvId(null);
    setZeroTokenHits((c) => c + 1);

    if (validPinnedKeys.length > 0) {
      if (validPinnedKeys.includes(key)) {
        if (stageTickers.length > 2) {
          const curLayout = getConstellationLayout(
            stageTickers.length,
            threeFormation,
            fourFormation,
            pinOrientationMode
          );
          const idx = stageTickers.indexOf(key);
          if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
            const ghostId = `${key}-${Date.now()}`;
            const ghostEntry: ExitingPinEntry = {
              ghostId,
              auditObj: audits[key],
              x: curLayout.positions[idx].x,
              y: curLayout.positions[idx].y,
              nodeScale: curLayout.nodeScale
            };
            setExitingPins((prev) => [...prev, ghostEntry]);
            setTimeout(() => {
              setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
            }, 340);
          }
        }
        const nextPinned = validPinnedKeys.filter((k) => k !== key);
        setPinnedKeys(nextPinned);
        if (activeKey === key && nextPinned.length > 0) {
          setActiveKey(nextPinned[nextPinned.length - 1]);
        } else if (nextPinned.length === 0) {
          setActiveKey(key);
        }
        triggerScanPulse();
        return;
      }

      const nextPinned =
        validPinnedKeys.length < 4
          ? [...validPinnedKeys, key]
          : [...validPinnedKeys.slice(0, 3), key];
      setPinnedKeys(nextPinned);
      setActiveKey(key);
      triggerScanPulse();
      return;
    }

    setActiveKey(key);
    triggerScanPulse();
  };

  const togglePinTicker = (key: string) => {
    if (!audits[key] || isAuditing) return;
    setHoveredInvId(null);

    if (validPinnedKeys.includes(key)) {
      if (stageTickers.length > 2) {
        const curLayout = getConstellationLayout(
          stageTickers.length,
          threeFormation,
          fourFormation,
          pinOrientationMode
        );
        const idx = stageTickers.indexOf(key);
        if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
          const ghostId = `${key}-${Date.now()}`;
          const ghostEntry: ExitingPinEntry = {
            ghostId,
            auditObj: audits[key],
            x: curLayout.positions[idx].x,
            y: curLayout.positions[idx].y,
            nodeScale: curLayout.nodeScale
          };
          setExitingPins((prev) => [...prev, ghostEntry]);
          setTimeout(() => {
            setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
          }, 340);
        }
      }
      const nextPinned = validPinnedKeys.filter((k) => k !== key);
      setPinnedKeys(nextPinned);
      if (activeKey === key && nextPinned.length > 0) {
        setActiveKey(nextPinned[nextPinned.length - 1]);
      }
      return;
    }

    if (validPinnedKeys.length === 0 && activeKey && key !== activeKey && audits[activeKey]) {
      setPinnedKeys([activeKey, key]);
      setActiveKey(key);
      triggerScanPulse();
      return;
    }

    const nextPinned =
      validPinnedKeys.length < 4
        ? [...validPinnedKeys, key]
        : [...validPinnedKeys.slice(0, 3), key];
    setPinnedKeys(nextPinned);
    setActiveKey(key);
    triggerScanPulse();
  };

  selectCachedAuditRef.current = selectCachedAudit;
  togglePinTickerRef.current = togglePinTicker;

  const stableSelectTicker = useCallback((tk: string) => {
    selectCachedAuditRef.current(tk);
  }, []);

  const stableTogglePin = useCallback((tk: string) => {
    togglePinTickerRef.current(tk);
  }, []);

  const unpinFromConstellation = (key: string) => {
    if (isAuditing) return;
    setHoveredInvId(null);
    if (stageTickers.length > 2) {
      const curLayout = getConstellationLayout(
        stageTickers.length,
        threeFormation,
        fourFormation,
        pinOrientationMode
      );
      const idx = stageTickers.indexOf(key);
      if (idx !== -1 && curLayout.positions[idx] && audits[key]) {
        const ghostId = `${key}-${Date.now()}`;
        const ghostEntry: ExitingPinEntry = {
          ghostId,
          auditObj: audits[key],
          x: curLayout.positions[idx].x,
          y: curLayout.positions[idx].y,
          nodeScale: curLayout.nodeScale
        };
        setExitingPins((prev) => [...prev, ghostEntry]);
        setTimeout(() => {
          setExitingPins((prev) => prev.filter((g) => g.ghostId !== ghostId));
        }, 340);
      }
    }
    const nextPinned = stageTickers.filter((k) => k !== key);
    setPinnedKeys(nextPinned);
    if (activeKey === key && nextPinned.length > 0) {
      setActiveKey(nextPinned[nextPinned.length - 1]);
    }
  };

  const copyTextToClipboard = (text: string, label: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedTarget(label);
      setTimeout(() => setCopiedTarget(null), 2200);
    } catch {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedTarget(label);
        setTimeout(() => setCopiedTarget(null), 2200);
      }
    }
  };

  const formatXLongPost = (auditObj: AuditData): string => {
    if (isGeniusMode) {
      return getGeniusForensicParagraphs(auditObj).join('\n\n');
    }

    const header = `THE TRUTH — thermodynamic audit // ${auditObj.name.toUpperCase()} ($${
      auditObj.ticker
    })\nTerminal Grade: ${auditObj.grade} (${formatScore(
      auditObj.totalScore
    )} / 6.0) • ${auditObj.certainty}\nArchitecture: ${auditObj.architecture}\n`;

    const body = auditObj.invariants
      .map(
        (inv) =>
          `[${inv.id} // ${inv.title} — ${formatScore(inv.score)}/1.0]:\n${inv.paragraph}`
      )
      .join('\n\n');

    return `${header}\n${body}\n\n${auditObj.conclusion}`;
  };

  const formatSyncInvariantComparison = (invId: string): string => {
    const invIdx = Math.max(0, Number(invId) - 1);
    const title = DEFAULT_TITLES[invIdx] || `Invariant ${invId}`;
    const modeLabel = isGeniusMode ? 'GENIUS FORENSIC' : 'NORMIE';
    const blocks = stageTickers
      .map((tk) => {
        const item = audits[tk];
        const inv = item?.invariants?.find((i) => i.id === invId);
        if (!item || !inv) return null;
        const body = getActiveInvariantParagraph(inv);
        const rcpts = (inv.receipts || []).join(' • ');
        return `$${item.ticker} (${item.name} — Grade ${item.grade}, Total ${formatScore(
          item.totalScore
        )}/6.0)\n[${inv.id} ${inv.shortName}: ${formatScore(inv.score)}/1.0] • ${inv.telemetry}\n${body}${
          rcpts ? `\nReceipts: ${rcpts}` : ''
        }`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');

    return `THE TRUTH — thermodynamic audit // SYNCED INVARIANT ${invId}: ${title.toUpperCase()} (${modeLabel})\nCompared Assets: ${stageTickers
      .map((t) => `$${t}`)
      .join(' vs ')}\n\n${blocks}`;
  };

  // Replays a deterministic 6-second chaotic-to-harmonic reveal animation when pulling from the Archive (0 API credits)
  const performArchivePullAudit = async (cachedKey: string) => {
    const targetAudit = audits[cachedKey];
    if (!targetAudit || isAuditing) return;

    setSearchInput('');
    setHoveredInvId(null);
    setAuditError(null);
    setConfirmFullReauditKey(null);
    setModalInvId(null);

    setIsAuditing(true);
    setScanTargetTicker(targetAudit.ticker);
    setScanStepIdx(0);
    setScanCodeTick(0);
    setScanProgressPct(3);
    setResolvedStepColors({});
    setResolvedStepScores({});
    setAuditStatusMsg(
      `[ARCHIVE // 0 CREDITS] Pulling verified proof for $${targetAudit.ticker}...`
    );

    try {
      const pullStartMs = Date.now();
      const ticksPerStage = 8;

      for (let step = 0; step < 6; step++) {
        const stage = CORE_SCAN_STAGES[step];
        const inv = targetAudit.invariants[step];
        const stageEndMs = pullStartMs + (step + 1) * ARCHIVE_PULL_STAGE_MS;
        setScanStepIdx(step);
        setAuditStatusMsg(
          `[${stage.id}/06] Retrieving ${stage.title} for $${targetAudit.ticker} from Vault...`
        );

        for (let tick = 0; tick < ticksPerStage; tick++) {
          setScanCodeTick(tick);
          const pct = Math.min(
            99,
            Math.max(4, Math.round(((step + (tick + 1) / ticksPerStage) / 6) * 100))
          );
          setScanProgressPct(pct);
          const targetTickEndMs =
            pullStartMs +
            step * ARCHIVE_PULL_STAGE_MS +
            Math.round(((tick + 1) / ticksPerStage) * ARCHIVE_PULL_STAGE_MS);
          const waitMs = targetTickEndMs - Date.now();
          if (waitMs > 4) {
            await new Promise((r) => setTimeout(r, waitMs));
          }
        }

        const remainMs = stageEndMs - Date.now();
        if (remainMs > 4) {
          await new Promise((r) => setTimeout(r, remainMs));
        }

        const stepScore = inv ? Number(inv.score) : undefined;
        const stepColor =
          stepScore !== undefined && Number.isFinite(stepScore)
            ? getScoreStyle(stepScore).color
            : stage.color;

        setResolvedStepColors((prev) => ({ ...prev, [step]: stepColor }));
        if (typeof stepScore === 'number' && Number.isFinite(stepScore)) {
          setResolvedStepScores((prev) => ({ ...prev, [step]: stepScore }));
        }
        setScanProgressPct(Math.round(((step + 1) / 6) * 100));
      }

      setZeroTokenHits((c) => c + 1);
      if (validPinnedKeys.length > 0 && !validPinnedKeys.includes(cachedKey)) {
        const nextPinned =
          validPinnedKeys.length < 4
            ? [...validPinnedKeys, cachedKey]
            : [...validPinnedKeys.slice(0, 3), cachedKey];
        setPinnedKeys(nextPinned);
      }
      setActiveKey(cachedKey);
      triggerScanPulse();
      flashArchiveToast(
        `Archive Hit: Pulled $${targetAudit.ticker} (${targetAudit.grade}) from Vault • 0 API Credits Used`,
        'hit'
      );
    } finally {
      setIsAuditing(false);
      setAuditStatusMsg('');
    }
  };

  // Executes SSE-streamed 6-invariant grounded audit via server.ts (/api/audit -> gemini-4-hydrogen)
  const performLiveGroundedAudit = async (
    rawQuery: string,
    existingBaseline: AuditData | null = null
  ) => {
    if (!rawQuery || isAuditing) return;

    const sandboxDecision = classifyAuditQueryForSandbox(
      rawQuery,
      typeof window !== 'undefined' ? window.location.search : '',
      isSandboxMode,
      new Set(Object.keys(PRELOADED_AUDITS))
    );
    const effectiveSandbox = existingBaseline
      ? isSandboxMode || sandboxTickerSet.has(existingBaseline.ticker)
      : sandboxDecision.isSandbox;

    const normalized = rawQuery
      .replace(/^\$/, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const canonicalGuess = resolveCanonicalAssetTicker(normalized);
    const displayTarget = existingBaseline
      ? resolveCanonicalAssetTicker(existingBaseline.ticker) || existingBaseline.ticker
      : canonicalGuess.slice(0, 8) || normalized.slice(0, 8) || 'ASSET';

    setIsAuditing(true);
    setSearchInput('');
    setHoveredInvId(null);
    setAuditError(null);
    setScanTargetTicker(displayTarget);
    setScanStepIdx(0);
    setScanCodeTick(0);
    setScanProgressPct(4);
    setResolvedStepColors({});
    setResolvedStepScores({});
    setAuditStatusMsg(
      existingBaseline
        ? `Re-auditing $${displayTarget} via Live Google Search...`
        : effectiveSandbox
        ? `Sandbox Preview: scanning ${rawQuery.toUpperCase()} (local only)...`
        : `Pulling fresh GitHub & consensus intel for ${rawQuery.toUpperCase()}...`
    );

    const tracker: AuditStreamTracker = {
      done: false,
      failed: false,
      outOfScope: false,
      outOfScopeMessage: null,
      error: null,
      result: null,
      quota: null,
      sandbox: effectiveSandbox,
      unlockedCount: 0,
      colors: {},
      scores: {},
      freshSources: []
    };

    let accumulatedJson = '';
    const clientId = getOrCreateClientQuotaId();

    const streamPromise = (async () => {
      const idToken = await getFirebaseIdToken();
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-truth-client-id': clientId,
          ...(archiveUser?.uid ? { 'x-truth-user-id': archiveUser.uid } : {}),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          query: rawQuery,
          existingBaseline,
          bypassCache: Boolean(existingBaseline),
          sandbox: effectiveSandbox,
          clientId,
          userId: archiveUser?.uid || null
        })
      });

      if (!response.ok) {
        const errPayload = (await response.json().catch(() => null)) as {
          error?: string;
          quota?: QuotaStatus;
        } | null;
        if (errPayload?.quota) {
          tracker.quota = errPayload.quota;
          setDailyQuota(errPayload.quota);
        }
        throw new Error(errPayload?.error || `Audit request failed (HTTP ${response.status}).`);
      }

      if (!response.body) {
        throw new Error('Streaming response body unavailable from audit server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let splitIdx = buffer.indexOf('\n\n');
        while (splitIdx !== -1) {
          const frame = buffer.slice(0, splitIdx);
          buffer = buffer.slice(splitIdx + 2);

          const dataLine = frame
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('');

          if (dataLine) {
            try {
              const evt = JSON.parse(dataLine) as AuditSseEvent;
              if (evt.quota) {
                tracker.quota = evt.quota;
                setDailyQuota(evt.quota);
              }
              if (evt.type === 'intel' && Array.isArray(evt.sources)) {
                tracker.freshSources = evt.sources;
              } else if (evt.type === 'chunk' && evt.text) {
                accumulatedJson += evt.text;
                const progress = inspectStreamedAuditProgress(accumulatedJson);
                tracker.unlockedCount = Math.max(tracker.unlockedCount, progress.completedCount);
                tracker.colors = { ...tracker.colors, ...progress.completedColors };
                tracker.scores = { ...tracker.scores, ...progress.completedScores };
              } else if (evt.type === 'done' && (evt.outOfScope || evt.audit === null)) {
                tracker.outOfScope = true;
                tracker.outOfScopeMessage =
                  evt.message ||
                  `Returned null: "${rawQuery}" could not be resolved to a valid asset or physical commodity.`;
                tracker.done = true;
              } else if (evt.type === 'done' && evt.audit) {
                if (typeof evt.sandbox === 'boolean') {
                  tracker.sandbox = tracker.sandbox || evt.sandbox;
                }
                const enforced = enforceEnergyArbitrageLawOnAudit({
                  ...evt.audit,
                  freshSources: evt.sources || evt.audit.freshSources || tracker.freshSources
                });
                tracker.result = enforced;
                tracker.freshSources = evt.sources || enforced.freshSources || tracker.freshSources;
                for (let k = 0; k < 6; k++) {
                  const inv = enforced.invariants[k];
                  if (inv) {
                    tracker.scores[k] = inv.score;
                    tracker.colors[k] = getScoreStyle(inv.score).color;
                  }
                }
                tracker.unlockedCount = 6;
                tracker.done = true;
              } else if (evt.type === 'error') {
                throw new Error(evt.message || 'Live audit failed.');
              }
            } catch (evtErr) {
              if (evtErr instanceof Error && evtErr.message !== 'Unexpected end of JSON input') {
                throw evtErr;
              }
            }
          }

          splitIdx = buffer.indexOf('\n\n');
        }
      }

      if (!tracker.done && !tracker.failed) {
        throw new Error('Audit stream ended before delivering a complete 6-invariant verdict.');
      }
    })().catch((err: unknown) => {
      tracker.failed = true;
      tracker.error = err instanceof Error ? err : new Error(String(err));
    });

    const scanLoopPromise = (async () => {
      for (let step = 0; step < 6; step++) {
        if (tracker.failed || tracker.outOfScope) break;
        const stage = CORE_SCAN_STAGES[step];
        setScanStepIdx(step);
        setAuditStatusMsg(
          `[${stage.id}/06] Auditing ${stage.title} on $${displayTarget}...`
        );

        let tick = 0;
        while (!tracker.failed && !tracker.outOfScope) {
          setScanCodeTick(tick);
          tick++;

          const basePct = Math.round(((step + Math.min(0.85, tick * 0.14)) / 6) * 100);
          setScanProgressPct((prev) => Math.max(prev, Math.min(98, basePct)));

          const ready = tracker.done || tracker.unlockedCount > step;
          if (ready && tick >= 3) break;
          await new Promise((r) => setTimeout(r, 140));
        }

        if (tracker.failed || tracker.outOfScope) break;

        const stepColor = tracker.colors[step] || stage.color;
        const stepScore = tracker.scores[step];
        setResolvedStepColors((prev) => ({ ...prev, [step]: stepColor }));
        if (typeof stepScore === 'number' && Number.isFinite(stepScore)) {
          setResolvedStepScores((prev) => ({ ...prev, [step]: stepScore }));
        }
        setScanProgressPct(Math.round(((step + 1) / 6) * 100));
        setAuditStatusMsg(
          stepScore !== undefined
            ? `[${stage.id}/06] ${stage.shortName} Complete (-) -> ${formatScore(stepScore)}/1.0`
            : `[${stage.id}/06] ${stage.shortName} Locked (-)`
        );
        await new Promise((r) => setTimeout(r, tracker.done ? 180 : 220));
      }
    })();

    try {
      await Promise.all([streamPromise, scanLoopPromise]);
      if (tracker.outOfScope) {
        setAuditError(
          tracker.outOfScopeMessage ||
            `Returned null: "${rawQuery}" could not be resolved to a valid asset or physical commodity.`
        );
        return;
      }
      if (tracker.failed || !tracker.result) {
        throw tracker.error || new Error('Incomplete 6-invariant payload returned.');
      }

      const builtAudit = tracker.result;
      const cleanTicker = builtAudit.ticker;

      if (tracker.sandbox && !PRELOADED_AUDITS[cleanTicker]) {
        setSandboxTickers((prev) => (prev.includes(cleanTicker) ? prev : [...prev, cleanTicker]));
      }
      setScanTargetTicker(cleanTicker);
      setAudits((prev) => ({ ...prev, [cleanTicker]: builtAudit }));
      setPinnedKeys((prev) => {
        const cleanPrev = prev.filter(Boolean);
        if (cleanPrev.length === 0 || cleanPrev.includes(cleanTicker)) return cleanPrev;
        return cleanPrev.length < 4
          ? [...cleanPrev, cleanTicker]
          : [...cleanPrev.slice(0, 3), cleanTicker];
      });
      setActiveKey(cleanTicker);
      setConfirmFullReauditKey(null);
      setHoveredInvId(null);
      setSearchInput('');
      triggerScanPulse();

      const quotaSuffix =
        tracker.quota?.unlimited || isAdminSession
          ? ' • ∞ Admin Unlimited Pulls'
          : tracker.quota
          ? ` • ${tracker.quota.remaining}/${tracker.quota.limit} daily pulls left`
          : '';

      if (tracker.sandbox) {
        flashArchiveToast(
          `Sandbox Preview ($${cleanTicker}) saved locally in browser only — excluded from public archive${quotaSuffix}`,
          'warn'
        );
      } else {
        const savedRemotely = await persistAuditToArchive(builtAudit, invLogs, [rawQuery, normalized]);
        flashArchiveToast(
          savedRemotely
            ? `Archived $${cleanTicker} to Shared Vault — future lookups cost 0 credits${quotaSuffix}`
            : `Archived $${cleanTicker} in Session Vault — future lookups cost 0 credits${quotaSuffix}`,
          'saved'
        );
      }
    } catch (err) {
      setAuditError(
        `Unable to complete fresh grounded audit for "${rawQuery}" (${
          err instanceof Error ? err.message : 'Check ticker and retry'
        }).`
      );
    } finally {
      setIsAuditing(false);
      setAuditStatusMsg('');
    }
  };

  const handleFreshReaudit = async (targetKey: string | null = activeKey, bypassConfirm = false) => {
    const targetObj = (targetKey && audits[targetKey]) || currentAudit;
    if (!targetObj || isAuditing || singleInvBusy) return;

    if (strictCreditLock && !isAdminSession) {
      flashArchiveToast(
        'Strict Credit Shield is LOCKED — unlock in Archive menu to run full 6-invariant refreshes.',
        'warn'
      );
      return;
    }

    if (!bypassConfirm && confirmFullReauditKey !== targetObj.ticker) {
      setConfirmFullReauditKey(targetObj.ticker);
      return;
    }

    setConfirmFullReauditKey(null);
    if (modalInvId) setModalInvId(null);
    await performLiveGroundedAudit(targetObj.ticker, targetObj);
  };

  // Surgically updates one invariant on an asset while preserving all other 5 locked-in invariants & essays
  const applySingleInvariantPatch = (
    targetAudit: AuditData,
    invIdx: number,
    patch: SingleInvariantPatchPayload,
    sources: GroundingSource[] = [],
    sourceLabel = '1-Inv Re-Audit'
  ) => {
    const prevInv = targetAudit.invariants[invIdx];
    const prevInvScore = Number(prevInv.score) || 0;
    const prevTotal = Number(targetAudit.totalScore) || 0;

    const clampedScore = clampSingleInvariantByPhysics(targetAudit, invIdx, patch.score, {
      hasGenesisPremineOrVcOrIco: patch.hasGenesisPremineOrVcOrIco,
      hasProtocolDevTaxOrKillSwitch: patch.hasProtocolDevTaxOrKillSwitch,
      carrierLayerOneVelocityCap: patch.carrierLayerOneVelocityCap
    });

    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const invDelta = Number((clampedScore - prevInvScore).toFixed(2));

    const cleanedReceipts = Array.isArray(patch.receipts)
      ? patch.receipts
          .map((r) => stripTrailingDash(r))
          .filter((r) => r && r !== '-')
          .slice(0, 4)
      : [];

    const updatedSingleInv: InvariantData = {
      ...prevInv,
      score: clampedScore,
      telemetry: stripTrailingDash(patch.telemetry) || prevInv.telemetry,
      quickSummary: stripTrailingDash(patch.quickSummary) || prevInv.quickSummary,
      paragraph:
        stripTrailingDash(patch.paragraph).length >= 55
          ? stripTrailingDash(patch.paragraph)
          : prevInv.paragraph,
      geniusParagraph:
        stripTrailingDash(patch.geniusParagraph).length >= 220
          ? stripTrailingDash(patch.geniusParagraph)
          : prevInv.geniusParagraph || prevInv.paragraph,
      receipts: cleanedReceipts.length > 0 ? cleanedReceipts : prevInv.receipts,
      lastSingleAuditAt: timeStamp,
      lastSingleAuditSource: sourceLabel,
      singleScoreDelta: invDelta
    };

    let nextInvariants = targetAudit.invariants.map((item, i) =>
      i === invIdx ? updatedSingleInv : item
    );

    const nextSovereignty = Number(nextInvariants[0]?.score ?? 1);
    if (nextSovereignty <= 0 && Number(nextInvariants[1]?.score) > 0) {
      const maxArbFloor = patch.hasGenesisPremineOrVcOrIco === true ? 0.3 : 0.35;
      if (Number(nextInvariants[1].score) > maxArbFloor) {
        nextInvariants[1] = {
          ...nextInvariants[1],
          score: maxArbFloor
        };
      }
    }

    const nextCostFloor = Number(nextInvariants[1]?.score) || 0;
    if (nextCostFloor <= 0) {
      nextInvariants = nextInvariants.map((item) => ({ ...item, score: 0 }));
    }

    const nextTotal = Number(
      nextInvariants.reduce((sum, item) => sum + (Number(item.score) || 0), 0).toFixed(2)
    );
    const nextGrade = deriveGradeFromTotal(nextTotal, nextCostFloor, nextSovereignty);
    const nextFamily =
      nextCostFloor <= 0
        ? 'ZERO_JOULE_BFT'
        : targetAudit.consensusFamily === 'ZERO_JOULE_BFT'
        ? 'LINEAR_POW'
        : targetAudit.consensusFamily;

    const baseParas = [...getGeniusForensicParagraphs(targetAudit)];
    if (baseParas.length === 6) {
      if (invIdx >= 0 && invIdx <= 3) {
        baseParas[invIdx] = `Evaluating ${targetAudit.name} (${targetAudit.ticker}) on Invariant ${
          updatedSingleInv.id
        } — ${updatedSingleInv.title} (${formatScore(updatedSingleInv.score)}/1.0): ${
          updatedSingleInv.geniusParagraph
        } Verified telemetry: ${(updatedSingleInv.receipts || []).join(' • ')}.`;
      } else if (invIdx === 4 || invIdx === 5) {
        baseParas[4] = `Examining ${targetAudit.name}’s State Machine Topology (${formatScore(
          nextInvariants[4].score
        )}/1.0) and Thermodynamic Velocity (${formatScore(
          nextInvariants[5].score
        )}/1.0, M = 1.0 benchmark): ${nextInvariants[4].geniusParagraph} ${
          nextInvariants[5].geniusParagraph
        }`;
      }
      if (Math.abs(nextTotal - prevTotal) > 0.001) {
        baseParas[5] = `Evaluating these findings through the GRADE evidence certainty framework yields a ${
          targetAudit.certainty || 'HIGH CERTAINTY'
        } rating across all six physical invariants (${nextInvariants
          .map((i) => `${i.id}: ${formatScore(i.score)}`)
          .join(', ')}), resulting in a recalibrated score of ${formatScore(
          nextTotal
        )} out of 6.00 and a compliance grade of ${nextGrade}.`;
      }
    }

    const mergedSources = [...sources, ...(targetAudit.freshSources || [])].filter(
      (s, idx, arr) => s && s.uri && arr.findIndex((x) => x.uri === s.uri) === idx
    );

    const updatedAudit: AuditData = {
      ...targetAudit,
      consensusFamily: nextFamily,
      invariants: nextInvariants,
      totalScore: nextTotal,
      grade: nextGrade,
      geniusParagraphs: baseParas.length === 6 ? baseParas : targetAudit.geniusParagraphs,
      lastFreshAuditAt: timeStamp,
      scoreDelta: Number((nextTotal - prevTotal).toFixed(2)),
      freshSources: mergedSources.slice(0, 8),
      isArchived: true,
      archivedAtMs: Date.now(),
      archiveRevision: (Number(targetAudit.archiveRevision) || 0) + 1
    };

    setAudits((prev) => ({ ...prev, [targetAudit.ticker]: updatedAudit }));
    return {
      updatedAudit,
      updatedSingleInv,
      prevInvScore,
      clampedScore,
      invDelta,
      nextTotal,
      nextGrade,
      timeStamp
    };
  };

  // ACTION 1: Low-Token Single-Invariant Fresh Re-Audit (POST /api/invariant mode=REAUDIT -> gemini-4-hydrogen)
  const handleSingleInvariantReaudit = async (invId: string) => {
    if (isAuditing || singleInvBusy) return;
    if (strictCreditLock && !isAdminSession) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to run live fresh pulls.'
      });
      return;
    }
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'REAUDIT' });

    try {
      const idToken = await getFirebaseIdToken();
      const response = await fetch('/api/invariant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          mode: 'REAUDIT',
          targetAudit,
          invId,
          isGeniusMode
        })
      });

      const payload = (await response.json().catch(() => null)) as {
        parsed?: SingleInvariantPatchPayload & { verdictNote?: string };
        sources?: GroundingSource[];
        error?: string;
      } | null;

      if (!response.ok || !payload?.parsed) {
        throw new Error(payload?.error || `Re-audit failed (HTTP ${response.status}).`);
      }

      const parsed = payload.parsed;
      const freshSources = Array.isArray(payload.sources) ? payload.sources : [];

      const outcome = applySingleInvariantPatch(
        targetAudit,
        invIdx,
        parsed,
        freshSources,
        'Low-Token 1-Inv Re-Audit'
      );

      const entry: InvariantLogEntry = {
        id: `${Date.now()}-reaudit`,
        kind: 'REAUDIT',
        timestamp: outcome.timeStamp,
        headline:
          outcome.invDelta === 0
            ? `Invariant ${invId} Confirmed at ${formatScore(outcome.clampedScore)} / 1.0`
            : `Invariant ${invId} Recalibrated: ${formatScore(outcome.prevInvScore)} → ${formatScore(
                outcome.clampedScore
              )} (${
                outcome.invDelta > 0
                  ? `+${formatScore(outcome.invDelta)}`
                  : formatScore(outcome.invDelta)
              })`,
        verdictTag: outcome.invDelta === 0 ? 'CONFIRMED' : 'RECALIBRATED',
        userPrompt: null,
        body:
          parsed.verdictNote ||
          `Fresh single-invariant intelligence pull completed for $${targetAudit.ticker} on ${targetInv.title}.`,
        sources: freshSources
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) => !(item.kind === 'REAUDIT' && isResponseTextTruncated(item.body))
      );
      const nextLogsMap: Record<string, InvariantLogEntry[]> = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      if (!isSandboxMode && !sandboxTickerSet.has(targetAudit.ticker)) {
        await persistAuditToArchive(outcome.updatedAudit, nextLogsMap);
        flashArchiveToast(`Archived updated #${invId} on $${targetAudit.ticker}`, 'saved');
      } else {
        flashArchiveToast(`Sandbox updated #${invId} locally (not saved to public vault)`, 'warn');
      }
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Single-invariant re-audit failed (${
          err instanceof Error ? err.message : 'Please retry'
        }).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  // ACTION 2: Challenge Invariant Score (POST /api/invariant mode=CHALLENGE -> gemini-4-carbon)
  const handleInvariantChallenge = async (invId: string, overrideClaim: string | null = null) => {
    if (isAuditing || singleInvBusy) return;
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;
    const rawClaim = String(
      overrideClaim !== null ? overrideClaim : invPromptInputs[logKey] || ''
    ).trim();

    if (!rawClaim) {
      setSingleInvNotice({
        type: 'warn',
        text: `Type your counter-evidence, GitHub commit/PR, or technical challenge into the box first — or click "Fresh 1-Inv Pull (#${invId})" for an automatic fresh pull.`
      });
      return;
    }

    const normalizedClaim = rawClaim.toLowerCase().replace(/\s+/g, ' ');
    const currentFormattedInvScore = formatScore(targetInv.score);
    const existingChallengeHit =
      overrideClaim !== null
        ? null
        : (invLogs[logKey] || []).find(
            (item) =>
              item.kind === 'CHALLENGE' &&
              !isResponseTextTruncated(item.body) &&
              String(item.verdictTag || '').includes(currentFormattedInvScore) &&
              String(item.userPrompt || '')
                .toLowerCase()
                .replace(/\s+/g, ' ') === normalizedClaim
          );
    if (existingChallengeHit) {
      setZeroTokenHits((c) => c + 1);
      setSingleInvNotice({
        type: 'warn',
        text: `0-Credit Archive Hit: This exact challenge was already adjudicated below (${existingChallengeHit.verdictTag}).`
      });
      return;
    }

    if (strictCreditLock && !isAdminSession) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to adjudicate new challenges.'
      });
      return;
    }

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'CHALLENGE' });

    try {
      const idToken = await getFirebaseIdToken();
      const response = await fetch('/api/invariant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          mode: 'CHALLENGE',
          targetAudit,
          invId,
          userInput: rawClaim,
          isGeniusMode
        })
      });

      const payload = (await response.json().catch(() => null)) as {
        parsed?: {
          verdict?: 'ACCEPTED' | 'PARTIAL' | 'REJECTED';
          scoreChanged?: boolean;
          updatedScore?: number;
          updatedTelemetry?: string;
          updatedQuickSummary?: string;
          updatedParagraph?: string;
          updatedGeniusParagraph?: string;
          updatedReceipts?: string[];
          verdictHeadline?: string;
          rebuttalOrAnalysis?: string;
          hasGenesisPremineOrVcOrIco?: boolean;
          hasProtocolDevTaxOrKillSwitch?: boolean;
          carrierLayerOneVelocityCap?: number;
        };
        sources?: GroundingSource[];
        error?: string;
      } | null;

      if (!response.ok || !payload?.parsed) {
        throw new Error(payload?.error || `Challenge adjudication failed (HTTP ${response.status}).`);
      }

      const parsed = payload.parsed;
      const freshSources = Array.isArray(payload.sources) ? payload.sources : [];

      const clampedTargetScore = clampSingleInvariantByPhysics(
        targetAudit,
        invIdx,
        parsed.scoreChanged ? Number(parsed.updatedScore ?? targetInv.score) : targetInv.score,
        {
          hasGenesisPremineOrVcOrIco: parsed.hasGenesisPremineOrVcOrIco,
          hasProtocolDevTaxOrKillSwitch: parsed.hasProtocolDevTaxOrKillSwitch,
          carrierLayerOneVelocityCap: parsed.carrierLayerOneVelocityCap
        }
      );

      const prevScore = Number(targetInv.score) || 0;
      const didActuallyChangeScore = Math.abs(clampedTargetScore - prevScore) >= 0.01;
      const shouldPatchInvariant =
        didActuallyChangeScore || parsed.verdict === 'ACCEPTED' || parsed.verdict === 'PARTIAL';

      let timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let resultingAuditForArchive = targetAudit;
      if (shouldPatchInvariant) {
        const patchOutcome = applySingleInvariantPatch(
          targetAudit,
          invIdx,
          {
            score: clampedTargetScore,
            telemetry: parsed.updatedTelemetry || targetInv.telemetry,
            quickSummary: parsed.updatedQuickSummary || targetInv.quickSummary,
            paragraph: parsed.updatedParagraph || targetInv.paragraph,
            geniusParagraph:
              parsed.updatedGeniusParagraph || targetInv.geniusParagraph || targetInv.paragraph,
            receipts: parsed.updatedReceipts || targetInv.receipts,
            hasGenesisPremineOrVcOrIco: parsed.hasGenesisPremineOrVcOrIco,
            hasProtocolDevTaxOrKillSwitch: parsed.hasProtocolDevTaxOrKillSwitch,
            carrierLayerOneVelocityCap: parsed.carrierLayerOneVelocityCap
          },
          freshSources,
          'Challenge Adjudication'
        );
        timeStamp = patchOutcome.timeStamp;
        resultingAuditForArchive = patchOutcome.updatedAudit;
      }

      const effectiveVerdict: 'ACCEPTED' | 'PARTIAL' | 'REJECTED' =
        !didActuallyChangeScore && parsed.verdict === 'ACCEPTED' && parsed.scoreChanged
          ? 'REJECTED'
          : parsed.verdict || 'REJECTED';

      const entry: InvariantLogEntry = {
        id: `${Date.now()}-challenge`,
        kind: 'CHALLENGE',
        timestamp: timeStamp,
        verdictTag:
          effectiveVerdict === 'ACCEPTED'
            ? didActuallyChangeScore
              ? `ACCEPTED (${formatScore(prevScore)} → ${formatScore(clampedTargetScore)})`
              : 'ACCEPTED • EVIDENCE LOGGED'
            : effectiveVerdict === 'PARTIAL'
            ? didActuallyChangeScore
              ? `PARTIAL (${formatScore(prevScore)} → ${formatScore(clampedTargetScore)})`
              : `PARTIAL • SCORE ${formatScore(clampedTargetScore)} UPHELD`
            : `REJECTED • ${formatScore(prevScore)}/1.0 UPHELD`,
        verdictState: effectiveVerdict,
        headline:
          parsed.verdictHeadline ||
          (effectiveVerdict === 'REJECTED'
            ? `Challenge Rejected — Score ${formatScore(prevScore)}/1.0 Upheld`
            : `Challenge Evaluated — Score ${formatScore(clampedTargetScore)}/1.0`),
        userPrompt: rawClaim,
        body:
          parsed.rebuttalOrAnalysis ||
          'Challenge evaluated against the canonical 6-invariant thermodynamic rubric.',
        sources: freshSources
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) =>
          !(
            item.kind === 'CHALLENGE' &&
            String(item.userPrompt || '')
              .toLowerCase()
              .replace(/\s+/g, ' ') === normalizedClaim &&
            (overrideClaim !== null || isResponseTextTruncated(item.body))
          )
      );

      const nextLogsMap: Record<string, InvariantLogEntry[]> = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      if (overrideClaim === null) {
        setInvPromptInputs((prev) => ({ ...prev, [logKey]: '' }));
      }
      if (!isSandboxMode && !sandboxTickerSet.has(targetAudit.ticker)) {
        await persistAuditToArchive(resultingAuditForArchive, nextLogsMap);
        flashArchiveToast(`Contest verdict archived for $${targetAudit.ticker} #${invId}`, 'saved');
      } else {
        flashArchiveToast(`Sandbox contest logged locally for $${targetAudit.ticker} #${invId}`, 'warn');
      }
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Unable to adjudicate challenge (${
          err instanceof Error ? err.message : 'Please retry'
        }).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  // ACTION 3: Single-Invariant Deeper Breakdown (POST /api/invariant mode=BREAKDOWN -> gemini-4-hydrogen)
  const handleInvariantBreakdown = async (invId: string, overrideQuestion: string | null = null) => {
    if (isAuditing || singleInvBusy) return;
    const invIdx = currentAudit.invariants.findIndex((i) => i.id === invId);
    if (invIdx === -1) return;

    const targetAudit = currentAudit;
    const targetInv = targetAudit.invariants[invIdx];
    const logKey = `${targetAudit.ticker}:${invId}`;
    const userQuestion = String(
      overrideQuestion !== null ? overrideQuestion : invPromptInputs[logKey] || ''
    ).trim();
    const expectedTag = isGeniusMode ? 'GENIUS DEEP-DIVE' : 'NORMIE BREAKDOWN';

    const existingBreakdown =
      overrideQuestion !== null
        ? null
        : (invLogs[logKey] || []).find(
            (item) =>
              item.kind === 'BREAKDOWN' &&
              !isResponseTextTruncated(item.body) &&
              item.verdictTag === expectedTag &&
              String(item.userPrompt || '')
                .trim()
                .toLowerCase() === userQuestion.toLowerCase()
          );
    if (existingBreakdown) {
      setZeroTokenHits((c) => c + 1);
      setSingleInvNotice({
        type: 'warn',
        text: `0-Credit Archive Hit: ${expectedTag} is already archived below. Type a new specific sub-question if you want a custom breakdown.`
      });
      return;
    }

    if (strictCreditLock && !isAdminSession) {
      setSingleInvNotice({
        type: 'warn',
        text: 'Strict Credit Shield is active — unlock in the Archive menu to generate new AI breakdowns.'
      });
      return;
    }

    setSingleInvNotice(null);
    setSingleInvBusy({ key: logKey, mode: 'BREAKDOWN' });

    try {
      const idToken = await getFirebaseIdToken();
      const response = await fetch('/api/invariant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          mode: 'BREAKDOWN',
          targetAudit,
          invId,
          userInput: userQuestion,
          isGeniusMode
        })
      });

      const payload = (await response.json().catch(() => null)) as {
        bodyText?: string;
        sources?: GroundingSource[];
        error?: string;
      } | null;

      if (!response.ok || !payload?.bodyText) {
        throw new Error(payload?.error || `Breakdown failed (HTTP ${response.status}).`);
      }

      const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const entry: InvariantLogEntry = {
        id: `${Date.now()}-breakdown`,
        kind: 'BREAKDOWN',
        timestamp: timeStamp,
        verdictTag: expectedTag,
        headline: userQuestion
          ? `Deep-Dive Breakdown // ${targetInv.id} ${targetInv.shortName}`
          : `Expanded Forensic Mechanics // ${targetInv.id} ${targetInv.shortName}`,
        userPrompt: userQuestion || null,
        body: payload.bodyText,
        sources: Array.isArray(payload.sources) ? payload.sources : []
      };

      const filteredPrior = (invLogs[logKey] || []).filter(
        (item) =>
          !(
            item.kind === 'BREAKDOWN' &&
            item.verdictTag === expectedTag &&
            String(item.userPrompt || '')
              .trim()
              .toLowerCase() === userQuestion.toLowerCase() &&
            (overrideQuestion !== null || isResponseTextTruncated(item.body))
          )
      );

      const nextLogsMap: Record<string, InvariantLogEntry[]> = {
        ...invLogs,
        [logKey]: [entry, ...filteredPrior]
      };
      setInvLogs(nextLogsMap);
      if (userQuestion && overrideQuestion === null) {
        setInvPromptInputs((prev) => ({ ...prev, [logKey]: '' }));
      }
      if (!isSandboxMode && !sandboxTickerSet.has(targetAudit.ticker)) {
        await persistAuditToArchive(targetAudit, nextLogsMap);
      }
    } catch (err) {
      setSingleInvNotice({
        type: 'error',
        text: `Unable to generate breakdown (${
          err instanceof Error ? err.message : 'Please retry'
        }).`
      });
    } finally {
      setSingleInvBusy(null);
    }
  };

  const handleSearchSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const rawQuery = searchInput.trim();
    if (!rawQuery || isAuditing) return;

    const normalized = rawQuery
      .replace(/^\$/, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    const canonicalTarget = resolveCanonicalAssetTicker(normalized);
    const cachedKey = audits[normalized]
      ? normalized
      : canonicalTarget && audits[canonicalTarget]
      ? canonicalTarget
      : ALIAS_MAP[normalized] && audits[ALIAS_MAP[normalized]]
      ? ALIAS_MAP[normalized]
      : dynamicAliases[normalized] && audits[dynamicAliases[normalized]]
      ? dynamicAliases[normalized]
      : Object.keys(audits).find((k) => {
          const cand = audits[k];
          if (!cand) return false;
          if (cand.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized) return true;
          return Array.isArray(cand.queryAliases) && cand.queryAliases.includes(normalized);
        });

    if (cachedKey) {
      await performArchivePullAudit(cachedKey);
      return;
    }

    if (strictCreditLock) {
      setAuditError(
        `Credit Shield Lock is ON: "${rawQuery}" is not in the archive yet. Unlock in the Archive menu to audit new unarchived tokens.`
      );
      return;
    }

    await performLiveGroundedAudit(rawQuery, null);
  };

  const scrollToWartimeSim = () => {
    setTimeout(() => {
      if (simAnchorRef.current) {
        simAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const scrollToSyncComparison = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        if (syncComparisonAnchorRef.current) {
          syncComparisonAnchorRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 70);
    });
  }, []);

  const closeTutorial = useCallback((markSeen = true) => {
    if (markSeen && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
    setIsTutorialOpen(false);
  }, []);

  const handleTutorialStepChange = useCallback(
    (nextRawIdx: number) => {
      const stepsForMode = isMobileViewport ? MOBILE_TUTORIAL_STEPS : TUTORIAL_STEPS;
      const nextIdx = clampTutorialStepIndex(nextRawIdx, stepsForMode.length);
      const nextStep = stepsForMode[nextIdx];
      setTutorialStepIndex(nextIdx);

      if (!nextStep || isAuditing) return;

      if (nextStep.targetId === 'center-arena') {
        if (!activeKey && validPinnedKeys.length === 0) {
          setActiveKey('KAS');
        } else if (isMultiStage && validPinnedKeys.length > 0 && !activeKey) {
          setActiveKey(validPinnedKeys[0]);
        }
        if (isMultiStage) {
          setPinnedKeys([]);
          setActiveKey(activeKey || 'KAS');
        }
        setIsArenaHovered(true);
      } else if (nextStep.targetId === 'pin-compare') {
        if (!isMultiStage && !activeKey) {
          setActiveKey('KAS');
        }
      }
    },
    [activeKey, isAuditing, isMobileViewport, isMultiStage, validPinnedKeys]
  );

  const startTutorial = useCallback(() => {
    setModalInvId(null);
    setIsRubricOpen(false);
    setIsArchiveModalOpen(false);
    setIsGainsModalOpen(false);
    setIsDonateModalOpen(false);
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
  }, []);

  const handleTutorialAction = useCallback(
    (actionId: TutorialActionId) => {
      switch (actionId) {
        case 'focus-search': {
          const searchEl = document.getElementById('truth-audit-search') as HTMLInputElement | null;
          searchEl?.focus();
          break;
        }
        case 'load-kas-fission': {
          setPinnedKeys([]);
          setActiveKey('KAS');
          setHoveredInvId(null);
          setIsArenaHovered(true);
          break;
        }
        case 'toggle-genius': {
          setIsGeniusMode(true);
          break;
        }
        case 'demo-constellation': {
          setPinnedKeys(['KAS', 'SOL']);
          setActiveKey('KAS');
          setExpandAllOrbits(false);
          break;
        }
        case 'open-gains-modal': {
          closeTutorial(true);
          setIsGainsModalOpen(true);
          break;
        }
        case 'open-wartime-sim': {
          closeTutorial(true);
          if (!activeKey) setActiveKey('KAS');
          setEssayViewMode(false);
          setModalInvId('04');
          scrollToWartimeSim();
          break;
        }
      }
    },
    [activeKey, closeTutorial]
  );

  // =========================================================================
  // 5-SECOND TRUTH DOT HOLD -> RADIAL SUPERNOVA EXPLOSION -> GENESIS THESIS
  // =========================================================================
  const cancelTruthDotHold = useCallback(() => {
    if (truthDotRafRef.current !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(truthDotRafRef.current);
      truthDotRafRef.current = null;
    }
    truthDotStartRef.current = null;
    setTruthDotHoldProgress(0);
  }, []);

  const triggerTruthSupernova = useCallback(() => {
    cancelTruthDotHold();
    truthDotTriggeredRef.current = true;
    setTruthExplosionActive(true);
    if (truthExplosionTimerRef.current) clearTimeout(truthExplosionTimerRef.current);
    setTimeout(() => {
      setIsGenesisModalOpen(true);
    }, 340);
    truthExplosionTimerRef.current = setTimeout(() => {
      setTruthExplosionActive(false);
      truthDotTriggeredRef.current = false;
    }, 820);
  }, [cancelTruthDotHold]);

  const startTruthDotHold = useCallback(() => {
    if (typeof window === 'undefined' || isGenesisModalOpen || truthExplosionActive) return;
    cancelTruthDotHold();
    truthDotTriggeredRef.current = false;
    const HOLD_DURATION_MS = 5000;
    const startTs = performance.now();
    truthDotStartRef.current = startTs;

    const tick = (now: number) => {
      if (truthDotStartRef.current === null) return;
      const elapsed = now - truthDotStartRef.current;
      const ratio = Math.min(1, Math.max(0, elapsed / HOLD_DURATION_MS));
      setTruthDotHoldProgress(ratio);
      if (ratio >= 1) {
        triggerTruthSupernova();
        return;
      }
      truthDotRafRef.current = window.requestAnimationFrame(tick);
    };

    truthDotRafRef.current = window.requestAnimationFrame(tick);
  }, [cancelTruthDotHold, isGenesisModalOpen, triggerTruthSupernova, truthExplosionActive]);

  useEffect(() => {
    return () => {
      if (truthDotRafRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(truthDotRafRef.current);
      }
      if (truthExplosionTimerRef.current) clearTimeout(truthExplosionTimerRef.current);
    };
  }, []);

  // =========================================================================
  // URL DEEP-LINK INITIALIZATION (?compare=, ?asset=, ?mode=, ?lab=, ?genesis=)
  // =========================================================================
  const pendingDeepLinkRef = useRef<ReturnType<typeof parseDeepLinkSearchParams> | null>(
    typeof window !== 'undefined' ? parseDeepLinkSearchParams(window.location.search) : null
  );
  const deepLinkFlagsAppliedRef = useRef(false);

  useEffect(() => {
    const dl = pendingDeepLinkRef.current;
    if (!dl || !dl.hasDeepLink) return;

    if (!deepLinkFlagsAppliedRef.current) {
      deepLinkFlagsAppliedRef.current = true;
      if (dl.mode === 'NORMIE') setIsGeniusMode(false);
      else if (dl.mode === 'GENIUS' || dl.compareTickers.length > 0 || dl.assetTicker) {
        setIsGeniusMode(true);
      }
      if (dl.openGainsModal) setIsGainsModalOpen(true);
      if (dl.openRubricModal) setIsRubricOpen(true);
      if (dl.openGenesisModal) setIsGenesisModalOpen(true);
    }

    if (dl.compareTickers.length >= 2) {
      const resolved = dl.compareTickers
        .map((tk) => findArchivedAudit(audits, tk, dynamicAliases)?.ticker || null)
        .filter((t): t is string => Boolean(t));
      if (resolved.length === dl.compareTickers.length) {
        setPinnedKeys(resolved);
        setActiveKey(resolved[0]);
        setIsTutorialOpen(false);
        pendingDeepLinkRef.current = null;
        return;
      }
    }

    if (dl.assetTicker) {
      const hit = findArchivedAudit(audits, dl.assetTicker, dynamicAliases);
      if (hit) {
        setPinnedKeys([]);
        setActiveKey(hit.ticker);
        setIsTutorialOpen(false);
        if (dl.openWartimeLab) {
          setEssayViewMode(false);
          setModalInvId('04');
          scrollToWartimeSim();
        } else if (dl.invariantId) {
          setEssayViewMode(false);
          setModalInvId(dl.invariantId);
        }
        pendingDeepLinkRef.current = null;
      }
    }
  }, [audits, dynamicAliases]);

  // =========================================================================
  // GLOBAL ARCHIVE-ONLY BROWSER AGENT HOOK & WEBMCP TOOL REGISTRATION
  // =========================================================================
  const agentSnapshotRef = useRef({
    audits,
    dynamicAliases,
    isGeniusMode,
    activeKey,
    validPinnedKeys,
    isAnyModalOpen
  });
  agentSnapshotRef.current = {
    audits,
    dynamicAliases,
    isGeniusMode,
    activeKey,
    validPinnedKeys,
    isAnyModalOpen
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const preloadedSet = new Set(Object.keys(PRELOADED_AUDITS));

    const openAgentModal = (
      kind: 'RUBRIC' | 'ARCHIVE' | 'GAINS' | 'GENESIS_EASTER_EGG' | 'WARTIME_LAB' | null
    ) => {
      setModalInvId(null);
      setIsRubricOpen(false);
      setIsArchiveModalOpen(false);
      setIsGainsModalOpen(false);
      setIsDonateModalOpen(false);
      setIsGenesisModalOpen(false);
      if (kind === 'RUBRIC') setIsRubricOpen(true);
      else if (kind === 'ARCHIVE') setIsArchiveModalOpen(true);
      else if (kind === 'GAINS') setIsGainsModalOpen(true);
      else if (kind === 'GENESIS_EASTER_EGG') setIsGenesisModalOpen(true);
      else if (kind === 'WARTIME_LAB') {
        const snap = agentSnapshotRef.current;
        if (!snap.activeKey) setActiveKey('KAS');
        setEssayViewMode(false);
        setModalInvId('04');
        scrollToWartimeSim();
      }
      return { ok: true, archiveOnly: true, opened: kind };
    };

    const agentApi = {
      isArchiveOnly: true as const,
      version: '1.0.0',
      getState: () => {
        const snap = agentSnapshotRef.current;
        return {
          archiveOnly: true as const,
          creditsUsed: 0,
          activeTicker: snap.activeKey,
          pinnedTickers: snap.validPinnedKeys,
          mode: snap.isGeniusMode ? ('GENIUS' as const) : ('NORMIE' as const),
          archivedCount: Object.keys(snap.audits).length,
          isModalOpen: snap.isAnyModalOpen
        };
      },
      listArchived: (filters: ArchivedAuditListFilters = {}) => {
        const snap = agentSnapshotRef.current;
        const list = listArchivedAudits(snap.audits, filters, preloadedSet);
        return {
          ok: true,
          archiveOnly: true as const,
          creditsUsed: 0,
          count: list.length,
          audits: list
        };
      },
      getAudit: (ticker: string) => {
        const snap = agentSnapshotRef.current;
        const hit = findArchivedAudit(snap.audits, ticker, snap.dynamicAliases);
        if (!hit) {
          return {
            ok: false,
            archiveOnly: true as const,
            archived: false,
            creditsUsed: 0,
            error: `Asset "${ticker}" is not in the Archive. Strictly archive-only hook never calls Gemini.`
          };
        }
        return {
          ok: true,
          archiveOnly: true as const,
          archived: true,
          creditsUsed: 0,
          summary: summarizeArchivedAudit(hit, preloadedSet),
          audit: hit
        };
      },
      selectAsset: (
        ticker: string,
        opts: { mode?: 'NORMIE' | 'GENIUS'; lab?: 'wartime'; invId?: string } = {}
      ) => {
        const snap = agentSnapshotRef.current;
        const hit = findArchivedAudit(snap.audits, ticker, snap.dynamicAliases);
        if (!hit) {
          return {
            ok: false,
            archiveOnly: true as const,
            archived: false,
            creditsUsed: 0,
            error: `Asset "${ticker}" is not archived.`
          };
        }
        setIsTutorialOpen(false);
        setPinnedKeys([]);
        setActiveKey(hit.ticker);
        setHoveredInvId(null);
        setModalInvId(null);
        if (opts.mode === 'NORMIE') setIsGeniusMode(false);
        else setIsGeniusMode(true);
        if (opts.lab === 'wartime') {
          setEssayViewMode(false);
          setModalInvId('04');
          scrollToWartimeSim();
        } else if (opts.invId && /^0?[1-6]$/.test(opts.invId)) {
          setEssayViewMode(false);
          setModalInvId(opts.invId.padStart(2, '0'));
        }
        return {
          ok: true,
          archiveOnly: true as const,
          creditsUsed: 0,
          selectedTicker: hit.ticker,
          summary: summarizeArchivedAudit(hit, preloadedSet),
          audit: hit
        };
      },
      compareArchived: (
        tickers: string[],
        mode?: 'NORMIE' | 'GENIUS'
      ) => {
        const snap = agentSnapshotRef.current;
        const resolvedMode = mode === 'NORMIE' ? 'NORMIE' : 'GENIUS';
        const comp = buildArchiveComparison(snap.audits, tickers, {
          mode: resolvedMode,
          dynamicAliases: snap.dynamicAliases,
          preloadedTickers: preloadedSet
        });
        if (comp.ok) {
          setIsTutorialOpen(false);
          setModalInvId(null);
          setIsRubricOpen(false);
          setIsArchiveModalOpen(false);
          setIsGainsModalOpen(false);
          setIsGenesisModalOpen(false);
          setIsGeniusMode(resolvedMode === 'GENIUS');
          setPinnedKeys(comp.tickers);
          setActiveKey(comp.tickers[0]);
          setHoveredInvId(null);
        }
        return comp;
      },
      researchArchive: (
        question: string,
        opts: { mode?: 'NORMIE' | 'GENIUS'; syncUi?: boolean } = {}
      ) => {
        const snap = agentSnapshotRef.current;
        const resolvedMode = opts.mode === 'NORMIE' ? 'NORMIE' : 'GENIUS';
        const result = answerArchiveResearchQuestion(snap.audits, question, {
          mode: resolvedMode,
          dynamicAliases: snap.dynamicAliases,
          preloadedTickers: preloadedSet
        });
        if (opts.syncUi !== false && result.ok && result.matchedTickers.length > 0) {
          setIsTutorialOpen(false);
          setIsGeniusMode(resolvedMode === 'GENIUS');
          if (result.matchedTickers.length >= 2) {
            setPinnedKeys(result.matchedTickers);
            setActiveKey(result.matchedTickers[0]);
          } else {
            setPinnedKeys([]);
            setActiveKey(result.matchedTickers[0]);
          }
        }
        return result;
      },
      clearSelection: () => {
        setPinnedKeys([]);
        setActiveKey(null);
        setHoveredInvId(null);
        setExpandedSyncInvId(null);
        setModalInvId(null);
        return { ok: true, archiveOnly: true as const };
      },
      setDepthMode: (mode: 'NORMIE' | 'GENIUS') => {
        setIsGeniusMode(mode === 'GENIUS');
        return { ok: true, mode: mode === 'GENIUS' ? 'GENIUS' : 'NORMIE' };
      },
      openModal: openAgentModal
    };

    const win = window as unknown as {
      __THE_TRUTH_AGENT__?: typeof agentApi;
    };
    win.__THE_TRUTH_AGENT__ = agentApi;

    const onMessage = (event: MessageEvent) => {
      const data = event?.data as
        | { type?: string; id?: string | number; action?: string; payload?: Record<string, unknown> }
        | undefined;
      if (!data || data.type !== 'THE_TRUTH_AGENT_COMMAND') return;
      let result: unknown = { ok: false, error: 'Unsupported command.' };
      const p = data.payload || {};
      if (data.action === 'getState') result = agentApi.getState();
      else if (data.action === 'listArchived')
        result = agentApi.listArchived(p as ArchivedAuditListFilters);
      else if (data.action === 'getAudit') result = agentApi.getAudit(String(p.ticker || ''));
      else if (data.action === 'selectAsset')
        result = agentApi.selectAsset(String(p.ticker || ''), p as never);
      else if (data.action === 'compareArchived')
        result = agentApi.compareArchived(
          Array.isArray(p.tickers) ? p.tickers.map(String) : [],
          p.mode as never
        );
      else if (data.action === 'researchArchive')
        result = agentApi.researchArchive(String(p.question || ''), p as never);
      else if (data.action === 'clearSelection') result = agentApi.clearSelection();
      else if (data.action === 'setDepthMode')
        result = agentApi.setDepthMode(String(p.mode || 'NORMIE') as never);
      else if (data.action === 'openModal')
        result = agentApi.openModal((p.kind as never) || null);

      if (event.source && typeof (event.source as Window).postMessage === 'function') {
        (event.source as Window).postMessage(
          { type: 'THE_TRUTH_AGENT_RESPONSE', id: data.id ?? null, result },
          event.origin && event.origin !== 'null' ? event.origin : '*'
        );
      }
    };
    window.addEventListener('message', onMessage);

    // Optional W3C WebMCP navigator.modelContext tool registration (strictly archive-only)
    const navWithMcp = navigator as Navigator & {
      modelContext?: {
        registerTool?: (tool: {
          name: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
        }) => void;
        unregisterTool?: (name: string) => void;
      };
    };
    const registeredWebMcpNames: string[] = [];
    if (navWithMcp.modelContext?.registerTool) {
      const webMcpDefs = [
        {
          name: 'truth_list_archived',
          description:
            'List verified archived crypto & physical commodity audits in The Truth (0 AI credits).',
          inputSchema: {
            type: 'object',
            properties: {
              basket: { type: 'string', enum: ['ALL', 'PASSED', 'FAILED'] },
              q: { type: 'string' }
            }
          },
          execute: (args: Record<string, unknown>) =>
            agentApi.listArchived(args as ArchivedAuditListFilters)
        },
        {
          name: 'truth_compare_archived',
          description:
            'Compare 2–4 archived assets side-by-side inside the UI constellation (strictly archive-only).',
          inputSchema: {
            type: 'object',
            required: ['tickers'],
            properties: {
              tickers: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
              mode: { type: 'string', enum: ['NORMIE', 'GENIUS'] }
            }
          },
          execute: (args: Record<string, unknown>) =>
            agentApi.compareArchived(
              Array.isArray(args.tickers) ? args.tickers.map(String) : [],
              args.mode as never
            )
        },
        {
          name: 'truth_research_archive',
          description:
            'Answer cryptocurrency comparison or Proof-of-Stake vs Proof-of-Work questions strictly from archived audits.',
          inputSchema: {
            type: 'object',
            required: ['question'],
            properties: {
              question: { type: 'string' },
              mode: { type: 'string', enum: ['NORMIE', 'GENIUS'] }
            }
          },
          execute: (args: Record<string, unknown>) =>
            agentApi.researchArchive(String(args.question || ''), { mode: args.mode as never })
        }
      ];
      for (const toolDef of webMcpDefs) {
        try {
          navWithMcp.modelContext.registerTool(toolDef);
          registeredWebMcpNames.push(toolDef.name);
        } catch {
          // Ignore browser WebMCP differences
        }
      }
    }

    return () => {
      window.removeEventListener('message', onMessage);
      delete win.__THE_TRUTH_AGENT__;
      if (navWithMcp.modelContext?.unregisterTool) {
        for (const tName of registeredWebMcpNames) {
          try {
            navWithMcp.modelContext.unregisterTool(tName);
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    };
  }, []);

  const stageSize = 440;
  const centerCoord = stageSize / 2;
  const orbitRadius = 152;

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#F3F4F6] flex flex-col justify-between relative overflow-x-clip selection:bg-[#49EACB]/25 selection:text-[#49EACB] font-sans">
      <style>{`
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .font-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace; }
        .spring-orbit {
          transition:
            transform 460ms cubic-bezier(0.20, 1.22, 0.32, 1),
            translate 460ms cubic-bezier(0.20, 1.22, 0.32, 1),
            scale 460ms cubic-bezier(0.20, 1.22, 0.32, 1),
            opacity 280ms ease,
            box-shadow 320ms ease,
            border-color 320ms ease;
        }
        .color-glide {
          transition:
            color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            background-color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 480ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 480ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 340ms ease,
            transform 340ms cubic-bezier(0.22, 1, 0.36, 1),
            translate 340ms cubic-bezier(0.22, 1, 0.36, 1),
            scale 340ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes selectContentFade {
          0% {
            opacity: 0.14;
            transform: scale(0.94) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-select-fade {
          animation: selectContentFade 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes cardCrossfade {
          0% {
            opacity: 0;
            transform: translateY(5px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-card-fade {
          animation: cardCrossfade 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes pinNodeAppear {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-pin-enter {
          animation: pinNodeAppear 400ms cubic-bezier(0.20, 1.18, 0.32, 1) both;
        }
        @keyframes stageCrossfade {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.975);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-stage-enter {
          animation: stageCrossfade 360ms cubic-bezier(0.22, 1, 0.36, 1) 40ms backwards;
        }
        @keyframes syncExpandDown {
          0% {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        .animate-sync-expand-down {
          animation: syncExpandDown 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: top center;
        }
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-modal-backdrop {
          animation: modalBackdropFade 220ms ease-out both;
          will-change: opacity;
        }
        @keyframes modalSheetPop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.975);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-modal-sheet {
          animation: modalSheetPop 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
        }
        @keyframes scanPulseRing {
          0% { transform: scale(0.88); opacity: 0.85; }
          100% { transform: scale(1.65); opacity: 0; }
        }
        .animate-scan-pulse {
          animation: scanPulseRing 360ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes dashFlow {
          to { stroke-dashoffset: -24; }
        }
        .sim-flow-line {
          animation: dashFlow 1.15s linear infinite;
        }
        @keyframes spinSlowCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinSlowCcw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .spin-cw {
          animation: spinSlowCw 9s linear infinite;
          transform-origin: center;
        }
        .spin-ccw {
          animation: spinSlowCcw 6.5s linear infinite;
          transform-origin: center;
        }
        .hero-search-dock {
          transition:
            transform 740ms cubic-bezier(0.22, 1, 0.36, 1),
            translate 740ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 420ms ease;
          will-change: transform, translate;
        }
        .hero-title-scale {
          transform-origin: bottom center;
          transition:
            transform 740ms cubic-bezier(0.22, 1, 0.36, 1),
            scale 740ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, scale;
        }
        @keyframes bgFieldPulse {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale3d(0.95, 0.95, 1);
            opacity: 0.42;
          }
          50% {
            transform: translate3d(0, 0, 0) scale3d(1.06, 1.06, 1);
            opacity: 0.98;
          }
        }
        @keyframes bgCoreBreath {
          0%, 100% {
            transform: translate3d(-50%, -50%, 0) scale3d(0.84, 0.84, 1);
            opacity: 0.36;
          }
          50% {
            transform: translate3d(-50%, -50%, 0) scale3d(1.22, 1.22, 1);
            opacity: 0.95;
          }
        }
        @keyframes bgHaloWave {
          0% {
            transform: translate3d(-50%, -50%, 0) scale3d(0.74, 0.74, 1);
            opacity: 0;
          }
          42% {
            opacity: 0.5;
          }
          100% {
            transform: translate3d(-50%, -50%, 0) scale3d(1.46, 1.46, 1);
            opacity: 0;
          }
        }
        .bg-field-pulse {
          animation: bgFieldPulse var(--bg-pulse-dur, 4.4s) ease-in-out infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .bg-core-breath {
          transform: translate3d(-50%, -50%, 0);
          animation: bgCoreBreath var(--bg-pulse-dur, 4.4s) ease-in-out infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        .bg-halo-wave {
          transform: translate3d(-50%, -50%, 0);
          animation: bgHaloWave var(--bg-pulse-dur, 4.4s) cubic-bezier(0.22, 1, 0.36, 1) infinite;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        @keyframes geniusVortexSpin {
          0% {
            transform: translate3d(-50%, -50%, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(-50%, -50%, 0) rotate(360deg);
          }
        }
        @keyframes geniusMathFloat {
          0%, 100% {
            transform: translate3d(-50%, -50%, 0) translate3d(0px, 0px, 0) rotate(0deg) scale(var(--math-scale, 1));
          }
          50% {
            transform: translate3d(-50%, -50%, 0) translate3d(var(--math-dx, 14px), var(--math-dy, -12px), 0) rotate(var(--math-rot, 1.5deg)) scale(var(--math-scale, 1));
          }
        }
        .genius-vortex-spin {
          transform: translate3d(-50%, -50%, 0);
          animation: geniusVortexSpin var(--vortex-dur, 52s) linear infinite;
          backface-visibility: hidden;
          will-change: transform;
        }
        .genius-math-float {
          transform: translate3d(-50%, -50%, 0) scale(var(--math-scale, 1));
          animation: geniusMathFloat var(--math-dur, 24s) ease-in-out infinite;
          animation-delay: var(--math-delay, 0s);
          backface-visibility: hidden;
        }
        @media (prefers-reduced-motion: reduce) {
          .bg-field-pulse,
          .bg-core-breath,
          .bg-halo-wave,
          .genius-vortex-spin,
          .genius-math-float {
            animation: none !important;
          }
          .animate-stage-enter,
          .animate-pin-enter,
          .animate-card-fade,
          .animate-sync-expand-down,
          .animate-modal-backdrop,
          .animate-modal-sheet {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
        .bg-anim-paused .bg-field-pulse,
        .bg-anim-paused .bg-core-breath,
        .bg-anim-paused .bg-halo-wave,
        .bg-anim-paused .genius-vortex-spin,
        .bg-anim-paused .genius-math-float,
        .genius-vortex-spin.bg-anim-paused,
        .genius-math-float.bg-anim-paused {
          animation-play-state: paused;
        }
        @keyframes truthShockwave {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0.96;
          }
          100% {
            transform: translate(-50%, -50%) scale(16);
            opacity: 0;
          }
        }
        @keyframes truthSparkOut {
          0% {
            transform: translate(-50%, -50%) rotate(var(--spark-angle, 0deg)) translateX(4px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--spark-angle, 0deg)) translateX(88px) scale(0.15);
            opacity: 0;
          }
        }
        .truth-shockwave-ring {
          animation: truthShockwave 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .truth-spark-ray {
          animation: truthSparkOut 660ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Zero-Blur GPU-Composited Pulsing Gradient (NORMIE) <-> Swirling Universe + Physics Laws (GENIUS) */}
      {(() => {
        const activeBackdropScore = isAuditing && runningAuditState
          ? runningAuditState.projectedTotal ?? 4.0
          : hasActiveAudit
          ? Number(currentAudit?.totalScore) || 0
          : 4.0;
        const activeBackdropGrade = isAuditing && runningAuditState
          ? runningAuditState.projectedGrade || 'IDLE'
          : hasActiveAudit
          ? String(currentAudit?.grade || 'F')
          : 'IDLE';
        const scoreRatio = Math.max(0, Math.min(1, activeBackdropScore / 6));
        const pulseDur = isAuditing
          ? `${(3.1 - scoreRatio * 1.25).toFixed(2)}s`
          : isLandingIdle
          ? '4.4s'
          : `${(6.2 - scoreRatio * 3.0).toFixed(2)}s`;
        const coreBaseOpacity = isAuditing
          ? 0.3 + scoreRatio * 0.12
          : isLandingIdle
          ? 0.27
          : 0.16 + scoreRatio * 0.22;

        return (
          <div ref={backdropRootRef} className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div
              data-testid="normie-pulse-bg"
              data-grade={activeBackdropGrade}
              data-pulse-dur={pulseDur}
              className={`pointer-events-none fixed inset-0 overflow-hidden z-0 transition-opacity duration-700 ${
                isGeniusMode ? 'opacity-0 bg-anim-paused' : 'opacity-100'
              } ${isAnyModalOpen ? 'bg-anim-paused' : ''}`}
              style={{
                ['--bg-pulse-dur' as string]: pulseDur,
                contain: 'strict'
              }}
            >
              <div
                className="bg-field-pulse absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${accent.primary}29 0%, ${accent.secondary}14 42%, rgba(11, 12, 14, 0) 74%)`
                }}
              />

              <div
                className="absolute inset-0"
                style={{
                  opacity: coreBaseOpacity,
                  transition: 'opacity 500ms ease'
                }}
              >
                <div
                  className="bg-core-breath absolute left-1/2 top-1/2 w-[680px] h-[680px] sm:w-[980px] sm:h-[980px] rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${accent.primary}58 0%, ${accent.secondary}2E 32%, ${accent.secondary}0F 54%, rgba(11, 12, 14, 0) 72%)`
                  }}
                />
                <div
                  className="bg-halo-wave absolute left-1/2 top-1/2 w-[620px] h-[620px] sm:w-[900px] sm:h-[900px] rounded-full"
                  style={{
                    background: `radial-gradient(circle, rgba(11, 12, 14, 0) 16%, ${accent.secondary}3B 42%, ${accent.primary}14 58%, rgba(11, 12, 14, 0) 72%)`
                  }}
                />
              </div>
            </div>

            <GeniusUniverseBackground
              active={isGeniusMode}
              isAuditing={isAuditing}
              hasActiveAudit={hasActiveAudit}
              grade={activeBackdropGrade}
              totalScore={activeBackdropScore}
              scanProgressPct={scanProgressPct}
              paused={isAnyModalOpen}
              primaryColor={accent.primary}
              secondaryColor={accent.secondary}
            />
          </div>
        );
      })()}

      {/* =====================================================================
          1. EDITORIAL HEADER: Centered Google-Style on Open -> Slides Up on Audit
         ===================================================================== */}
      <header
        className={`relative z-30 w-full pt-5 px-3 sm:px-4 lg:px-4 xl:px-6 flex flex-col items-center ${
          !isLandingIdle && !isMultiStage ? 'pb-1' : 'pb-2'
        }`}
      >
        <div className="relative z-30 w-full flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center justify-center md:justify-start gap-2 w-full md:w-auto">
            <button
              type="button"
              data-tutorial-id="rubric-button"
              onClick={() => setIsRubricOpen(true)}
              className="color-glide px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 shadow-sm"
              title="View Deterministic 6-Invariant Grading Rubric"
            >
              <BookOpen className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
              <span>Rubric</span>
            </button>

            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              className="color-glide px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 shadow-sm"
              title="Thermodynamic Archive & API Credit Shield — Pulls cached & community-audited tokens at 0 API credits"
            >
              {strictCreditLock && !isAdminSession ? (
                <Lock className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
              ) : (
                <Database className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
              )}
              <span>Archive ({sortedTickers.length})</span>
              {isAdminSession && (
                <span
                  data-testid="header-admin-badge"
                  className="animate-card-fade px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-[#49EACB]/15 text-[#49EACB] border border-[#49EACB]/45"
                  title={`Admin Access Active (${archiveUser?.email || PRIMARY_ADMIN_EMAIL}) — Unlimited Audit Pulls`}
                >
                  ADMIN ∞
                </span>
              )}
              {zeroTokenHits > 0 && (
                <span
                  className="animate-card-fade color-glide px-1.5 py-0.2 rounded-full text-[9.5px] font-bold"
                  style={{
                    backgroundColor: accent.secondarySoftBg,
                    color: accent.secondary,
                    border: `1px solid ${accent.secondaryBorder}`
                  }}
                >
                  {zeroTokenHits} Free
                </span>
              )}
            </button>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
            <button
              type="button"
              data-tutorial-id="gains-archive"
              onClick={() => setIsGainsModalOpen(true)}
              title="Open Live Thermodynamic Gains Chart — Passed (E > 0) vs. Failed (E = 0)"
              className="color-glide px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 text-xs font-mono font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            >
              <TrendingUp className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
              <span>Live Gains</span>
              <span
                className="color-glide px-1.5 py-0.2 rounded-full text-[9.5px] font-bold"
                style={{
                  backgroundColor: accent.softBg,
                  color: accent.primary,
                  border: `1px solid ${accent.border}`
                }}
              >
                12x E&gt;0
              </span>
            </button>

            {hasActiveAudit && (
              <button
                type="button"
                onClick={() => copyTextToClipboard(formatXLongPost(currentAudit), 'header-x')}
                className="animate-card-fade color-glide px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm hover:brightness-110"
                style={{
                  backgroundColor: accent.softBg,
                  color: accent.primary,
                  border: `1px solid ${accent.border}`
                }}
              >
                {copiedTarget === 'header-x' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isGeniusMode ? 'Copy Genius Audit' : 'Copy Normie Audit'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* HERO LOCKUP + SEARCH BAR */}
        <div
          ref={heroDockRef}
          className="hero-search-dock relative z-[25] w-full flex flex-col items-center gap-2 mt-3 lg:-mt-9 pointer-events-none"
          style={{
            transform: isLandingIdle
              ? 'translate3d(0, var(--hero-landing-y, 26vh), 0)'
              : 'translate3d(0, 0px, 0)'
          }}
        >
          <div
            className={`hero-title-scale pointer-events-auto flex flex-col items-center justify-center text-center select-none bg-transparent ${
              isLandingIdle ? 'scale-[1.22] sm:scale-[1.36]' : 'scale-100'
            }`}
          >
            <div className="relative inline-flex items-center justify-center">
              <button
                type="button"
                data-testid="truth-dot-trigger"
                aria-label="Hold The Truth dot for 5 seconds to reveal the origin thesis"
                onPointerDown={(e) => {
                  if (e.button === 0 || e.pointerType !== 'mouse') {
                    try {
                      e.currentTarget.setPointerCapture?.(e.pointerId);
                    } catch {
                      // Ignore synthetic events without active pointerId
                    }
                    startTruthDotHold();
                  }
                }}
                onPointerUp={(e) => {
                  try {
                    e.currentTarget.releasePointerCapture?.(e.pointerId);
                  } catch {
                    // Ignore
                  }
                  if (!truthDotTriggeredRef.current) cancelTruthDotHold();
                }}
                onPointerLeave={() => {
                  if (truthDotStartRef.current === null && !truthDotTriggeredRef.current) {
                    cancelTruthDotHold();
                  }
                }}
                onPointerCancel={() => {
                  if (!truthDotTriggeredRef.current) cancelTruthDotHold();
                }}
                onKeyDown={(e) => {
                  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                    e.preventDefault();
                    startTruthDotHold();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    if (!truthDotTriggeredRef.current) cancelTruthDotHold();
                  }
                }}
                className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-transparent focus:outline-none cursor-pointer touch-none"
              >
                {truthDotHoldProgress > 0 && (
                  <svg
                    data-testid="truth-dot-charge-ring"
                    viewBox="0 0 28 28"
                    className="absolute inset-0 w-7 h-7 -rotate-90 pointer-events-none"
                  >
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="14"
                      cy="14"
                      r="11"
                      fill="none"
                      stroke={accent.primary}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 11}
                      strokeDashoffset={2 * Math.PI * 11 * (1 - truthDotHoldProgress)}
                    />
                  </svg>
                )}

                {truthExplosionActive && (
                  <div
                    data-testid="truth-dot-explosion"
                    className="pointer-events-none absolute inset-0 overflow-visible z-50"
                  >
                    <span
                      className="truth-shockwave-ring absolute left-1/2 top-1/2 w-5 h-5 rounded-full border-2"
                      style={{
                        borderColor: accent.primary,
                        boxShadow: `0 0 28px ${accent.primary}, inset 0 0 14px ${accent.secondary}`
                      }}
                    />
                    <span
                      className="truth-shockwave-ring absolute left-1/2 top-1/2 w-3.5 h-3.5 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${accent.primary}AA 0%, transparent 72%)`,
                        animationDelay: '45ms'
                      }}
                    />
                    {Array.from({ length: 14 }, (_, idx) => (
                      <span
                        key={idx}
                        className="truth-spark-ray absolute left-1/2 top-1/2 w-2.5 h-1 rounded-full"
                        style={{
                          ['--spark-angle' as string]: `${idx * (360 / 14)}deg`,
                          backgroundColor: idx % 2 === 0 ? accent.primary : accent.secondary,
                          boxShadow: `0 0 10px ${accent.primary}`
                        }}
                      />
                    ))}
                  </div>
                )}

                <span
                  className="color-glide w-2.5 h-2.5 rounded-full block"
                  style={{
                    backgroundColor: accent.primary,
                    transform:
                      truthDotHoldProgress > 0
                        ? `scale(${(1 + truthDotHoldProgress * 0.55).toFixed(2)})`
                        : undefined,
                    boxShadow:
                      truthDotHoldProgress > 0
                        ? `0 0 ${Math.round(12 + truthDotHoldProgress * 22)}px ${accent.primary}`
                        : `0 0 12px ${accent.primary}`
                  }}
                />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isLandingIdle && !isAuditing) {
                    setActiveKey(null);
                    setPinnedKeys([]);
                    setHoveredInvId(null);
                    setExpandedSyncInvId(null);
                    setConfirmFullReauditKey(null);
                  }
                }}
                title={!isLandingIdle && !isAuditing ? 'Return to centered search' : undefined}
                className={`bg-transparent focus:outline-none ${
                  !isLandingIdle && !isAuditing ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <h1 className="font-display text-2xl sm:text-[30px] font-bold tracking-tight text-white leading-none">
                  The Truth
                </h1>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isLandingIdle && !isAuditing) {
                  setActiveKey(null);
                  setPinnedKeys([]);
                  setHoveredInvId(null);
                  setExpandedSyncInvId(null);
                  setConfirmFullReauditKey(null);
                }
              }}
              className={`color-glide mt-1 font-mono text-[11px] sm:text-xs lowercase tracking-[0.24em] font-medium bg-transparent focus:outline-none ${
                !isLandingIdle && !isAuditing ? 'cursor-pointer' : 'cursor-default'
              }`}
              style={{
                color: accent.secondary,
                textShadow: `0 0 16px ${accent.glow}`
              }}
            >
              thermodynamic audit
            </button>
          </div>

          <div
            className={`pointer-events-auto flex flex-wrap items-center justify-center gap-2 ${
              isLandingIdle ? '-mt-0.5 sm:-mt-1' : '-mt-0.5'
            }`}
          >
            <div
              data-tutorial-id="mode-controls"
              className="h-7 p-0.5 rounded-full bg-[#121418] border border-white/10 inline-flex items-center font-mono text-[10.5px] leading-none shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
              role="group"
              aria-label="Audit Depth Mode Switch"
            >
              <button
                type="button"
                onClick={() => setIsGeniusMode(false)}
                className={`color-glide h-full px-3 rounded-full inline-flex items-center justify-center gap-1.5 border border-transparent leading-none ${
                  !isGeniusMode
                    ? 'bg-[#1D212A] text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <span>NORMIE</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGeniusMode(true)}
                className={`color-glide h-full px-3 rounded-full inline-flex items-center justify-center gap-1.5 leading-none ${
                  isGeniusMode ? 'font-bold shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
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
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>GENIUS</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="sandbox-toggle-btn"
              onClick={() => setIsSandboxMode((prev) => !prev)}
              aria-pressed={isSandboxMode}
              title="Sandbox / Local Preview: stores test & unverified lookups strictly in your browser localStorage instead of persisting them to the shared public archive."
              className={`color-glide h-7 px-3 rounded-full border font-mono text-[10.5px] leading-none inline-flex items-center justify-center gap-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.35)] ${
                isSandboxMode
                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/50 font-semibold'
                  : 'bg-[#121418] text-neutral-400 hover:text-neutral-200 border-white/10'
              }`}
            >
              <FlaskConical className="w-3 h-3 shrink-0" />
              <span>{isSandboxMode ? 'Sandbox: Local Preview' : 'Sandbox Preview'}</span>
            </button>
          </div>

          <div
            className={`relative w-full max-w-xl md:max-w-[356px] lg:max-w-[500px] xl:max-w-xl px-4 sm:px-0 flex flex-col items-center ${
              isLandingIdle ? 'mt-9 sm:mt-10' : 'mt-6 sm:mt-7'
            }`}
          >
            <form
              ref={searchDockRef}
              data-tutorial-id="search-dock"
              onSubmit={handleSearchSubmit}
              className="pointer-events-auto w-full transition-all duration-700 relative"
            >
              <GeniusSearchWaveRings
                active={isGeniusMode}
                isAuditing={isAuditing}
                targetRef={searchPillRef}
              />

              <div
                ref={searchPillRef}
                className="color-glide relative z-10 flex items-center rounded-full bg-[#121418]/[0.96] px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
                style={{
                  border: `1px solid ${
                    isAuditing
                      ? accent.primary
                      : isGeniusMode
                      ? 'rgba(73, 234, 203, 0.35)'
                      : 'rgba(255,255,255,0.1)'
                  }`
                }}
              >
                <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                <label htmlFor="truth-audit-search" className="sr-only">
                  Search asset ticker, physical metal, or fiat currency to audit
                </label>
                <input
                  id="truth-audit-search"
                  name="truth-audit-query"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Audit any crypto, physical metal, or fiat (e.g., USD, EUR, GOLD, KAS, BTC, SOL)..."
                  className="w-full appearance-none bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-mono"
                />
                {isAuditing ? (
                  <span
                    className="color-glide px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 shrink-0"
                    style={{ color: accent.primary }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing</span>
                  </span>
                ) : (
                  <button
                    type="submit"
                    className="color-glide px-3.5 py-1 rounded-full text-xs font-mono font-semibold shrink-0 hover:brightness-110 flex items-center gap-1"
                    style={{
                      backgroundImage: accent.gradientCss,
                      color: accent.textOnAccent
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Audit / Pull</span>
                  </button>
                )}
              </div>
            </form>

            {((archiveToast && !isAuditing) || auditError) && (
              <div
                className={`pointer-events-none absolute top-full left-0 right-0 z-30 flex flex-col items-center gap-2 ${
                  isGeniusMode ? 'mt-8 sm:mt-11' : 'mt-2'
                }`}
              >
                {archiveToast && !isAuditing && (
                  <div
                    className="pointer-events-auto animate-card-fade color-glide max-w-full px-4 py-1.5 rounded-full font-mono text-[11px] flex items-center justify-center gap-2 text-center bg-[#121418]/95 shadow-[0_10px_28px_rgba(0,0,0,0.68)]"
                    style={{
                      border: `1px solid ${
                        archiveToast.tone === 'warn' ? accent.secondaryBorder : accent.border
                      }`,
                      color: archiveToast.tone === 'warn' ? accent.secondary : accent.primary
                    }}
                  >
                    <Database className="w-3.5 h-3.5 shrink-0" />
                    <span>{archiveToast.text}</span>
                  </div>
                )}

                {auditError && (
                  <div className="pointer-events-auto animate-card-fade w-full">
                    <div
                      className="px-4 py-2.5 rounded-2xl bg-[#121418]/[0.96] text-xs font-mono flex flex-wrap items-center justify-between gap-3 shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
                      style={{
                        border: `1px solid ${accent.secondaryBorder}`,
                        color: accent.secondary
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: accent.primary }} />
                        <span>{auditError}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {firebaseAuth && !archiveUser && /Daily limit|Authentication required/i.test(auditError) && (
                          <button
                            type="button"
                            disabled={authBusy}
                            onClick={handleGoogleArchiveAuth}
                            className="px-2.5 py-1 rounded-full bg-[#49EACB]/15 text-[#49EACB] border border-[#49EACB]/45 hover:bg-[#49EACB]/25 text-[10.5px] font-bold transition disabled:opacity-50"
                          >
                            {authBusy ? 'Signing In...' : 'Google Sign-In'}
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Dismiss audit error"
                          onClick={() => setAuditError(null)}
                          className="text-neutral-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. STATIC LEFT (PASSED // E > 0) & STATIC RIGHT (FAILED // E = 0) COLUMNS
         ===================================================================== */}
      {!isMobileViewport && (
        <>
          <aside
            data-tutorial-id="passed-sidebar"
            style={
              displayMetrics.sidebarWidthPx
                ? { width: `${displayMetrics.sidebarWidthPx}px` }
                : undefined
            }
            className="hidden md:flex md:absolute md:left-3 lg:left-4 xl:left-6 md:top-[calc(50vh+36px)] lg:top-[calc(50vh+24px)] md:-translate-y-1/2 md:w-[176px] lg:w-[212px] xl:w-[250px] md:max-h-[calc(100vh-232px)] lg:max-h-[calc(100vh-204px)] z-30 rounded-3xl bg-[#121418]/[0.92] border border-white/[0.06] p-3 lg:p-3.5 xl:p-4 flex-col items-center shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
          >
            <div className="w-full shrink-0 flex items-center justify-between pb-2.5 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-[#49EACB] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                <span>Passed // E &gt; 0</span>
              </span>
              <span className="text-neutral-500 hidden xl:inline">{passedTickers.length} Harmonic</span>
              <span className="text-neutral-500 xl:hidden">{passedTickers.length}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsGainsModalOpen(true)}
              title="Open Live Thermodynamic Gains & Cohort Divergence Chart"
              className="w-full shrink-0 py-1.5 mb-1 border-b border-white/[0.05] flex items-center justify-between gap-1 font-mono text-[9.5px] text-[#49EACB]/85 hover:text-[#49EACB] transition-colors text-left cursor-pointer group"
            >
              <span className="truncate group-hover:underline underline-offset-2 font-semibold tabular-nums">
                {formatPctSigned(basketGainsSummary.passCycleAvg)}
              </span>
              <span className="shrink-0 opacity-75 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>

            <div className="-mx-2.5 w-[calc(100%+20px)] overflow-y-auto no-scrollbar px-3.5 py-3.5 xl:py-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 xl:gap-3.5">
                {corePassedTickers.map((tk, idx) => (
                  <HarmonicProjectBubble
                    key={tk}
                    item={audits[tk]}
                    isSelected={activeKey === tk}
                    isPinnedItem={
                      isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                    }
                    onSelectTicker={stableSelectTicker}
                    onTogglePin={stableTogglePin}
                    seedIndex={idx}
                    sizePx={displayMetrics.sidebarBubbleSizePx}
                  />
                ))}
              </div>
              {ecosystemPassedTickers.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-indigo-300/80 text-center">
                    Ecosystem / Overlays ({ecosystemPassedTickers.length})
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
                    {ecosystemPassedTickers.map((tk, idx) => (
                      <HarmonicProjectBubble
                        key={tk}
                        item={audits[tk]}
                        isSelected={activeKey === tk}
                        isPinnedItem={
                          isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                        }
                        onSelectTicker={stableSelectTicker}
                        onTogglePin={stableTogglePin}
                        seedIndex={idx + 30}
                        sizePx={displayMetrics.sidebarBubbleSizePx}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <aside
            data-tutorial-id="failed-sidebar"
            style={
              displayMetrics.sidebarWidthPx
                ? { width: `${displayMetrics.sidebarWidthPx}px` }
                : undefined
            }
            className="hidden md:flex md:absolute md:right-3 lg:right-4 xl:right-6 md:top-[calc(50vh+36px)] lg:top-[calc(50vh+24px)] md:-translate-y-1/2 md:w-[176px] lg:w-[212px] xl:w-[250px] md:max-h-[calc(100vh-232px)] lg:max-h-[calc(100vh-204px)] z-30 rounded-3xl bg-[#121418]/[0.92] border border-white/[0.06] p-3 lg:p-3.5 xl:p-4 flex-col items-center shadow-[0_14px_36px_rgba(0,0,0,0.5)]"
          >
            <div className="w-full shrink-0 flex items-center justify-between pb-2.5 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                <span>Failed // E = 0</span>
              </span>
              <span className="text-neutral-500 hidden xl:inline">{failedTickers.length} Flatlined</span>
              <span className="text-neutral-500 xl:hidden">{failedTickers.length}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsGainsModalOpen(true)}
              title="Open Live Thermodynamic Gains & Cohort Divergence Chart"
              className="w-full shrink-0 py-1.5 mb-1 border-b border-white/[0.05] flex items-center justify-between gap-1 font-mono text-[9.5px] text-[#EF4444]/85 hover:text-[#EF4444] transition-colors text-left cursor-pointer group"
            >
              <span className="truncate group-hover:underline underline-offset-2 font-semibold tabular-nums">
                {formatPctSigned(basketGainsSummary.failCycleAvg)}
              </span>
              <span className="shrink-0 opacity-75 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>

            <div className="-mx-2.5 w-[calc(100%+20px)] overflow-y-auto no-scrollbar px-3.5 py-3.5 xl:py-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 xl:gap-3.5">
                {coreFailedTickers.map((tk, idx) => (
                  <HarmonicProjectBubble
                    key={tk}
                    item={audits[tk]}
                    isSelected={activeKey === tk}
                    isPinnedItem={
                      isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                    }
                    onSelectTicker={stableSelectTicker}
                    onTogglePin={stableTogglePin}
                    seedIndex={idx + 50}
                    sizePx={displayMetrics.sidebarBubbleSizePx}
                  />
                ))}
              </div>
              {ecosystemFailedTickers.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-indigo-300/80 text-center">
                    Ecosystem / Overlays ({ecosystemFailedTickers.length})
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
                    {ecosystemFailedTickers.map((tk, idx) => (
                      <HarmonicProjectBubble
                        key={tk}
                        item={audits[tk]}
                        isSelected={activeKey === tk}
                        isPinnedItem={
                          isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                        }
                        onSelectTicker={stableSelectTicker}
                        onTogglePin={stableTogglePin}
                        seedIndex={idx + 80}
                        sizePx={displayMetrics.sidebarBubbleSizePx}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* =====================================================================
          2B. CENTER ARENA (BLANK GOOGLE-STYLE LANDING, SINGLE SPHERE, OR 2–4 CONSTELLATIONS)
         ===================================================================== */}
      <main
        style={
          displayMetrics.mainHorizontalPadPx
            ? {
                paddingLeft: `${displayMetrics.mainHorizontalPadPx}px`,
                paddingRight: `${displayMetrics.mainHorizontalPadPx}px`
              }
            : undefined
        }
        className={`relative z-10 flex-1 w-full px-4 md:pl-[196px] md:pr-[196px] lg:pl-[244px] lg:pr-[244px] xl:pl-[290px] xl:pr-[290px] pb-3 sm:pb-4 flex flex-col items-center justify-start ${
          !isLandingIdle && !isMultiStage ? 'pt-0.5 sm:pt-2' : 'pt-7 sm:pt-8'
        }`}
      >
        {isLandingIdle ? (
          <div
            className="w-full min-h-[46vh] md:min-h-[62vh] pointer-events-none"
            aria-hidden="true"
          />
        ) : isMultiStage ? (
          (() => {
            const count = stageTickers.length;
            const layout = getConstellationLayout(
              count,
              threeFormation,
              fourFormation,
              pinOrientationMode
            );
            const widthFitScale = Math.max(0.32, (constellationWrapWidth - 8) / layout.width);
            const heightFitScale =
              pinOrientationMode === 'desktop'
                ? Math.max(0.76, (viewportMetrics.height - 645) / Math.max(1, layout.height))
                : displayMetrics.pinMaxScale;
            const responsiveScale = Math.min(
              displayMetrics.pinMaxScale,
              widthFitScale,
              heightFitScale
            );
            const scaledArenaHeight = Math.round(layout.height * responsiveScale);

            return (
              <div className="animate-stage-enter w-full flex flex-col items-center gap-6">
                <div
                  data-tutorial-id="pin-compare"
                  className="w-full max-w-5xl rounded-2xl bg-[#121418]/90 border border-white/10 px-3.5 py-2.5 flex flex-wrap items-center justify-center md:justify-between gap-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
                >
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mr-1">
                      Pinned ({count}/4):
                    </span>
                    {stageTickers.map((tk) => {
                      const item = audits[tk];
                      if (!item) return null;
                      const itemAcc = getGradeAccent(item.grade);
                      const isCurr = activeKey === tk;
                      return (
                        <div
                          key={tk}
                          className="animate-card-fade color-glide inline-flex items-center rounded-full font-mono text-[11px]"
                          style={{
                            backgroundColor: isCurr ? itemAcc.softBg : '#0B0C0E',
                            border: `1px solid ${isCurr ? itemAcc.border : 'rgba(255,255,255,0.1)'}`,
                            color: itemAcc.primary,
                            boxShadow: isCurr ? `0 0 12px ${itemAcc.glow}` : 'none'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveKey(tk)}
                            className="pl-2.5 pr-1.5 py-0.5 font-semibold hover:brightness-110 transition"
                          >
                            ${item.ticker} {item.grade}
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove $${item.ticker} from comparison`}
                            onClick={() => unpinFromConstellation(tk)}
                            title={`Remove $${item.ticker}`}
                            className="pr-2 pl-0.5 py-0.5 text-neutral-400 hover:text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5">
                    {pinOrientationMode === 'desktop' && count === 2 && (
                      <div className="px-2.5 py-1 rounded-full bg-[#0B0C0E] border border-white/10 font-mono text-[10.5px] text-neutral-300 flex items-center gap-1.5">
                        <Columns className="w-3 h-3 color-glide" style={{ color: accent.primary }} />
                        <span>Side-by-Side</span>
                        <span className="text-neutral-500 hidden xl:inline">
                          • Pin 1–2 more for △ / □ / ◇
                        </span>
                      </div>
                    )}

                    {pinOrientationMode === 'desktop' && count === 3 && (
                      <div className="p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 flex items-center font-mono text-[10.5px]">
                        <button
                          type="button"
                          onClick={() => setThreeFormation('TRIANGLE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            threeFormation === 'TRIANGLE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <polygon points="6,1.5 11,10.2 1,10.2" />
                          </svg>
                          <span>Triangle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThreeFormation('SIDE_BY_SIDE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            threeFormation === 'SIDE_BY_SIDE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Columns className="w-3 h-3" />
                          <span>Side-by-Side</span>
                        </button>
                      </div>
                    )}

                    {pinOrientationMode === 'desktop' && count === 4 && (
                      <div className="p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 flex items-center font-mono text-[10.5px]">
                        <button
                          type="button"
                          onClick={() => setFourFormation('RHOMBUS')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'RHOMBUS'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <polygon points="6,1 11,6 6,11 1,6" />
                          </svg>
                          <span>Rhombus</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFourFormation('SQUARE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'SQUARE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <svg viewBox="0 0 12 12" className="w-3 h-3 stroke-current fill-none" strokeWidth="1.6">
                            <rect x="1.8" y="1.8" width="8.4" height="8.4" rx="1" />
                          </svg>
                          <span>Square</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFourFormation('SIDE_BY_SIDE')}
                          className={`px-2.5 py-1 rounded-full transition flex items-center gap-1.5 ${
                            fourFormation === 'SIDE_BY_SIDE'
                              ? 'bg-[#191E27] text-white font-semibold border border-white/15'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Columns className="w-3 h-3" />
                          <span>Side-by-Side</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandAllOrbits((p) => !p)}
                      className="px-2.5 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] border border-white/10 font-mono text-[10.5px] text-neutral-300 hover:text-white transition"
                    >
                      {expandAllOrbits ? '6-Inv Orbits: Open' : 'Harmonic Waves'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPinnedKeys([]);
                        setHoveredInvId(null);
                        setExpandedSyncInvId(null);
                      }}
                      className="color-glide px-2.5 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] font-mono text-[10.5px] hover:text-white transition flex items-center gap-1"
                      style={{
                        border: `1px solid ${accent.secondaryBorder}`,
                        color: accent.secondary
                      }}
                    >
                      <X className="w-3 h-3" />
                      <span>Clear Pins</span>
                    </button>
                  </div>
                </div>

                <div
                  ref={constellationMeasureRef}
                  data-orientation-mode={pinOrientationMode}
                  className="w-full flex justify-center overflow-visible transition-[height] duration-500 ease-out"
                  style={{ height: `${scaledArenaHeight}px` }}
                >
                  <div
                    className="relative shrink-0 transition-[width,height] duration-500 ease-out"
                    style={{
                      width: `${layout.width}px`,
                      height: `${layout.height}px`,
                      transform: `scale(${responsiveScale})`,
                      transformOrigin: 'top center'
                    }}
                  >
                    <svg
                      width={layout.width}
                      height={layout.height}
                      viewBox={`0 0 ${layout.width} ${layout.height}`}
                      className="absolute inset-0 pointer-events-none z-10"
                    >
                      {layout.diagonals.map(([aIdx, bIdx], dIdx) => {
                        const pA = layout.positions[aIdx];
                        const pB = layout.positions[bIdx];
                        if (!pA || !pB) return null;
                        return (
                          <line
                            key={`diag-${dIdx}`}
                            x1={pA.x}
                            y1={pA.y}
                            x2={pB.x}
                            y2={pB.y}
                            stroke="rgba(255,255,255,0.11)"
                            strokeWidth="1"
                            strokeDasharray="3 7"
                          />
                        );
                      })}

                      {layout.edges.map(([aIdx, bIdx], eIdx) => {
                        const pA = layout.positions[aIdx];
                        const pB = layout.positions[bIdx];
                        const audA = audits[stageTickers[aIdx]];
                        const audB = audits[stageTickers[bIdx]];
                        if (!pA || !pB || !audA || !audB) return null;
                        const colA = getGradeAccent(audA.grade).primary;
                        const colB = getGradeAccent(audB.grade).primary;
                        const gradId = `constellationEdge-${eIdx}`;
                        const midX = (pA.x + pB.x) / 2;
                        const midY = (pA.y + pB.y) / 2;
                        const delta = Math.abs(
                          (Number(audA.totalScore) || 0) - (Number(audB.totalScore) || 0)
                        );

                        return (
                          <g key={`edge-${eIdx}`} className="animate-card-fade">
                            <defs>
                              <linearGradient
                                id={gradId}
                                x1={pA.x}
                                y1={pA.y}
                                x2={pB.x}
                                y2={pB.y}
                                gradientUnits="userSpaceOnUse"
                              >
                                <stop offset="0%" style={{ stopColor: colA, stopOpacity: 0.48 }} />
                                <stop offset="100%" style={{ stopColor: colB, stopOpacity: 0.48 }} />
                              </linearGradient>
                            </defs>
                            <line
                              x1={pA.x}
                              y1={pA.y}
                              x2={pB.x}
                              y2={pB.y}
                              stroke={`url(#${gradId})`}
                              strokeWidth="1.6"
                              strokeDasharray="6 6"
                              className="sim-flow-line"
                            />
                            <rect
                              x={midX - 26}
                              y={midY - 9}
                              width="52"
                              height="18"
                              rx="9"
                              fill="#0B0C0E"
                              stroke="rgba(255,255,255,0.14)"
                              strokeWidth="1"
                            />
                            <text
                              x={midX}
                              y={midY + 3.2}
                              textAnchor="middle"
                              fill="#D1D5DB"
                              fontSize="8.5"
                              fontFamily="JetBrains Mono, monospace"
                              fontWeight="600"
                            >
                              Δ {formatScore(delta)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {exitingPins.map((ghost) => (
                      <PinnedOrbitalNode
                        key={ghost.ghostId}
                        auditObj={ghost.auditObj}
                        x={ghost.x}
                        y={ghost.y}
                        nodeScale={ghost.nodeScale}
                        isFocused={false}
                        isExiting
                        expandOrbits={expandAllOrbits}
                        hoveredInvId={null}
                        onHoverInv={() => {}}
                        onFocusBubble={() => {}}
                        onUnpin={() => {}}
                        onOpenInvariantModal={() => {}}
                        seedOffset={0}
                      />
                    ))}

                    {stageTickers.map((tk, idx) => {
                      const item = audits[tk];
                      const pos = layout.positions[idx] || {
                        x: layout.width / 2,
                        y: layout.height / 2
                      };
                      if (!item) return null;

                      return (
                        <PinnedOrbitalNode
                          key={tk}
                          auditObj={item}
                          x={pos.x}
                          y={pos.y}
                          nodeScale={layout.nodeScale}
                          isFocused={activeKey === tk}
                          expandOrbits={expandAllOrbits}
                          hoveredInvId={hoveredInvId || expandedSyncInvId || modalInvId}
                          onHoverInv={setHoveredInvId}
                          onFocusBubble={() => setActiveKey(tk)}
                          onUnpin={() => unpinFromConstellation(tk)}
                          onOpenInvariantModal={(invId) => {
                            setActiveKey(tk);
                            setEssayViewMode(false);
                            setHoveredInvId(invId);
                            setExpandedSyncInvId(invId);
                            scrollToSyncComparison();
                          }}
                          seedOffset={idx * 1.7}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Synchronized Cross-Bubble Invariant Matrix Bar */}
                <div ref={syncComparisonAnchorRef} className="w-full max-w-5xl space-y-3 scroll-mt-4">
                  <div
                    onMouseLeave={() => {
                      if (expandedSyncInvId) {
                        setHoveredInvId(expandedSyncInvId);
                      }
                    }}
                    className="flex flex-wrap items-center justify-center gap-1.5 text-center"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 w-full text-center">
                      Sync Invariant:
                    </span>
                    {DEFAULT_SHORT_NAMES.map((sName, idx) => {
                      const idStr = `0${idx + 1}`;
                      const isExpanded = expandedSyncInvId === idStr;
                      const isHov = hoveredInvId === idStr;
                      return (
                        <button
                          key={idStr}
                          type="button"
                          aria-label={`${idStr} ${sName}`}
                          onMouseEnter={() => setHoveredInvId(idStr)}
                          onClick={() => {
                            const nextId = expandedSyncInvId === idStr ? null : idStr;
                            setExpandedSyncInvId(nextId);
                            setHoveredInvId(idStr);
                            if (nextId) {
                              scrollToSyncComparison();
                            }
                          }}
                          title={
                            isExpanded
                              ? `Click to collapse full ${sName} breakdown`
                              : `Hover to preview • Click to expand full ${sName} breakdown downward`
                          }
                          className={`color-glide px-2.5 py-1 rounded-full font-mono text-[10.5px] inline-flex items-center gap-1 ${
                            isExpanded || isHov
                              ? 'font-bold'
                              : 'bg-[#121418] text-neutral-400 hover:text-white border border-white/[0.08]'
                          }`}
                          style={
                            isExpanded
                              ? {
                                  backgroundColor: accent.softBg,
                                  color: accent.primary,
                                  border: `1px solid ${accent.border}`,
                                  boxShadow: `0 0 16px ${accent.glow}`
                                }
                              : isHov
                              ? {
                                  backgroundColor: accent.secondarySoftBg,
                                  color: accent.secondary,
                                  border: `1px solid ${accent.secondaryBorder}`
                                }
                              : undefined
                          }
                        >
                          <span>{idStr}</span>
                          <span className="hidden md:inline">{sName}</span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform duration-300 ${
                              isExpanded
                                ? 'rotate-180 opacity-100'
                                : isHov
                                ? 'opacity-80'
                                : 'opacity-40'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {expandedSyncInvId ? (
                    (() => {
                      const expandedIdx = Math.max(0, Number(expandedSyncInvId) - 1);
                      const expandedTitle =
                        DEFAULT_TITLES[expandedIdx] || `Invariant ${expandedSyncInvId}`;
                      const ExpandedIcon = INVARIANT_ICONS[expandedSyncInvId] || ShieldCheck;
                      const copyKey = `sync-full-${expandedSyncInvId}`;

                      return (
                        <div
                          key={`sync-expanded-${expandedSyncInvId}`}
                          className="animate-sync-expand-down rounded-3xl bg-[#121418]/[0.96] border border-[#49EACB]/30 p-4 sm:p-5 space-y-4 shadow-[0_22px_55px_rgba(0,0,0,0.72)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-[#49EACB]/12 border border-[#49EACB]/35 flex items-center justify-center shrink-0">
                                <ExpandedIcon className="w-4 h-4 text-[#49EACB]" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                                  SYNCED FULL BREAKDOWN // {count} PINNED ASSETS •{' '}
                                  {isGeniusMode ? 'GENIUS FORENSIC' : 'NORMIE'}
                                </div>
                                <h3 className="font-display text-base sm:text-lg font-bold text-white truncate">
                                  {expandedSyncInvId} // {expandedTitle}
                                </h3>
                              </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-nowrap items-center justify-between sm:justify-end gap-1.5 sm:gap-2">
                              <div className="h-7 p-0.5 rounded-full bg-[#0B0C0E] border border-white/10 inline-flex items-center font-mono text-[10px] sm:text-[10.5px] leading-none shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setIsGeniusMode(false)}
                                  className={`h-full px-2.5 sm:px-3 rounded-full transition inline-flex items-center justify-center border border-transparent leading-none ${
                                    !isGeniusMode
                                      ? 'bg-[#1D212A] text-white font-semibold'
                                      : 'text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  NORMIE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsGeniusMode(true)}
                                  className={`h-full px-2.5 sm:px-3 rounded-full transition inline-flex items-center justify-center gap-1 border leading-none ${
                                    isGeniusMode
                                      ? 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/40 font-bold'
                                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                  <span>GENIUS</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyTextToClipboard(
                                      formatSyncInvariantComparison(expandedSyncInvId),
                                      copyKey
                                    )
                                  }
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#0B0C0E] hover:bg-[#181C24] border border-white/10 font-mono text-[10px] sm:text-[11px] text-neutral-200 hover:text-white transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                                >
                                  {copiedTarget === copyKey ? (
                                    <>
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#49EACB] shrink-0" />
                                      <span className="text-[#49EACB]">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#49EACB] shrink-0" />
                                      <span>
                                        Copy #{expandedSyncInvId}
                                        <span className="hidden sm:inline"> Compare</span>
                                      </span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedSyncInvId(null);
                                    setHoveredInvId(null);
                                  }}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#0B0C0E] hover:bg-[#191E27] border border-white/10 font-mono text-[10px] sm:text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1 whitespace-nowrap"
                                >
                                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 rotate-180 text-[#49EACB] shrink-0" />
                                  <span>Collapse</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`grid grid-cols-1 ${
                              pinOrientationMode === 'vertical'
                                ? ''
                                : count === 3
                                ? 'lg:grid-cols-3'
                                : 'md:grid-cols-2'
                            } gap-3.5`}
                          >
                            {stageTickers.map((tk) => {
                              const item = audits[tk];
                              const inv = item?.invariants?.find(
                                (i) => i.id === expandedSyncInvId
                              );
                              if (!item || !inv) return null;

                              const itemAcc = getGradeAccent(item.grade);
                              const sStyle = getScoreStyle(inv.score);
                              const fullParagraph = getActiveInvariantParagraph(inv);
                              const savedLogsCount = (
                                invLogs[`${item.ticker}:${inv.id}`] || []
                              ).length;

                              return (
                                <div
                                  key={tk}
                                  className="color-glide rounded-2xl bg-[#0B0C0E] p-4 sm:p-5 flex flex-col justify-between gap-3.5"
                                  style={{ border: `1px solid ${sStyle.border}` }}
                                >
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-sm font-bold text-white">
                                            ${item.ticker}
                                          </span>
                                          <span
                                            className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold"
                                            style={{
                                              color: itemAcc.primary,
                                              backgroundColor: itemAcc.softBg,
                                              border: `1px solid ${itemAcc.border}`
                                            }}
                                          >
                                            Grade {item.grade} ({formatScore(item.totalScore)}/6.0)
                                          </span>
                                        </div>
                                        <div className="font-mono text-[11px] text-neutral-400 truncate mt-0.5">
                                          {item.name}
                                        </div>
                                        <div className="mt-1.5 flex justify-start">
                                          <ProvenanceBadgesStrip
                                            audit={item}
                                            isSandbox={sandboxTickerSet.has(item.ticker)}
                                            compact
                                          />
                                        </div>
                                      </div>

                                      <span
                                        className="px-2.5 py-1 rounded-full font-mono text-xs font-bold shrink-0"
                                        style={{
                                          color: sStyle.color,
                                          backgroundColor: sStyle.bg,
                                          border: `1px solid ${sStyle.border}`
                                        }}
                                      >
                                        {formatScore(inv.score)} / 1.0 • {sStyle.status}
                                      </span>
                                    </div>

                                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                          width: `${Math.max(
                                            2,
                                            Math.round((Number(inv.score) || 0) * 100)
                                          )}%`,
                                          backgroundColor: sStyle.color,
                                          boxShadow:
                                            Number(inv.score) > 0
                                              ? `0 0 10px ${sStyle.color}`
                                              : 'none'
                                        }}
                                      />
                                    </div>

                                    <div className="font-mono text-[11px] text-neutral-400 bg-[#121418] border border-white/[0.06] rounded-xl px-3 py-1.5">
                                      {inv.telemetry}
                                    </div>

                                    <div
                                      className="pl-3 py-0.5 text-xs text-neutral-300 leading-relaxed"
                                      style={{ borderLeft: `2px solid ${sStyle.color}` }}
                                    >
                                      {inv.quickSummary}
                                    </div>

                                    <p className="text-xs sm:text-[13.5px] text-neutral-200 leading-[1.76]">
                                      {fullParagraph}
                                    </p>

                                    {inv.receipts?.length > 0 && (
                                      <div className="space-y-1.5 pt-1">
                                        <div className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-500">
                                          Verified Codebase &amp; Mainnet Receipts
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {inv.receipts.map((rcpt, rIdx) => (
                                            <span
                                              key={rIdx}
                                              className="px-2.5 py-0.5 rounded-full bg-[#121418] font-mono text-[10.5px]"
                                              style={{
                                                color: sStyle.color,
                                                border: `1px solid ${sStyle.border}`
                                              }}
                                            >
                                              {rcpt}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-[10px] text-neutral-500">
                                      {savedLogsCount > 0
                                        ? `${savedLogsCount} Contest / Breakdown Log${
                                            savedLogsCount > 1 ? 's' : ''
                                          }`
                                        : `Inv #${inv.id} • Archived`}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      {inv.id === '04' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveKey(tk);
                                            setEssayViewMode(false);
                                            setModalInvId('04');
                                            scrollToWartimeSim();
                                          }}
                                          className="px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10.5px] text-neutral-300 hover:text-white transition flex items-center gap-1"
                                        >
                                          <Scissors className="w-3 h-3 text-[#EF4444]" />
                                          <span>Wartime Sim</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveKey(tk);
                                          setEssayViewMode(false);
                                          setModalInvId(inv.id);
                                        }}
                                        className="px-2.5 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[10.5px] font-semibold transition flex items-center gap-1"
                                        style={{ color: sStyle.color }}
                                      >
                                        <Scale className="w-3 h-3" />
                                        <span>Contest / Deep Exam</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div
                      style={{ overflowAnchor: 'none' }}
                      className={`w-full ${
                        pinOrientationMode === 'vertical'
                          ? 'min-h-[300px]'
                          : count === 4
                          ? 'min-h-[344px] xl:min-h-[172px]'
                          : 'min-h-[172px]'
                      } flex flex-col justify-start`}
                    >
                      {hoveredInvId ? (
                        <div
                          className={`grid grid-cols-1 ${
                            pinOrientationMode === 'vertical'
                              ? ''
                              : count === 2
                              ? 'sm:grid-cols-2'
                              : count === 3
                              ? 'sm:grid-cols-3'
                              : 'sm:grid-cols-2 xl:grid-cols-4'
                          } gap-2.5`}
                        >
                          {stageTickers.map((tk) => {
                            const item = audits[tk];
                            const inv = item?.invariants?.find((i) => i.id === hoveredInvId);
                            if (!item || !inv) return null;
                            const sStyle = getScoreStyle(inv.score);
                            return (
                              <button
                                key={tk}
                                type="button"
                                onClick={() => {
                                  setActiveKey(tk);
                                  setEssayViewMode(false);
                                  setModalInvId(inv.id);
                                }}
                                className="color-glide text-left rounded-2xl bg-[#121418]/95 p-3.5 cursor-pointer hover:brightness-110 space-y-1.5"
                                style={{ border: `1px solid ${sStyle.border}` }}
                              >
                                <div className="flex items-center justify-between gap-2 font-mono text-xs">
                                  <span className="font-bold text-white">
                                    ${item.ticker} // {inv.shortName}
                                  </span>
                                  <span
                                    className="color-glide px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                                    style={{
                                      color: sStyle.color,
                                      backgroundColor: sStyle.bg,
                                      border: `1px solid ${sStyle.border}`
                                    }}
                                  >
                                    {formatScore(inv.score)}/1.0
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                                  {inv.quickSummary}
                                </p>
                                <div className="font-mono text-[10px] text-neutral-500 truncate">
                                  {inv.telemetry}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="w-full py-5 px-4 rounded-2xl border border-dashed border-white/[0.06] bg-[#121418]/35 flex items-center justify-center text-center">
                          <span className="font-mono text-[11px] text-neutral-500">
                            Hover any invariant bubble or pill above to compare summaries • Click to expand full breakdown
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          (() => {
            const nonLgScale = !isLgDesktop
              ? viewportMetrics.width < 640
                ? Math.min(0.76, Math.max(0.62, (viewportMetrics.width - 28) / stageSize))
                : viewportMetrics.width < 768
                ? 0.88
                : 0.82
              : displayMetrics.arenaScale;
            const wrapperPx = isLgDesktop
              ? displayMetrics.stageSizePx
              : Math.round(stageSize * nonLgScale);

            return (
              <div
                ref={singleStageWrapRef}
                className="animate-stage-enter w-full flex flex-col items-center justify-start min-w-0"
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: `${wrapperPx}px`,
                    height: `${wrapperPx}px`
                  }}
                >
                  <div
                    ref={arenaRef}
                    data-tutorial-id="center-arena"
                    onMouseEnter={() => setIsArenaHovered(true)}
                    onMouseLeave={() => {
                      setIsArenaHovered(false);
                      setHoveredInvId(null);
                    }}
                    className="relative flex items-center justify-center select-none"
                    style={{
                      width: `${stageSize}px`,
                      height: `${stageSize}px`,
                      transformOrigin: 'center center',
                      transform: nonLgScale !== 1 ? `scale(${nonLgScale})` : undefined
                    }}
                  >
              <svg
                width={stageSize}
                height={stageSize}
                viewBox={`0 0 ${stageSize} ${stageSize}`}
                className="absolute inset-0 pointer-events-none"
              >
                <circle
                  cx={centerCoord}
                  cy={centerCoord}
                  r={isSplitOpen ? orbitRadius : 76}
                  fill="none"
                  stroke={accent.secondary}
                  strokeOpacity={isSplitOpen ? 0.16 : 0.07}
                  strokeDasharray="3 6"
                  style={{ transition: 'all 460ms cubic-bezier(0.20, 1.22, 0.32, 1)' }}
                />

                {currentAudit.invariants.map((inv, idx) => {
                  const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                  const targetX = centerCoord + (isSplitOpen ? Math.cos(rad) * orbitRadius : 0);
                  const targetY = centerCoord + (isSplitOpen ? Math.sin(rad) * orbitRadius : 0);
                  const invStyle = getHarmonizedScoreStyle(inv.score, accent);
                  const isHighlighted = hoveredInvId === inv.id;

                  return (
                    <line
                      key={inv.id}
                      x1={centerCoord}
                      y1={centerCoord}
                      x2={targetX}
                      y2={targetY}
                      stroke={isHighlighted ? invStyle.color : accent.primary}
                      strokeWidth={isHighlighted ? 2.2 : 1.15}
                      strokeOpacity={isSplitOpen ? (isHighlighted ? 0.92 : 0.28) : 0}
                      style={{
                        transition:
                          'x2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), y2 460ms cubic-bezier(0.20, 1.22, 0.32, 1), stroke 460ms ease, stroke-opacity 240ms ease'
                      }}
                    />
                  );
                })}
              </svg>

              {/* 6 Radial Invariant Satellite Bubbles */}
              {currentAudit.invariants.map((inv, idx) => {
                const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                const dx = isSplitOpen ? Math.cos(rad) * orbitRadius : 0;
                const dy = isSplitOpen ? Math.sin(rad) * orbitRadius : 0;
                const invStyle = getHarmonizedScoreStyle(inv.score, accent);
                const isHovered = hoveredInvId === inv.id;
                const hasEnergy = Number(inv.score) > 0;

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onMouseEnter={() => setHoveredInvId(inv.id)}
                    onFocus={() => setHoveredInvId(inv.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEssayViewMode(false);
                      setModalInvId(inv.id);
                    }}
                    aria-label={`${inv.id} ${inv.title}`}
                    className="spring-orbit absolute w-[92px] h-[92px] rounded-full bg-transparent overflow-visible flex flex-col items-center justify-center text-center px-1.5 cursor-pointer focus:outline-none"
                    style={{
                      left: `${centerCoord - 46}px`,
                      top: `${centerCoord - 46}px`,
                      transform: `translate(${dx}px, ${dy}px) scale(${
                        isSplitOpen ? (isHovered ? 1.12 : 1) : 0.35
                      })`,
                      opacity: isSplitOpen ? 1 : 0,
                      pointerEvents: isSplitOpen ? 'auto' : 'none',
                      zIndex: isHovered ? 30 : 20
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-[8px] rounded-full transition-shadow duration-300"
                      style={{
                        boxShadow: isHovered
                          ? `0 12px 26px rgba(0,0,0,0.85), 0 0 18px ${invStyle.color}66`
                          : `0 8px 20px rgba(0,0,0,0.72), 0 0 10px ${invStyle.bg}`
                      }}
                    />

                    <svg
                      viewBox="0 0 140 140"
                      shapeRendering="geometricPrecision"
                      className="absolute inset-[-24px] w-[calc(100%+48px)] h-[calc(100%+48px)] pointer-events-none overflow-visible"
                    >
                      <defs>
                        <radialGradient id={`satWaveGrad-${inv.id}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#121418" />
                          <stop offset="70%" stopColor="#121418" />
                          <stop
                            offset="100%"
                            stopColor={invStyle.color}
                            stopOpacity={isHovered ? '0.28' : hasEnergy ? '0.18' : '0.08'}
                          />
                        </radialGradient>
                      </defs>

                      <path
                        ref={(el) => {
                          satEchoWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_ECHO_D}
                        fill="none"
                        stroke={invStyle.color}
                        strokeWidth="1.05"
                        strokeOpacity={isSplitOpen && hasEnergy ? (isHovered ? 0.55 : 0.34) : 0}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        ref={(el) => {
                          satMainWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_MAIN_D}
                        fill={`url(#satWaveGrad-${inv.id})`}
                        stroke={invStyle.color}
                        strokeOpacity={isHovered ? 1 : hasEnergy ? 0.92 : 0.48}
                        strokeWidth={isHovered ? '2.2' : '1.65'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        ref={(el) => {
                          satInnerWaveRefs.current[idx] = el;
                        }}
                        d={DEFAULT_SAT_INNER_D}
                        fill="none"
                        stroke={invStyle.color}
                        strokeWidth="0.85"
                        strokeDasharray="3 3"
                        strokeOpacity={isSplitOpen && hasEnergy ? 0.25 : 0.09}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <div
                      key={`sat-${currentAudit.ticker}-${inv.id}`}
                      className="animate-select-fade relative z-10 flex flex-col items-center justify-center"
                    >
                      <span className="font-mono text-[10px] tracking-widest text-neutral-400">
                        {inv.id}
                      </span>
                      <span className="text-[11px] font-medium text-neutral-100 leading-tight line-clamp-1 mt-0.5">
                        {inv.shortName}
                      </span>
                      <span
                        className="color-glide font-mono text-[11px] font-bold mt-1 px-1.5 py-0.2 rounded-full"
                        style={{
                          color: invStyle.color,
                          backgroundColor: invStyle.bg
                        }}
                      >
                        {formatScore(inv.score)}/1.0
                      </span>
                    </div>
                  </button>
                );
              })}

              {isScanningPulse && (
                <div
                  className="animate-scan-pulse absolute w-48 h-48 rounded-full pointer-events-none"
                  style={{
                    border: `2px solid ${accent.primary}`
                  }}
                />
              )}

              {isAuditing && (
                <svg
                  width={stageSize}
                  height={stageSize}
                  viewBox={`0 0 ${stageSize} ${stageSize}`}
                  className="absolute inset-0 pointer-events-none z-20"
                >
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={138}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={138}
                    fill="none"
                    stroke={accent.primary}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 138}
                    strokeDashoffset={2 * Math.PI * 138 * (1 - scanProgressPct / 100)}
                    transform={`rotate(-90 ${centerCoord} ${centerCoord})`}
                    style={{ transition: 'stroke-dashoffset 220ms ease, stroke 220ms ease' }}
                  />
                  <circle
                    cx={centerCoord}
                    cy={centerCoord}
                    r={129}
                    fill="none"
                    stroke={accent.primary}
                    strokeWidth="1.2"
                    strokeOpacity="0.25"
                    strokeDasharray="8 22"
                    className="spin-ccw"
                  />

                  {CORE_SCAN_STAGES.map((stg, idx) => {
                    const rad = (ORBIT_ANGLES_DEG[idx] * Math.PI) / 180;
                    const nx = centerCoord + Math.cos(rad) * 138;
                    const ny = centerCoord + Math.sin(rad) * 138;
                    const isDone = resolvedStepColors[idx] !== undefined;
                    const isCurrent = idx === scanStepIdx;
                    const nodeColor =
                      resolvedStepColors[idx] || (isCurrent ? accent.primary : '#374151');

                    return (
                      <g key={stg.id}>
                        <circle
                          cx={nx}
                          cy={ny}
                          r={isCurrent ? 11 : 8}
                          fill="#0B0C0E"
                          stroke={nodeColor}
                          strokeWidth={isCurrent ? 2.4 : 1.5}
                          style={{ transition: 'all 240ms ease' }}
                        />
                        <text
                          x={nx}
                          y={ny + 3}
                          textAnchor="middle"
                          fill={isCurrent || isDone ? nodeColor : '#6B7280'}
                          fontSize="7.5"
                          fontFamily="JetBrains Mono, monospace"
                          fontWeight="700"
                        >
                          {stg.id}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              <AuditChaosWaveRings
                active={isAuditing}
                progressPct={scanProgressPct}
                projectedGrade={runningAuditState?.projectedGrade || 'A+'}
                projectedTotal={runningAuditState?.projectedTotal ?? null}
              />

              {/* Central Grade Nucleus Sphere */}
              <button
                type="button"
                onClick={() => {
                  if (!isAuditing && hasActiveAudit && activeKey) togglePinTicker(activeKey);
                }}
                aria-label="Toggle Pin 6-Invariant Orbital Breakdown"
                className={`spring-orbit relative z-[25] rounded-full flex flex-col items-center justify-center text-center cursor-pointer focus:outline-none ${
                  isAuditing ? 'bg-[#121418] overflow-hidden' : 'bg-transparent overflow-visible'
                }`}
                style={{
                  width: isAuditing ? '236px' : isSplitOpen ? '150px' : '212px',
                  height: isAuditing ? '236px' : isSplitOpen ? '150px' : '212px',
                  border: isAuditing ? `2px solid ${accent.primary}` : 'none',
                  boxShadow: isAuditing
                    ? `0 18px 50px rgba(0,0,0,0.82), 0 0 48px ${accent.glow}, inset 0 0 32px ${accent.softBg}`
                    : 'none',
                  transition:
                    'width 420ms cubic-bezier(0.20, 1.22, 0.32, 1), height 420ms cubic-bezier(0.20, 1.22, 0.32, 1), border-color 260ms ease, box-shadow 260ms ease'
                }}
              >
                {!isAuditing && (
                  <>
                    <span
                      className="pointer-events-none absolute inset-[6px] rounded-full transition-shadow duration-500"
                      style={{
                        boxShadow: `0 18px 36px rgba(0,0,0,0.82), 0 0 26px ${accent.glow}`
                      }}
                    />
                    <svg
                      viewBox="0 0 280 280"
                      shapeRendering="geometricPrecision"
                      className="absolute inset-[-34px] w-[calc(100%+68px)] h-[calc(100%+68px)] pointer-events-none overflow-visible"
                    >
                      <defs>
                        <radialGradient id="nucleusWaveGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#121418" />
                          <stop offset="72%" stopColor="#121418" />
                          <stop offset="88%" stopColor={accent.primary} stopOpacity="0.14" />
                          <stop offset="100%" stopColor={accent.secondary} stopOpacity="0.24" />
                        </radialGradient>
                        <linearGradient id="nucleusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={accent.primary} />
                          <stop offset="100%" stopColor={accent.secondary} />
                        </linearGradient>
                      </defs>

                      <path
                        ref={echoWavePathRef}
                        d={DEFAULT_NUCLEUS_ECHO_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="1.2"
                        strokeOpacity={
                          !isSplitOpen && Number(currentAudit.totalScore) > 0 ? 0.38 : 0
                        }
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        ref={mainWavePathRef}
                        d={DEFAULT_NUCLEUS_MAIN_D}
                        fill="url(#nucleusWaveGrad)"
                        stroke="url(#nucleusRingGrad)"
                        strokeWidth="2.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        ref={innerWavePathRef}
                        d={DEFAULT_NUCLEUS_INNER_D}
                        fill="none"
                        stroke={accent.secondary}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        strokeOpacity={
                          !isSplitOpen && Number(currentAudit.totalScore) > 0 ? 0.24 : 0.11
                        }
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}

                {isAuditing ? (
                  <div className="w-full h-full px-5 py-4 flex flex-col items-center justify-between relative">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                      <span
                        className="w-2 h-2 rounded-full animate-ping"
                        style={{ backgroundColor: accent.primary }}
                      />
                      <span>AUDIT // ${scanTargetTicker}</span>
                    </div>

                    <div className="my-0.5">
                      <div
                        className="font-mono text-xs font-bold tracking-wider uppercase transition-colors duration-200"
                        style={{ color: accent.primary }}
                      >
                        INV {activeScanStage.id} // {activeScanStage.shortName}
                      </div>
                      <div className="font-mono text-[9.5px] text-neutral-400 truncate max-w-[185px]">
                        {activeScanStage.title}
                      </div>
                    </div>

                    <div
                      className="w-full rounded-xl bg-[#07080A]/90 px-2.5 py-2 text-left font-mono text-[9.5px] leading-[1.45] space-y-0.5 shadow-inner"
                      style={{ border: `1px solid ${accent.primary}44` }}
                    >
                      {[0, 1, 2, 3].map((lineOffset) => {
                        const lineIdx =
                          (scanCodeTick + lineOffset) % activeScanStage.codeLines.length;
                        const codeLine = activeScanStage.codeLines[lineIdx];
                        const isActiveLine = lineOffset === 3;
                        return (
                          <div
                            key={lineOffset}
                            className="truncate transition-colors duration-150"
                            style={{
                              color: isActiveLine ? accent.primary : '#9CA3AF',
                              fontWeight: isActiveLine ? 700 : 400
                            }}
                          >
                            <span className="opacity-50 mr-1">&gt;</span>
                            {codeLine}
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-full px-3 space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${scanProgressPct}%`,
                            backgroundColor: accent.primary,
                            boxShadow: `0 0 8px ${accent.primary}`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-center gap-1.5">
                        {CORE_SCAN_STAGES.map((stg, idx) => {
                          const dotColor =
                            resolvedStepColors[idx] ||
                            (idx === scanStepIdx ? accent.primary : 'rgba(255,255,255,0.14)');
                          return (
                            <span
                              key={stg.id}
                              className="h-1.5 rounded-full transition-all duration-200"
                              style={{
                                width: idx === scanStepIdx ? '14px' : '6px',
                                backgroundColor: dotColor,
                                boxShadow: idx === scanStepIdx ? `0 0 8px ${dotColor}` : 'none'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={`nucleus-${currentAudit.ticker}`}
                    className="animate-select-fade relative z-10 flex flex-col items-center justify-center px-4"
                  >
                    <div className="flex items-center justify-center font-mono text-xs uppercase tracking-[0.18em] text-neutral-300">
                      <span className="mr-[-0.18em]">${currentAudit.ticker}</span>
                      {isPinned && (
                        <Pin
                          className="w-3 h-3 ml-1.5 color-glide"
                          style={{ color: accent.secondary }}
                        />
                      )}
                    </div>

                    <div
                      className={`color-glide font-display font-bold leading-none tracking-tight my-1.5 px-1 ${
                        isSplitOpen ? 'text-5xl' : 'text-7xl'
                      }`}
                      style={{
                        backgroundImage: accent.gradientCss,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: accent.primary
                      }}
                    >
                      {currentAudit.grade}
                    </div>

                    <div className="font-mono text-xs text-neutral-300 font-semibold">
                      {formatScore(currentAudit.totalScore)}{' '}
                      <span className="text-neutral-500">/ 6.0</span>
                    </div>

                    {!isSplitOpen && (
                      <div className="mt-2.5 px-3 py-0.5 rounded-full bg-white/[0.035] border border-white/[0.08] font-mono text-[10px] text-neutral-400 max-w-[148px] truncate transition-opacity duration-300">
                        {currentAudit.name}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
            </div>

            {/* DOCKED PROGRESS TOAST (DURING AUDIT) & QUICK-SCAN HOVER CARD */}
            <div
              style={{ overflowAnchor: 'none' }}
              className={`w-full max-w-3xl flex flex-col items-center ${
                isAuditing
                  ? 'min-h-[184px] mt-3 sm:mt-5 justify-start'
                  : activeHoveredInvariant
                  ? 'min-h-[184px] mt-1 justify-start pt-1'
                  : isMobileViewport
                  ? 'min-h-0 mt-1 justify-start'
                  : 'min-h-[108px] mt-0.5 justify-start'
              }`}
            >
              {isAuditing ? (
                <div
                  data-testid="audit-progress-toast"
                  className="animate-card-fade w-full flex flex-col items-center space-y-2.5"
                >
                  {auditStatusMsg && (
                    <div
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#121418]/[0.96] text-xs font-mono space-y-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)]"
                      style={{ border: `1px solid ${accent.border}`, color: accent.primary }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span className="truncate">{auditStatusMsg}</span>
                        </div>
                        <span className="text-[11px] font-bold shrink-0">{scanProgressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${scanProgressPct}%`,
                            backgroundImage: accent.gradientCss,
                            boxShadow: `0 0 10px ${accent.primary}`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-center space-y-1 font-mono text-xs text-neutral-400">
                    <div>
                      Executing deterministic 6-invariant scan on{' '}
                      <span className="font-bold text-white">${scanTargetTicker}</span>...
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Stage {activeScanStage.id}/06 — {activeScanStage.title}
                    </div>
                    {runningAuditState &&
                      runningAuditState.auditedCount > 0 &&
                      runningAuditState.projectedTotal !== null && (
                        <div
                          className="text-[11px] font-semibold transition-colors duration-200"
                          style={{ color: accent.primary }}
                        >
                          Running Avg ({runningAuditState.auditedCount}/6):{' '}
                          {formatScore(runningAuditState.projectedTotal)} / 6.00 (
                          {runningAuditState.projectedGrade})
                        </div>
                      )}
                  </div>
                </div>
              ) : activeHoveredInvariant ? (
                (() => {
                  const sStyle = getHarmonizedScoreStyle(activeHoveredInvariant.score, accent);
                  const InvIcon = INVARIANT_ICONS[activeHoveredInvariant.id] || ShieldCheck;
                  return (
                    <button
                      key={`hover-card-${currentAudit.ticker}-${activeHoveredInvariant.id}`}
                      type="button"
                      onClick={() => {
                        setEssayViewMode(false);
                        setModalInvId(activeHoveredInvariant.id);
                      }}
                      className="animate-card-fade color-glide text-left w-full rounded-2xl bg-[#121418]/[0.96] p-4 cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.65)] hover:brightness-105"
                      style={{
                        border: `1px solid ${sStyle.border}`
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <InvIcon
                            className="w-4 h-4 shrink-0 color-glide"
                            style={{ color: sStyle.color }}
                          />
                          <span className="font-mono text-xs font-bold text-white">
                            {activeHoveredInvariant.id} // {activeHoveredInvariant.title}
                          </span>
                        </div>
                        <span
                          className="color-glide font-mono text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: sStyle.color,
                            backgroundColor: sStyle.bg,
                            border: `1px solid ${sStyle.border}`
                          }}
                        >
                          {formatScore(activeHoveredInvariant.score)} / 1.0 • {sStyle.status}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13.5px] text-neutral-300 leading-relaxed">
                        {activeHoveredInvariant.quickSummary}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-neutral-500 truncate pr-2">
                          {activeHoveredInvariant.telemetry}
                        </span>
                        <span
                          className="color-glide flex items-center gap-1 font-semibold shrink-0"
                          style={{ color: sStyle.color }}
                        >
                          <span>Click bubble for full paragraph &amp; wartime sim</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  );
                })()
              ) : (
                <div
                  key={`stage-prompt-${currentAudit.ticker}-${isPinned}`}
                  data-testid="stage-bottom-controls"
                  style={{
                    marginTop: `${
                      isMobileViewport ? 4 : displayMetrics.bottomControlsOffsetPx
                    }px`
                  }}
                  className="animate-card-fade text-center space-y-2 pt-0.5"
                >
                  <ProvenanceBadgesStrip
                    audit={currentAudit}
                    isSandbox={sandboxTickerSet.has(currentAudit.ticker)}
                  />
                  {currentAudit.lastFreshAuditAt && (
                    <div className="flex justify-center">
                      <span
                        className="color-glide px-3 py-0.5 rounded-full font-mono text-[10px] inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: accent.secondarySoftBg,
                          color: accent.secondary,
                          border: `1px solid ${accent.secondaryBorder}`
                        }}
                      >
                        <span>Fresh Intel • {currentAudit.lastFreshAuditAt}</span>
                        {currentAudit.scoreDelta !== null &&
                          currentAudit.scoreDelta !== undefined && (
                            <span className="opacity-85">
                              (
                              {currentAudit.scoreDelta === 0
                                ? 'Δ 0.0'
                                : currentAudit.scoreDelta > 0
                                ? `+${formatScore(currentAudit.scoreDelta)}`
                                : formatScore(currentAudit.scoreDelta)}
                              )
                            </span>
                          )}
                      </span>
                    </div>
                  )}

                  <p className="font-mono text-xs text-neutral-400 transition-opacity duration-300">
                    {isPinned
                      ? `Pinned $${currentAudit.ticker} (1/4) — click up to 3 more bubbles in Passed or Failed to compare in Side-by-Side, △, □, or ◇`
                      : isSplitOpen
                      ? 'Hover any invariant bubble for quick physics verdict • Click center sphere to pin & compare up to 4 bubbles'
                      : 'Hover center sphere (or tap to pin & compare up to 4 bubbles) to trigger 6-invariant radial fission'}
                  </p>

                  <div
                    data-testid="stage-bottom-buttons"
                    style={{ marginTop: `${displayMetrics.buttonRowGapPx}px` }}
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <button
                      type="button"
                      data-tutorial-id="pin-compare"
                      disabled={isAuditing}
                      onClick={() => activeKey && togglePinTicker(activeKey)}
                      className="color-glide px-3.5 py-1.5 rounded-full border font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-50"
                      style={
                        isPinned
                          ? {
                              backgroundColor: accent.softBg,
                              color: accent.primary,
                              borderColor: accent.border,
                              boxShadow: `0 0 14px ${accent.glow}`
                            }
                          : {
                              backgroundColor: '#121418',
                              color: '#E5E7EB',
                              borderColor: 'rgba(255,255,255,0.1)'
                            }
                      }
                    >
                      <Pin className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
                      <span>
                        {isPinned
                          ? `Pinned $${currentAudit.ticker} (Pick 2nd Bubble)`
                          : `Pin $${currentAudit.ticker} to Compare`}
                      </span>
                    </button>

                    {confirmFullReauditKey === currentAudit.ticker ? (
                      <div
                        className="animate-card-fade flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#121418] font-mono text-[10.5px]"
                        style={{
                          border: `1px solid ${accent.secondaryBorder}`,
                          color: accent.secondary
                        }}
                      >
                        <span>Archived copy active (0 credits). Spend credits on full refresh?</span>
                        <button
                          type="button"
                          onClick={() => handleFreshReaudit(activeKey, true)}
                          className="px-2.5 py-0.5 rounded-full font-bold hover:brightness-110 transition"
                          style={{
                            backgroundImage: accent.gradientCss,
                            color: accent.textOnAccent
                          }}
                        >
                          Confirm Refresh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmFullReauditKey(null);
                            setEssayViewMode(false);
                            setModalInvId('01');
                          }}
                          className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:brightness-110 transition"
                          style={{
                            color: accent.primary,
                            border: `1px solid ${accent.border}`
                          }}
                        >
                          Contest 1-Inv (~85% Less)
                        </button>
                        <button
                          type="button"
                          aria-label="Cancel full refresh prompt"
                          onClick={() => setConfirmFullReauditKey(null)}
                          className="text-neutral-400 hover:text-white px-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isAuditing || Boolean(singleInvBusy)}
                        onClick={() => handleFreshReaudit(activeKey, false)}
                        className="color-glide px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 color-glide ${isAuditing ? 'animate-spin' : ''}`}
                          style={{ color: accent.secondary }}
                        />
                        <span>Update Intel (${currentAudit.ticker})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEssayViewMode(false);
                        setModalInvId('04');
                        scrollToWartimeSim();
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white transition flex items-center gap-1.5"
                    >
                      <Scissors className="w-3.5 h-3.5 color-glide" style={{ color: accent.secondary }} />
                      <span>Contest / Wartime Sim</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            );
          })()
        )}

        {/* Mobile-Only (< 768px) Pass / Fail Lists */}
        {isMobileViewport && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 md:hidden">
            <aside
              data-tutorial-id="passed-sidebar"
              className="w-full rounded-3xl bg-[#121418]/90 border border-white/[0.06] p-4 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-2.5 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-[#49EACB] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#49EACB] shadow-[0_0_8px_#49EACB]" />
                  <span>Passed // E &gt; 0</span>
                </span>
                <span className="text-neutral-500">{passedTickers.length} Harmonic</span>
              </div>

              <button
                type="button"
                onClick={() => setIsGainsModalOpen(true)}
                title="Open Live Thermodynamic Gains & Cohort Divergence Chart"
                className="w-full py-1.5 mb-2.5 border-b border-white/[0.05] flex items-center justify-between gap-1 font-mono text-[10px] text-[#49EACB]/85 hover:text-[#49EACB] transition-colors text-left cursor-pointer group"
              >
                <span className="truncate group-hover:underline underline-offset-2 font-semibold tabular-nums">
                  {formatPctSigned(basketGainsSummary.passCycleAvg)}
                </span>
                <span className="shrink-0 opacity-75 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>

              <div className="w-full space-y-2.5 py-1">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {corePassedTickers.map((tk, idx) => (
                    <HarmonicProjectBubble
                      key={tk}
                      item={audits[tk]}
                      isSelected={activeKey === tk}
                      isPinnedItem={
                        isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                      }
                      onSelectTicker={stableSelectTicker}
                      onTogglePin={stableTogglePin}
                      seedIndex={idx}
                    />
                  ))}
                </div>
                {ecosystemPassedTickers.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="font-mono text-[9.5px] uppercase tracking-widest text-indigo-300/80 text-center">
                      Ecosystem / Overlays ({ecosystemPassedTickers.length})
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {ecosystemPassedTickers.map((tk, idx) => (
                        <HarmonicProjectBubble
                          key={tk}
                          item={audits[tk]}
                          isSelected={activeKey === tk}
                          isPinnedItem={
                            isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                          }
                          onSelectTicker={stableSelectTicker}
                          onTogglePin={stableTogglePin}
                          seedIndex={idx + 30}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <aside
              data-tutorial-id="failed-sidebar"
              className="w-full rounded-3xl bg-[#121418]/90 border border-white/[0.06] p-4 flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between pb-2.5 border-b border-white/[0.06] font-mono text-[10px] uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-[#EF4444] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444]" />
                  <span>Failed // E = 0</span>
                </span>
                <span className="text-neutral-500">{failedTickers.length} Flatlined</span>
              </div>

              <button
                type="button"
                onClick={() => setIsGainsModalOpen(true)}
                title="Open Live Thermodynamic Gains & Cohort Divergence Chart"
                className="w-full py-1.5 mb-2.5 border-b border-white/[0.05] flex items-center justify-between gap-1 font-mono text-[10px] text-[#EF4444]/85 hover:text-[#EF4444] transition-colors text-left cursor-pointer group"
              >
                <span className="truncate group-hover:underline underline-offset-2 font-semibold tabular-nums">
                  {formatPctSigned(basketGainsSummary.failCycleAvg)}
                </span>
                <span className="shrink-0 opacity-75 group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </button>

              <div className="w-full space-y-2.5 py-1">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {coreFailedTickers.map((tk, idx) => (
                    <HarmonicProjectBubble
                      key={tk}
                      item={audits[tk]}
                      isSelected={activeKey === tk}
                      isPinnedItem={
                        isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                      }
                      onSelectTicker={stableSelectTicker}
                      onTogglePin={stableTogglePin}
                      seedIndex={idx + 50}
                    />
                  ))}
                </div>
                {ecosystemFailedTickers.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-2">
                    <div className="font-mono text-[9.5px] uppercase tracking-widest text-indigo-300/80 text-center">
                      Ecosystem / Overlays ({ecosystemFailedTickers.length})
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {ecosystemFailedTickers.map((tk, idx) => (
                        <HarmonicProjectBubble
                          key={tk}
                          item={audits[tk]}
                          isSelected={activeKey === tk}
                          isPinnedItem={
                            isMultiStage ? stageTickers.includes(tk) : validPinnedKeys.includes(tk)
                          }
                          onSelectTicker={stableSelectTicker}
                          onTogglePin={stableTogglePin}
                          seedIndex={idx + 80}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* =====================================================================
          3. MINIMAL THERMODYNAMIC FOOTER (TUTORIAL LEFT • LAWS CENTER • DONATE RIGHT)
         ===================================================================== */}
      <footer className="relative z-30 w-full px-3 sm:px-4 lg:px-4 xl:px-6 py-3.5 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-[150px_1fr_150px] items-center gap-x-3 gap-y-2.5 text-[11px] font-mono text-neutral-500">
        <div className="order-2 md:order-1 flex items-center justify-start">
          <button
            type="button"
            onClick={startTutorial}
            className="color-glide min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-300 hover:text-white flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
            title="Launch Interactive Step-by-Step Tutorial"
          >
            <Compass className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
            <span>Tutorial</span>
          </button>
        </div>

        <div className="col-span-2 md:col-span-1 order-1 md:order-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center px-2">
          <span>Landauer’s Principle: ΔQ ≥ kB·T·ln2 • E = 0 Forces Terminal Grade F</span>
          <span className="hidden lg:inline text-white/15" aria-hidden="true">
            •
          </span>
          <span>
            Carrier Subordination Law: M_overlay &lt; M_L1 ≤ 1.0 • {sortedTickers.length} Assets Audited
          </span>
        </div>

        <div className="order-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsDonateModalOpen(true)}
            className="color-glide min-h-[36px] px-3.5 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49EACB]"
            style={{
              borderColor: accent.border
            }}
            title="Support Open-Access Thermodynamic Audits"
          >
            <Heart className="w-3.5 h-3.5 color-glide" style={{ color: accent.primary }} />
            <span>Donate</span>
          </button>
        </div>
      </footer>

      {/* =====================================================================
          4. EXPANDED EXAMINATION, INTERROGATION & WARTIME SIMULATOR MODAL
         ===================================================================== */}
      {modalInvId && hasActiveAudit && (
        <div
          onClick={() => setModalInvId(null)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/84 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Invariant Examination & Wartime Simulator"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-4xl max-h-[92vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            <div className="relative shrink-0 px-3.5 sm:px-7 py-2.5 sm:py-3.5 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex flex-col gap-2 sm:gap-2.5">
              <button
                type="button"
                aria-label="Close Invariant Modal"
                onClick={() => setModalInvId(null)}
                className="absolute top-2.5 right-3 sm:top-3.5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition z-10"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="w-full flex flex-col items-center text-center gap-1.5 px-9 sm:px-11 min-w-0">
                <div className="w-full min-w-0">
                  <div className="font-display text-sm sm:text-lg font-bold text-white truncate">
                    {currentAudit.name}
                  </div>
                  <div className="font-mono text-[10px] sm:text-[11px] text-neutral-400 truncate">
                    {currentAudit.architecture}
                  </div>
                </div>

                <span
                  className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-mono text-[11px] sm:text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: accent.softBg,
                    color: accent.primary,
                    border: `1px solid ${accent.border}`
                  }}
                >
                  ${currentAudit.ticker} • {currentAudit.grade} (
                  {formatScore(currentAudit.totalScore)}/6.0)
                </span>

                <ProvenanceBadgesStrip
                  audit={currentAudit}
                  isSandbox={sandboxTickerSet.has(currentAudit.ticker)}
                  compact
                />
              </div>

              <div className="w-full flex flex-nowrap items-center justify-between gap-2">
                <div className="h-7 p-0.5 rounded-full bg-[#121418] border border-white/10 inline-flex items-center font-mono text-[10px] sm:text-[10.5px] leading-none shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsGeniusMode(false)}
                    className={`h-full px-2.5 sm:px-3 rounded-full transition inline-flex items-center justify-center border border-transparent leading-none ${
                      !isGeniusMode
                        ? 'bg-[#1D212A] text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    NORMIE
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeniusMode(true)}
                    className={`h-full px-2.5 sm:px-3 rounded-full transition inline-flex items-center justify-center gap-1 leading-none ${
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

                <button
                  type="button"
                  onClick={() => setEssayViewMode((prev) => !prev)}
                  className={`h-7 px-2.5 sm:px-3 rounded-full font-mono text-[10px] sm:text-[10.5px] leading-none transition inline-flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                    essayViewMode
                      ? 'font-bold shadow-sm'
                      : 'bg-[#0B0C0E] text-neutral-300 hover:text-white border border-white/10'
                  }`}
                  style={
                    essayViewMode
                      ? {
                          backgroundColor: accent.softBg,
                          color: accent.primary,
                          border: `1px solid ${accent.border}`
                        }
                      : { border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span>6-Paragraph Essay</span>
                </button>
              </div>
            </div>

            <div className="shrink-0 px-3 sm:px-7 py-1.5 sm:py-2.5 bg-[#0E1014] border-b border-white/[0.07] flex flex-nowrap md:flex-wrap items-center justify-between md:justify-start gap-1 overflow-x-auto md:overflow-visible no-scrollbar">
              {currentAudit.invariants.map((inv) => {
                const st = getHarmonizedScoreStyle(inv.score, accent);
                const isSelectedTab = !essayViewMode && activeModalInvariant.id === inv.id;
                return (
                  <button
                    key={inv.id}
                    type="button"
                    aria-label={`${inv.id} ${inv.shortName} ${formatScore(inv.score)}`}
                    onClick={() => {
                      setEssayViewMode(false);
                      setModalInvId(inv.id);
                    }}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-mono text-[10px] sm:text-[11px] transition flex items-center gap-0.5 sm:gap-1 shrink-0 ${
                      isSelectedTab
                        ? 'bg-[#191D25] text-white font-bold border border-white/20 shadow-sm'
                        : 'bg-[#0B0C0E] text-neutral-400 hover:text-neutral-200 border border-white/[0.06]'
                    }`}
                  >
                    <span style={{ color: st.color }}>{inv.id}</span>
                    <span className="hidden md:inline">{inv.shortName}</span>
                    <span className="text-[9.5px] sm:text-[10px] opacity-80" style={{ color: st.color }}>
                      {formatScore(inv.score)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div ref={modalBodyRef} className="flex-1 min-h-0 p-3.5 sm:p-7 overflow-y-auto space-y-5 sm:space-y-6">
              {!essayViewMode ? (
                (() => {
                  const sStyle = getHarmonizedScoreStyle(activeModalInvariant.score, accent);
                  const InvIcon = INVARIANT_ICONS[activeModalInvariant.id] || ShieldCheck;
                  const currentIdx = Math.max(
                    0,
                    currentAudit.invariants.findIndex((i) => i.id === activeModalInvariant.id)
                  );
                  const nextInv =
                    currentAudit.invariants[(currentIdx + 1) % currentAudit.invariants.length];

                  return (
                    <div
                      key={`modal-inv-${currentAudit.ticker}-${activeModalInvariant.id}-${isGeniusMode}`}
                      className="animate-card-fade space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-3.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              backgroundColor: sStyle.bg,
                              border: `1px solid ${sStyle.border}`
                            }}
                          >
                            <InvIcon className="w-4 h-4" style={{ color: sStyle.color }} />
                          </div>
                          <div className="min-w-0">
                            <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-snug">
                              {activeModalInvariant.id} // {activeModalInvariant.title}
                            </h2>
                            <div className="font-mono text-xs text-neutral-400 mt-0.5">
                              {activeModalInvariant.telemetry}
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-auto flex flex-nowrap sm:flex-wrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            disabled={isAuditing || Boolean(singleInvBusy)}
                            onClick={() => handleSingleInvariantReaudit(activeModalInvariant.id)}
                            title={`Pull fresh Google Search & GitHub intel ONLY for Invariant ${activeModalInvariant.id} (~85% fewer tokens than full 6-invariant re-audit)`}
                            className="px-2 sm:px-3 py-1 rounded-full bg-[#0B0C0E] hover:bg-[#171B22] border border-white/10 font-mono text-[10.5px] sm:text-xs font-bold leading-none text-neutral-200 hover:text-white transition inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 ${
                                singleInvBusy?.key ===
                                  `${currentAudit.ticker}:${activeModalInvariant.id}` &&
                                singleInvBusy?.mode === 'REAUDIT'
                                  ? 'animate-spin'
                                  : ''
                              }`}
                              style={{ color: accent.primary }}
                            />
                            <span>
                              {singleInvBusy?.key ===
                                `${currentAudit.ticker}:${activeModalInvariant.id}` &&
                              singleInvBusy?.mode === 'REAUDIT'
                                ? 'Pulling 1-Inv Intel...'
                                : `Fresh 1-Inv Pull (#${activeModalInvariant.id})`}
                            </span>
                          </button>

                          <span
                            className="px-2 sm:px-3 py-1 rounded-full font-mono text-[10.5px] sm:text-xs font-bold leading-none inline-flex items-center justify-center whitespace-nowrap"
                            style={{
                              backgroundColor: sStyle.bg,
                              color: sStyle.color,
                              border: `1px solid ${sStyle.border}`
                            }}
                          >
                            {formatScore(activeModalInvariant.score)} / 1.0 {sStyle.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                        {activeModalInvariant.lastSingleAuditAt && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06] font-mono text-[10px]">
                            <span style={{ color: sStyle.color }}>
                              {activeModalInvariant.lastSingleAuditSource ||
                                'Single-Invariant Update'}{' '}
                              • {activeModalInvariant.lastSingleAuditAt}
                            </span>
                            {activeModalInvariant.singleScoreDelta !== undefined && (
                              <span className="text-neutral-400">
                                {activeModalInvariant.singleScoreDelta === 0
                                  ? 'Score Confirmed (Δ 0.0)'
                                  : `Score Delta: ${
                                      activeModalInvariant.singleScoreDelta > 0
                                        ? `+${formatScore(activeModalInvariant.singleScoreDelta)}`
                                        : formatScore(activeModalInvariant.singleScoreDelta)
                                    }`}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm sm:text-[15.5px] text-neutral-200 leading-[1.78]">
                          {getActiveInvariantParagraph(activeModalInvariant)}
                        </p>
                      </div>

                      {activeModalInvariant.receipts?.length > 0 && (
                        <div className="space-y-2">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                            Verified Codebase &amp; Mainnet Receipts
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeModalInvariant.receipts.map((rcpt, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full bg-[#0B0C0E] font-mono text-xs"
                                style={{
                                  color: sStyle.color,
                                  border: `1px solid ${sStyle.border}`
                                }}
                              >
                                {rcpt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(() => {
                        const invKey = `${currentAudit.ticker}:${activeModalInvariant.id}`;
                        const draftVal = invPromptInputs[invKey] || '';
                        const logsForInv = invLogs[invKey] || [];
                        const isThisBusy = singleInvBusy?.key === invKey;

                        return (
                          <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 sm:p-5 space-y-3.5">
                            <div>
                              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                                INVARIANT {activeModalInvariant.id} INTERROGATION // 1-INVARIANT
                                TOKEN SCOPE
                              </div>
                              <h3 className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
                                Challenge This Score or Ask for a Deeper Breakdown
                              </h3>
                            </div>

                            <div className="rounded-xl bg-[#121418] border border-white/10 focus-within:border-white/25 transition p-3 space-y-2.5">
                              <label htmlFor={`inv-input-${invKey}`} className="sr-only">
                                Challenge evidence or breakdown question
                              </label>
                              <textarea
                                id={`inv-input-${invKey}`}
                                rows={2}
                                value={draftVal}
                                disabled={Boolean(singleInvBusy)}
                                onChange={(e) => {
                                  if (singleInvNotice) setSingleInvNotice(null);
                                  setInvPromptInputs((prev) => ({
                                    ...prev,
                                    [invKey]: e.target.value
                                  }));
                                }}
                                placeholder={`Paste new evidence, GitHub PRs/commits, or counter-arguments to challenge $${currentAudit.ticker}'s ${activeModalInvariant.shortName} score — or ask a question for a deeper breakdown...`}
                                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-sans resize-y leading-relaxed"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                                <span className="font-mono text-[10px] text-neutral-500">
                                  Mode:{' '}
                                  <strong style={{ color: accent.primary }}>
                                    {isGeniusMode ? 'GENIUS' : 'NORMIE'}
                                  </strong>{' '}
                                  • Evaluates only Inv #{activeModalInvariant.id} (~85% fewer tokens)
                                </span>

                                <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isAuditing || Boolean(singleInvBusy)}
                                    onClick={() =>
                                      handleInvariantBreakdown(activeModalInvariant.id)
                                    }
                                    className="px-3 sm:px-3.5 py-1.5 rounded-full bg-[#181C24] hover:bg-[#202631] border border-white/15 font-mono text-[11px] sm:text-xs text-neutral-100 transition flex items-center justify-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                                  >
                                    {isThisBusy && singleInvBusy?.mode === 'BREAKDOWN' ? (
                                      <>
                                        <RefreshCw
                                          className="w-3.5 h-3.5 animate-spin"
                                          style={{ color: accent.secondary }}
                                        />
                                        <span>Breaking Down...</span>
                                      </>
                                    ) : (
                                      <>
                                        <ZoomIn
                                          className="w-3.5 h-3.5"
                                          style={{ color: accent.secondary }}
                                        />
                                        <span>Breakdown</span>
                                        <Send className="w-3 h-3 opacity-70" />
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isAuditing || Boolean(singleInvBusy)}
                                    onClick={() =>
                                      handleInvariantChallenge(activeModalInvariant.id)
                                    }
                                    className="px-3 sm:px-3.5 py-1.5 rounded-full font-mono text-[11px] sm:text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap hover:brightness-110 disabled:opacity-50"
                                    style={{
                                      backgroundImage: accent.gradientCss,
                                      color: accent.textOnAccent
                                    }}
                                  >
                                    {isThisBusy && singleInvBusy?.mode === 'CHALLENGE' ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Fact-Checking...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Scale className="w-3.5 h-3.5" />
                                        <span>Challenge</span>
                                        <Send className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {singleInvNotice && (
                              <div
                                className="px-3.5 py-2 rounded-xl bg-[#121418] font-mono text-xs flex items-center justify-between gap-2"
                                style={{
                                  border: `1px solid ${accent.secondaryBorder}`,
                                  color: accent.secondary
                                }}
                              >
                                <span>{singleInvNotice.text}</span>
                                <button
                                  type="button"
                                  aria-label="Dismiss notice"
                                  onClick={() => setSingleInvNotice(null)}
                                  className="text-neutral-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {logsForInv.length > 0 && (
                              <div className="space-y-3 pt-1">
                                {logsForInv.map((entry) => {
                                  const badgeColor =
                                    entry.kind === 'CHALLENGE' &&
                                    entry.verdictState === 'REJECTED'
                                      ? accent.primary
                                      : accent.secondary;

                                  return (
                                    <div
                                      key={entry.id}
                                      className="rounded-xl bg-[#121418] border border-white/[0.08] p-4 space-y-2.5"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span
                                            className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                                            style={{
                                              color: badgeColor,
                                              backgroundColor: `${badgeColor}18`,
                                              border: `1px solid ${badgeColor}50`
                                            }}
                                          >
                                            {entry.verdictTag}
                                          </span>
                                          <span className="font-mono text-xs font-bold text-white">
                                            {entry.headline}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-500">
                                          <span>{entry.timestamp}</span>
                                          {isResponseTextTruncated(entry.body) && (
                                            <button
                                              type="button"
                                              disabled={isAuditing || Boolean(singleInvBusy)}
                                              onClick={() => {
                                                if (
                                                  entry.kind === 'CHALLENGE' &&
                                                  entry.userPrompt
                                                ) {
                                                  handleInvariantChallenge(
                                                    activeModalInvariant.id,
                                                    entry.userPrompt
                                                  );
                                                } else if (entry.kind === 'BREAKDOWN') {
                                                  handleInvariantBreakdown(
                                                    activeModalInvariant.id,
                                                    entry.userPrompt || ''
                                                  );
                                                } else {
                                                  handleSingleInvariantReaudit(
                                                    activeModalInvariant.id
                                                  );
                                                }
                                              }}
                                              className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:brightness-110 flex items-center gap-1 transition disabled:opacity-50"
                                              style={{
                                                color: accent.secondary,
                                                border: `1px solid ${accent.secondaryBorder}`
                                              }}
                                              title="Re-run and replace this cut-off response"
                                            >
                                              <RefreshCw className="w-2.5 h-2.5" />
                                              <span>Repair Cut-Off</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              copyTextToClipboard(
                                                `${entry.headline}\n\n${entry.body}`,
                                                entry.id
                                              )
                                            }
                                            className="px-2 py-0.5 rounded-full bg-[#0B0C0E] hover:bg-neutral-800 border border-white/10 text-neutral-300 flex items-center gap-1 transition"
                                          >
                                            {copiedTarget === entry.id ? (
                                              <>
                                                <Check
                                                  className="w-3 h-3"
                                                  style={{ color: accent.primary }}
                                                />
                                                <span style={{ color: accent.primary }}>Copied</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-3 h-3" />
                                                <span>Copy</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>

                                      {entry.userPrompt && (
                                        <div className="px-3 py-2 rounded-lg bg-[#0B0C0E] border-l-2 border-white/20 font-mono text-[11px] text-neutral-400">
                                          &ldquo;{entry.userPrompt}&rdquo;
                                        </div>
                                      )}

                                      <div className="text-xs sm:text-sm text-neutral-200 leading-[1.75] whitespace-pre-line">
                                        {entry.body}
                                      </div>

                                      {entry.sources?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {entry.sources.map((src, sIdx) => (
                                            <a
                                              key={sIdx}
                                              href={src.uri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="px-2.5 py-0.5 rounded-full bg-[#0B0C0E] hover:bg-[#191D24] border border-white/10 font-mono text-[10px] text-neutral-300 hover:text-white inline-flex items-center gap-1 max-w-[240px]"
                                            >
                                              <span className="truncate">{src.title}</span>
                                              <ExternalLink
                                                className="w-2.5 h-2.5 shrink-0"
                                                style={{ color: badgeColor }}
                                              />
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="pt-1 grid grid-cols-2 sm:flex sm:items-center sm:justify-between gap-2">
                        <button
                          type="button"
                          onClick={scrollToWartimeSim}
                          className="px-2.5 sm:px-0 py-1.5 sm:py-0 rounded-full sm:rounded-none bg-[#121418] sm:bg-transparent border border-white/[0.08] sm:border-0 font-mono text-[10.5px] sm:text-xs text-neutral-300 sm:text-neutral-400 hover:text-white flex items-center justify-center sm:justify-start gap-1.5 transition min-w-0"
                        >
                          <Scissors className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: accent.secondary }} />
                          <span className="truncate sm:hidden">Wartime Sim ↓</span>
                          <span className="hidden sm:inline">Test ${currentAudit.ticker} in Wartime Partition Sim ↓</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalInvId(nextInv.id)}
                          className="px-2.5 sm:px-0 py-1.5 sm:py-0 rounded-full sm:rounded-none bg-[#121418] sm:bg-transparent border border-white/[0.08] sm:border-0 font-mono text-[10.5px] sm:text-xs text-neutral-300 sm:text-neutral-400 hover:text-white flex items-center justify-center sm:justify-end gap-1.5 transition min-w-0"
                        >
                          <span className="truncate">
                            Next: {nextInv.id} // {nextInv.shortName}
                          </span>
                          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div
                  key={`modal-essay-${currentAudit.ticker}-${isGeniusMode}`}
                  className="animate-card-fade space-y-5"
                >
                  <div className="border-b border-white/[0.07] pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-neutral-400">
                        THE TRUTH — {isGeniusMode ? 'GENIUS FORENSIC AUDIT' : 'NORMIE AUDIT'} //{' '}
                        {currentAudit.architecture}
                      </div>
                      <h2 className="font-display text-xl font-bold text-white mt-1">
                        {currentAudit.name} (${currentAudit.ticker}) — Terminal Grade{' '}
                        <span style={{ color: accent.primary }}>{currentAudit.grade}</span> (
                        {formatScore(currentAudit.totalScore)} / 6.0)
                      </h2>
                    </div>
                  </div>

                  {isGeniusMode ? (
                    <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] space-y-5">
                      {currentGeniusParagraphs.map((para, idx) => (
                        <p
                          key={idx}
                          className="text-sm sm:text-[15px] text-neutral-200 leading-[1.82] text-justify"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>
                      {currentAudit.invariants.map((inv) => {
                        const st = getHarmonizedScoreStyle(inv.score, accent);
                        return (
                          <div key={inv.id} className="space-y-1.5">
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span className="text-neutral-300 font-semibold">
                                {inv.id} // {inv.title}
                              </span>
                              <span style={{ color: st.color }} className="font-bold">
                                {formatScore(inv.score)} / 1.0 {st.status}
                              </span>
                            </div>
                            <p className="text-sm sm:text-[15px] text-neutral-200 leading-[1.78]">
                              {inv.paragraph}
                            </p>
                          </div>
                        );
                      })}

                      <div
                        className="p-4 sm:p-5 rounded-2xl bg-[#0B0C0E]"
                        style={{ border: `1px solid ${accent.border}` }}
                      >
                        <div
                          className="font-mono text-xs font-bold uppercase tracking-wider mb-1.5"
                          style={{ color: accent.primary }}
                        >
                          GRADE Evidence Certainty Synthesis // {currentAudit.certainty}
                        </div>
                        <p className="text-sm sm:text-[15px] text-neutral-200 leading-[1.75]">
                          {currentAudit.conclusion}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {(() => {
                const prov = getAuditProvenance(currentAudit, {
                  preloadedTickers: new Set(Object.keys(PRELOADED_AUDITS)),
                  isSandbox: sandboxTickerSet.has(currentAudit.ticker)
                });
                const revision = getAuditRevisionAnalysis(currentAudit, prov.isDeterministicReference);
                return (
                  <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.07] overflow-hidden">
                    <button
                      type="button"
                      data-testid="score-conditions-toggle"
                      aria-expanded={showScoreConditions}
                      onClick={() => setShowScoreConditions((prev) => !prev)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-[#11141B] transition"
                    >
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <Scale className="w-3.5 h-3.5 shrink-0" style={{ color: accent.primary }} />
                        <span className="font-mono text-[11px] sm:text-xs font-bold text-white uppercase tracking-wider">
                          Score Conditions &amp; Rubric Brackets
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-semibold border ${
                            prov.isDeterministicReference
                              ? 'bg-[#49EACB]/10 text-[#49EACB] border-[#49EACB]/30'
                              : 'bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30'
                          }`}
                        >
                          {revision.provenanceMode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-neutral-400">
                        <span className="hidden sm:inline">
                          {showScoreConditions ? 'Hide Details' : 'What Changes This Score'}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            showScoreConditions ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {showScoreConditions && (
                      <div
                        data-testid="score-conditions-panel"
                        className="px-4 pb-4 pt-2 border-t border-white/[0.06] space-y-3.5 bg-[#08090B]"
                      >
                        <p className="text-[11.5px] text-neutral-400 leading-relaxed">
                          {revision.methodologySummary}
                        </p>

                        <div className="space-y-1.5">
                          <div className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-500">
                            Mainnet Score Revision &amp; Re-Audit Triggers
                          </div>
                          <div className="space-y-1.5">
                            {revision.triggers.map((trig, idx) => {
                              const badgeColor =
                                trig.direction === 'UPGRADE'
                                  ? '#4ADE80'
                                  : trig.direction === 'DOWNGRADE'
                                  ? '#F87171'
                                  : '#FACC15';
                              return (
                                <div
                                  key={`${trig.invariantId}-${idx}`}
                                  className="rounded-xl bg-[#0D0F13] border border-white/[0.06] px-3 py-2 flex items-start gap-2"
                                >
                                  <span
                                    className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                                    style={{
                                      color: badgeColor,
                                      backgroundColor: `${badgeColor}18`,
                                      border: `1px solid ${badgeColor}40`
                                    }}
                                  >
                                    #{trig.invariantId} {trig.direction}
                                  </span>
                                  <p className="text-[11.5px] text-neutral-300 leading-relaxed">
                                    {trig.condition}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="font-mono text-[9.5px] uppercase tracking-widest text-neutral-500">
                            Matched 6-Invariant Rubric Brackets
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {revision.brackets.map((b) => {
                              const bStyle = getHarmonizedScoreStyle(b.score, accent);
                              return (
                                <div
                                  key={b.id}
                                  className="rounded-xl bg-[#0D0F13] border border-white/[0.06] p-2.5 space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-1.5 font-mono text-[10px]">
                                    <span className="font-bold text-white truncate">
                                      {b.id} {b.shortName}
                                    </span>
                                    <span
                                      className="px-1.5 py-0.5 rounded-full font-bold shrink-0"
                                      style={{
                                        color: bStyle.color,
                                        backgroundColor: bStyle.bg,
                                        border: `1px solid ${bStyle.border}`
                                      }}
                                    >
                                      {formatScore(b.score)} [{b.bracketRange}]
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-neutral-400 leading-snug">
                                    {b.bracketSummary}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {currentAudit.freshSources && currentAudit.freshSources.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest">
                    <span style={{ color: accent.primary }}>
                      Live Google Search Grounding Sources ({currentAudit.lastFreshAuditAt})
                    </span>
                    <span className="text-neutral-500">
                      {currentAudit.freshSources.length} Verified Web Links
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentAudit.freshSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/10 font-mono text-[11px] text-neutral-200 hover:text-white transition inline-flex items-center gap-1.5 max-w-xs"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink
                          className="w-3 h-3 shrink-0"
                          style={{ color: accent.primary }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div ref={simAnchorRef}>
                <WartimeSpliceSimulator
                  activeAudit={currentAudit}
                  kasAudit={PRELOADED_AUDITS.KAS}
                  accent={accent}
                />
              </div>
            </div>

            <div className="shrink-0 px-3 sm:px-7 py-2 sm:py-3.5 bg-[#0B0C0E]/85 border-t border-white/[0.07] flex items-center justify-between gap-2 sm:gap-3">
              {!essayViewMode ? (
                <button
                  type="button"
                  onClick={() =>
                    copyTextToClipboard(
                      `THE TRUTH — thermodynamic audit // $${currentAudit.ticker} [${
                        currentAudit.grade
                      }]\n${activeModalInvariant.id} // ${activeModalInvariant.title} [${formatScore(
                        activeModalInvariant.score
                      )}/1.0]:\n\n${getActiveInvariantParagraph(activeModalInvariant)}`,
                      'modal-single'
                    )
                  }
                  className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-full bg-[#121418] hover:bg-[#181B22] border border-white/10 font-mono text-[10px] sm:text-xs text-neutral-200 transition flex items-center gap-1 sm:gap-1.5 whitespace-nowrap"
                >
                  {copiedTarget === 'modal-single' ? (
                    <>
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: accent.primary }} />
                      <span style={{ color: accent.primary }}>Copied Invariant!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-400 shrink-0" />
                      <span>Copy Single Invariant</span>
                    </>
                  )}
                </button>
              ) : (
                <span className="font-mono text-[10px] sm:text-xs text-neutral-500 truncate">
                  {formatXLongPost(currentAudit).length.toLocaleString()} chars • X Ready
                </span>
              )}

              <button
                type="button"
                onClick={() => copyTextToClipboard(formatXLongPost(currentAudit), 'modal-full')}
                className="px-2.5 sm:px-4 py-1 sm:py-2 rounded-full font-mono text-[10px] sm:text-xs font-semibold transition flex items-center gap-1 sm:gap-1.5 hover:brightness-110 whitespace-nowrap"
                style={{
                  backgroundColor: accent.primary,
                  color: accent.textOnAccent
                }}
              >
                {copiedTarget === 'modal-full' ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>{isGeniusMode ? 'Copy Genius Audit' : 'Copy Normie Audit'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. DETERMINISTIC 6-INVARIANT GRADING RUBRIC MODAL
         ===================================================================== */}
      {isRubricOpen && (
        <div
          onClick={() => setIsRubricOpen(false)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Deterministic 6-Invariant Thermodynamic Grading Rubric"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            <div className="px-5 sm:px-7 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                  CANONICAL SCORING LAW // ZERO SUBJECTIVE DRIFT
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Deterministic 6-Invariant Thermodynamic Grading Rubric
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close Rubric Modal"
                onClick={() => setIsRubricOpen(false)}
                className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  Deterministic Physics Curve (6.00 = Ideal Carnot/Light-Speed Limit • ≤1.00 or E = 0
                  Forces Grade F)
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {[
                    ['A+', '5.75–6.00', '#49EACB'],
                    ['A / A-', '4.90–5.74', '#49EACB'],
                    ['B+', '4.40–4.89', '#4ADE80'],
                    ['B / B-', '3.92–4.39', '#22C55E'],
                    ['C+', '3.50–3.91', '#FACC15'],
                    ['C / C-', '2.30–3.49', '#F59E0B'],
                    ['D+ / D / D-', '1.01–2.29', '#F97316'],
                    ['F', '0.00–1.00 (or E = 0)', '#EF4444']
                  ].map(([g, rng, col]) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full bg-[#121418]"
                      style={{ color: col, border: `1px solid ${col}50` }}
                    >
                      <strong>{g}</strong>: {rng}
                    </span>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[11.5px] leading-relaxed text-neutral-300">
                  <span className="font-mono font-bold text-[#F97316] mr-1.5">
                    [SOVEREIGNTY-COMPROMISE &amp; ENERGY-ARBITRAGE CAP — MAX GRADE D+]:
                  </span>
                  Any genesis premine, pre-allocated token supply, ICO/VC unlock, or mandatory
                  protocol developer tax (<span className="font-mono text-white">01 = 0.00</span>)
                  creates an energy arbitrage within the Cost Floor where zero-work insiders dilute
                  unit joule density and extract value from miners’ expended electricity—capping{' '}
                  <span className="font-mono text-white">02 Cost Floor ≤ 0.35</span> and capping
                  Terminal Grade at <span className="font-mono text-[#F97316] font-bold">D+</span>{' '}
                  (
                  <span className="font-mono text-neutral-400">
                    ≥2.30 = D+ • 1.75–2.29 = D • 1.01–1.74 = D-
                  </span>
                  ).
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {GRADING_RUBRIC_SPEC.map((spec) => (
                  <div
                    key={spec.id}
                    className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.07] space-y-2.5"
                  >
                    <div className="font-mono text-xs font-bold text-white">
                      <span className="text-[#49EACB]">{spec.id}</span> // {spec.name}
                    </div>
                    <div className="space-y-1.5">
                      {spec.brackets.map((b, i) => (
                        <div key={i} className="text-xs leading-relaxed text-neutral-300">
                          <span className="font-mono font-bold text-white mr-1.5">
                            [{b.range}]
                          </span>
                          <span>{b.rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. THERMODYNAMIC ARCHIVE VAULT & API CREDIT SHIELD MODAL
         ===================================================================== */}
      {isArchiveModalOpen && (
        <div
          onClick={() => setIsArchiveModalOpen(false)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thermodynamic Archive & API Credit Shield"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-3xl max-h-[90vh] rounded-3xl bg-[#121418] border border-white/15 flex flex-col overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            <div className="px-5 sm:px-7 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#49EACB]">
                  SHARED PERSISTENT VAULT // 0-CREDIT CACHE ARCHITECTURE
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Thermodynamic Archive &amp; API Credit Shield
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close Archive Modal"
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#121418] hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Total Archived Assets
                  </div>
                  <div className="font-display text-2xl font-bold text-white mt-1">
                    {sortedTickers.length}
                  </div>
                  <div className="font-mono text-[10px] text-[#49EACB] mt-0.5">
                    {CORE_REFERENCE_TICKERS.size} Core + {ECOSYSTEM_OVERLAY_TICKERS.size} Ecosystem +{' '}
                    {Math.max(
                      0,
                      sortedTickers.length -
                        CORE_REFERENCE_TICKERS.size -
                        ECOSYSTEM_OVERLAY_TICKERS.size
                    )}{' '}
                    Custom ({archivedCloudCount} Cloud)
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    0-Credit Archive Reads
                  </div>
                  <div className="font-display text-2xl font-bold text-[#49EACB] mt-1">
                    {zeroTokenHits}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                    Instant pulls with 0 Gemini tokens
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Daily New Full Pulls
                  </div>
                  <div
                    className="font-display text-2xl font-bold mt-1"
                    style={{
                      color:
                        dailyQuota.unlimited || isAdminSession || dailyQuota.remaining > 0
                          ? '#49EACB'
                          : '#FACC15'
                    }}
                  >
                    {dailyQuota.unlimited || isAdminSession
                      ? '∞ UNLIMITED'
                      : `${dailyQuota.remaining} / ${dailyQuota.limit}`}
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
                    {dailyQuota.unlimited || isAdminSession
                      ? `Admin Provision (${archiveUser?.email || PRIMARY_ADMIN_EMAIL})`
                      : 'Metals & all networks • Resets 00:00 UTC'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0B0C0E] border border-white/[0.07]">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Vault Sync Status
                  </div>
                  <div className="font-mono text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: archiveStatus === 'SYNCED' ? '#49EACB' : '#FACC15',
                        boxShadow: `0 0 8px ${
                          archiveStatus === 'SYNCED' ? '#49EACB' : '#FACC15'
                        }`
                      }}
                    />
                    <span>
                      {archiveStatus === 'SYNCED'
                        ? 'SHARED CLOUD SYNCED'
                        : archiveStatus === 'CONNECTING'
                        ? 'CONNECTING VAULT...'
                        : 'SESSION + JSON EXPORT'}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-neutral-400 mt-1">
                    Public reads 0 credits • Google Auth writes
                  </div>
                </div>
              </div>

              {/* Verified Google Cloud Archive Sync Control */}
              {firebaseAuth && (
                <div
                  className={`p-4 rounded-2xl bg-[#0B0C0E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border ${
                    isAdminSession ? 'border-[#49EACB]/35' : 'border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-bold text-white flex flex-wrap items-center gap-2">
                      <span>
                        {isAdminSession
                          ? `Verified Admin: ${archiveUser?.email || PRIMARY_ADMIN_EMAIL}`
                          : archiveUser
                          ? `Verified Writer: ${archiveUser.email || archiveUser.uid}`
                          : 'Public Cloud Vault (Read-Only Until Signed In)'}
                      </span>
                      {isAdminSession && (
                        <span className="px-2 py-0.5 rounded-full bg-[#49EACB]/15 text-[#49EACB] border border-[#49EACB]/45 text-[10px] font-bold">
                          ADMIN • UNLIMITED PULLS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {isAdminSession
                        ? 'Admin session active: daily 2-pull quota, IP rate limits, and server credit locks are bypassed. All new audits auto-publish to Firestore and Vault moderation controls are unlocked below.'
                        : archiveUser
                        ? 'New custom audits, contest verdicts, and imported snapshots automatically publish to the shared Firestore Archive.'
                        : 'Sign in with a verified Google account to publish new audits into the shared Firestore Vault (or unlock unlimited admin access for authorized accounts).'}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={handleGoogleArchiveAuth}
                    className={`px-4 py-2 rounded-full font-mono text-xs font-bold shrink-0 transition border disabled:opacity-50 ${
                      archiveUser
                        ? 'bg-[#121418] text-neutral-200 border-white/15 hover:bg-[#1A1E26]'
                        : 'bg-[#49EACB]/15 text-[#49EACB] border-[#49EACB]/45 hover:bg-[#49EACB]/25'
                    }`}
                  >
                    {authBusy
                      ? 'Authenticating...'
                      : archiveUser
                      ? 'Sign Out Cloud Sync'
                      : 'Sign In Google Sync'}
                  </button>
                </div>
              )}

              {/* Verified Admin Vault Moderation Controls */}
              {isAdminSession && (
                <div
                  data-testid="admin-controls-panel"
                  className="p-4 rounded-2xl bg-[#0B0C0E] border border-[#49EACB]/30 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs font-bold text-[#49EACB] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Vault &amp; Quota Controls</span>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-400 mt-0.5">
                        Verified Bearer session for {archiveUser?.email || PRIMARY_ADMIN_EMAIL}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={Boolean(adminActionBusy)}
                        onClick={handleAdminClearQuota}
                        className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-neutral-200 transition disabled:opacity-50"
                      >
                        {adminActionBusy === 'clear-quota' ? 'Clearing...' : 'Reset Daily Quotas'}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(adminActionBusy)}
                        onClick={handleAdminPurgeCache}
                        className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-[#49EACB] transition disabled:opacity-50"
                      >
                        {adminActionBusy === 'purge-cache' ? 'Re-syncing...' : 'Re-Sync Server Cache'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Strict Credit Lock Toggle */}
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-white flex items-center gap-2">
                    {strictCreditLock && !isAdminSession ? (
                      <Lock className="w-4 h-4 text-[#FACC15]" />
                    ) : (
                      <Unlock className="w-4 h-4 text-[#49EACB]" />
                    )}
                    <span>
                      {strictCreditLock && !isAdminSession
                        ? 'Strict Credit Lock: ON (0 API Credits Allowed)'
                        : isAdminSession
                        ? 'Archive-First Shield: ADMIN UNLIMITED BYPASS'
                        : 'Archive-First Shield: ACTIVE (Default)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Every searched token checks the Preloaded + Shared Cloud Archive first (0
                    credits). Live uncached full pulls are{' '}
                    <strong className="text-neutral-200">
                      {isAdminSession ? 'unlimited for your admin account' : `limited to ${dailyQuota.limit} per user/day`}
                    </strong>{' '}
                    across all physical metals, fiat currencies, Layer-1 networks, L2s, and overlays
                    (zero CMC rank cutoffs). Toggle <strong className="text-neutral-200">Strict Lock</strong> during
                    traffic spikes or enable <strong className="text-neutral-200">Sandbox Preview</strong>{' '}
                    to isolate test queries strictly in local browser storage.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStrictCreditLock((prev) => !prev)}
                  className={`px-4 py-2 rounded-full font-mono text-xs font-bold shrink-0 transition border ${
                    strictCreditLock && !isAdminSession
                      ? 'bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/50 hover:bg-[#FACC15]/25'
                      : 'bg-[#121418] text-neutral-200 border-white/15 hover:bg-[#1A1E26]'
                  }`}
                >
                  {strictCreditLock ? 'Unlock Live Audits' : 'Enable Strict 0-Credit Lock'}
                </button>
              </div>

              {/* Portable JSON Backup & Import */}
              <div className="p-4 rounded-2xl bg-[#0B0C0E] border border-white/[0.08] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-bold text-white">
                      Portable Archive Snapshot (Backup or Bake Into Static Code)
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400">
                      Export all archived audits + contest logs as JSON, or import a saved snapshot.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyTextToClipboard(
                          JSON.stringify({ audits, invLogs }, null, 2),
                          'archive-json'
                        )
                      }
                      className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-[#49EACB] flex items-center gap-1.5 transition"
                    >
                      {copiedTarget === 'archive-json' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied Snapshot!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Copy Archive JSON</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowImportBox((p) => !p)}
                      className="px-3 py-1.5 rounded-full bg-[#121418] hover:bg-[#191D24] border border-white/15 font-mono text-xs text-neutral-200 flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                </div>

                {showImportBox && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <label htmlFor="archive-import-json" className="sr-only">
                      Paste archive JSON snapshot
                    </label>
                    <textarea
                      id="archive-import-json"
                      rows={3}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder="Paste exported Archive JSON snapshot here to restore or sync into the vault..."
                      className="w-full rounded-xl bg-[#121418] border border-white/10 p-3 font-mono text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleImportArchiveSnapshot}
                        className="px-4 py-1.5 rounded-full bg-[#49EACB] text-[#041713] font-mono text-xs font-bold hover:brightness-110 transition"
                      >
                        Restore Snapshot Into Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Directory of All Archived Assets */}
              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  Core Sovereign &amp; Physical Commodity Benchmarks (0-Credit Instant Load)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                  {coreDirectoryTickers.map((tk) => {
                    const item = audits[tk];
                    if (!item) return null;
                    const itemAcc = getGradeAccent(item.grade);
                    const isSandboxItem = sandboxTickerSet.has(tk);
                    const isCustomOrUpdated =
                      Boolean(item.isCustom) ||
                      Boolean(item.archivedAtLabel) ||
                      Boolean(item.lastFreshAuditAt);
                    return (
                      <div
                        key={tk}
                        className="p-2.5 rounded-xl bg-[#0B0C0E] hover:bg-[#161922] border border-white/[0.07] transition flex items-start justify-between gap-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setIsArchiveModalOpen(false);
                            void performArchivePullAudit(tk);
                          }}
                          className="flex-1 min-w-0 text-left flex flex-col justify-between gap-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-white truncate">
                              ${item.ticker}
                            </span>
                            <span
                              className="font-mono text-xs font-bold shrink-0"
                              style={{ color: itemAcc.primary }}
                            >
                              {item.grade} ({formatScore(item.totalScore)})
                            </span>
                          </div>
                          <div className="font-mono text-[9.5px] text-neutral-500 truncate">
                            {isSandboxItem
                              ? 'Sandbox • Local Only'
                              : isCustomOrUpdated
                              ? `Live AI • ${item.archivedAtLabel || item.lastFreshAuditAt || 'Vault'}`
                              : 'Deterministic Reference'}
                          </div>
                        </button>
                        {isAdminSession && isCustomOrUpdated && !isSandboxItem && (
                          <button
                            type="button"
                            disabled={adminActionBusy === `delete:${tk}`}
                            onClick={() => void handleAdminDeleteAudit(tk)}
                            title={
                              PRELOADED_AUDITS[tk]
                                ? `Reset $${item.ticker} to baseline`
                                : `Delete $${item.ticker} from Vault`
                            }
                            aria-label={`Delete $${item.ticker} from archive`}
                            className="shrink-0 p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {ecosystemDirectoryTickers.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.07]">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-indigo-300">
                      Ecosystem / Overlays ({ecosystemDirectoryTickers.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {ecosystemDirectoryTickers.map((tk) => {
                        const item = audits[tk];
                        if (!item) return null;
                        const itemAcc = getGradeAccent(item.grade);
                        const isSandboxItem = sandboxTickerSet.has(tk);
                        const isCustomOrUpdated =
                          Boolean(item.isCustom) ||
                          Boolean(item.archivedAtLabel) ||
                          Boolean(item.lastFreshAuditAt);
                        return (
                          <div
                            key={tk}
                            className="p-2.5 rounded-xl bg-[#0B0C0E] hover:bg-[#161922] border border-indigo-400/20 transition flex items-start justify-between gap-1.5"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setIsArchiveModalOpen(false);
                                void performArchivePullAudit(tk);
                              }}
                              className="flex-1 min-w-0 text-left flex flex-col justify-between gap-1"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-bold text-white truncate">
                                  ${item.ticker}
                                </span>
                                <span
                                  className="font-mono text-xs font-bold shrink-0"
                                  style={{ color: itemAcc.primary }}
                                >
                                  {item.grade} ({formatScore(item.totalScore)})
                                </span>
                              </div>
                              <div className="font-mono text-[9.5px] text-indigo-300/80 truncate">
                                Ecosystem / Overlays
                              </div>
                            </button>
                            {isAdminSession && isCustomOrUpdated && !isSandboxItem && (
                              <button
                                type="button"
                                disabled={adminActionBusy === `delete:${tk}`}
                                onClick={() => void handleAdminDeleteAudit(tk)}
                                title={
                                  PRELOADED_AUDITS[tk]
                                    ? `Reset $${item.ticker} to baseline`
                                    : `Delete $${item.ticker} from Vault`
                                }
                                aria-label={`Delete $${item.ticker} from archive`}
                                className="shrink-0 p-1 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. LIVE THERMODYNAMIC GAINS & COHORT DIVERGENCE MODAL
         ===================================================================== */}
      {isGainsModalOpen && (
        <ThermodynamicGainsModal
          onClose={() => setIsGainsModalOpen(false)}
          auditsMap={audits}
          onSelectOrAuditTicker={(tk) => {
            setIsGainsModalOpen(false);
            if (audits[tk]) {
              selectCachedAudit(tk);
            } else if (!strictCreditLock && !isAuditing) {
              performLiveGroundedAudit(tk, null);
            } else {
              setSearchInput(tk);
            }
          }}
          onCopyReport={copyTextToClipboard}
          copiedTarget={copiedTarget}
        />
      )}

      {/* =====================================================================
          8. SUPPORT & DONATE MODAL
         ===================================================================== */}
      {isDonateModalOpen && (
        <div
          onClick={() => setIsDonateModalOpen(false)}
          className="animate-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Support Thermodynamic Audits"
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-sheet w-full max-w-lg rounded-3xl bg-[#121418] border border-white/15 overflow-hidden shadow-[0_28px_80px_rgba(0,0,0,0.88)]"
          >
            <div className="px-5 sm:px-6 py-4 bg-[#0B0C0E]/90 border-b border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Heart className="w-4 h-4 shrink-0" style={{ color: accent.primary }} />
                <h2 className="font-display text-base sm:text-lg font-bold text-white truncate">
                  Support Open Thermodynamic Audits
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close donate dialog"
                onClick={() => setIsDonateModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-sm text-neutral-300 max-h-[82vh] overflow-y-auto">
              <p className="text-[13.5px] leading-relaxed text-neutral-300">
                Preloaded and archived audits run at zero API credit cost, while live Gemini 4 +
                Google Search protocol verifications consume real compute and electrical energy.
              </p>

              {(donateConfig.kasAddress ||
                donateConfig.btcAddress ||
                donateConfig.ethAddress ||
                donateConfig.solAddress) ? (
                <div className="space-y-2.5">
                  {donateConfig.kasAddress && (
                    <div className="rounded-2xl bg-[#0B0C0E] border border-white/10 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold" style={{ color: accent.primary }}>
                          Kaspa ($KAS) Treasury
                        </span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(donateConfig.kasAddress!, 'donate-kas')}
                          className="px-2.5 py-1 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 text-neutral-200 inline-flex items-center gap-1"
                        >
                          {copiedTarget === 'donate-kas' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-neutral-400 break-all">
                        {donateConfig.kasAddress}
                      </div>
                    </div>
                  )}

                  {donateConfig.btcAddress && (
                    <div className="rounded-2xl bg-[#0B0C0E] border border-white/10 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold text-amber-300">Bitcoin ($BTC) Treasury</span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(donateConfig.btcAddress!, 'donate-btc')}
                          className="px-2.5 py-1 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 text-neutral-200 inline-flex items-center gap-1"
                        >
                          {copiedTarget === 'donate-btc' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-neutral-400 break-all">
                        {donateConfig.btcAddress}
                      </div>
                    </div>
                  )}

                  {donateConfig.ethAddress && (
                    <div className="rounded-2xl bg-[#0B0C0E] border border-white/10 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold text-indigo-300">Ethereum ($ETH) Address</span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(donateConfig.ethAddress!, 'donate-eth')}
                          className="px-2.5 py-1 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 text-neutral-200 inline-flex items-center gap-1"
                        >
                          {copiedTarget === 'donate-eth' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-neutral-400 break-all">
                        {donateConfig.ethAddress}
                      </div>
                    </div>
                  )}

                  {donateConfig.solAddress && (
                    <div className="rounded-2xl bg-[#0B0C0E] border border-white/10 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold text-violet-300">Solana ($SOL) Address</span>
                        <button
                          type="button"
                          onClick={() => copyTextToClipboard(donateConfig.solAddress!, 'donate-sol')}
                          className="px-2.5 py-1 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 text-neutral-200 inline-flex items-center gap-1"
                        >
                          {copiedTarget === 'donate-sol' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-neutral-400 break-all">
                        {donateConfig.solAddress}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 space-y-2 font-mono text-xs">
                  <div className="text-neutral-200 font-semibold">
                    No direct tip address configured yet
                  </div>
                  <p className="text-neutral-400 leading-relaxed font-sans text-[12.5px]">
                    Operators can enable direct crypto tips by setting{' '}
                    <code className="text-neutral-200">DONATE_KAS_ADDRESS</code>,{' '}
                    <code className="text-neutral-200">DONATE_BTC_ADDRESS</code>,{' '}
                    <code className="text-neutral-200">DONATE_ETH_ADDRESS</code>, or{' '}
                    <code className="text-neutral-200">DONATE_SOL_ADDRESS</code> in environment secrets.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      copyTextToClipboard(window.location.origin, 'donate-share-url');
                    }
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 font-mono text-xs text-neutral-200 inline-flex items-center gap-1.5 transition"
                >
                  {copiedTarget === 'donate-share-url' ? (
                    <>
                      <Check className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                      <span>Share App Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDonateModalOpen(false);
                    setIsArchiveModalOpen(true);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#171A21] hover:bg-[#1F242D] border border-white/10 font-mono text-xs text-neutral-200 inline-flex items-center gap-1.5 transition"
                >
                  <Database className="w-3.5 h-3.5" style={{ color: accent.secondary }} />
                  <span>Contribute via Archive Vault</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. GENESIS THESIS EASTER EGG MODAL (5-SECOND TRUTH DOT HOLD)
         ===================================================================== */}
      <GenesisThesisModal
        isOpen={isGenesisModalOpen}
        onClose={() => setIsGenesisModalOpen(false)}
        accent={accent}
        isGeniusMode={isGeniusMode}
        onSetGeniusMode={setIsGeniusMode}
        onCopyFullThesis={(fullText) => copyTextToClipboard(fullText, 'genesis-thesis')}
        copiedTarget={copiedTarget}
      />

      {/* =====================================================================
          10. INTERACTIVE INTRODUCTORY TUTORIAL OVERLAY
         ===================================================================== */}
      <TutorialOverlay
        isOpen={isTutorialOpen}
        stepIndex={tutorialStepIndex}
        steps={activeTutorialSteps}
        accent={accent}
        onChangeStep={handleTutorialStepChange}
        onExecuteAction={handleTutorialAction}
        onClose={closeTutorial}
      />
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  resetKey: number;
}

class AuditErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '', resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering exception.'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Thermodynamic Audit UI caught an error:', error, info);
  }

  private handleResetAndResume = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_AUDITS_STORAGE_KEY);
        window.localStorage.removeItem(SANDBOX_AUDITS_STORAGE_KEY);
        window.localStorage.removeItem(LOCAL_LOGS_STORAGE_KEY);
      }
    } catch {
      // Ignore storage access failures
    }
    this.setState((prev) => ({
      hasError: false,
      errorMessage: '',
      resetKey: prev.resetKey + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0C0E] text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-md w-full rounded-3xl bg-[#121418] border border-[#EF4444]/40 p-6 space-y-4 text-center shadow-2xl">
            <div className="text-xs uppercase tracking-widest text-[#EF4444] font-bold">
              Renderer Safeguard Triggered
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed break-words">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleResetAndResume}
              className="px-4 py-2 rounded-full bg-[#49EACB] text-[#041713] text-xs font-bold hover:brightness-110 transition"
            >
              Reset Stage &amp; Resume
            </button>
          </div>
        </div>
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

export default function App() {
  return (
    <AuditErrorBoundary>
      <ThermodynamicAuditApp />
    </AuditErrorBoundary>
  );
}

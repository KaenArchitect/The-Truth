import { useEffect, useRef, useState } from 'react';
import { Columns, GitMerge, Pause, Play, Scissors, Wifi } from 'lucide-react';
import type { AuditData, GradeAccent } from '../data/rubricSpec.ts';

export type PartitionPhase = 'PEACE' | 'WARTIME' | 'SPLICE';

export const PARTITION_PRESETS = [
  { label: '50 / 50 Symmetric', west: 50, tag: 'Even Split' },
  { label: '58 / 42 Sub-Quorum', west: 58, tag: 'All BFT Dead' },
  { label: '68 / 32 (>2f+1)', west: 68, tag: '66.7% Cliff' },
  { label: '76 / 24 (>AVAX)', west: 76, tag: '75% Snowman' },
  { label: '82 / 18 (>XRP)', west: 82, tag: '80% dUNL' }
];

export const DURATION_OPTIONS = [
  { mins: 15, label: '15m Cut' },
  { mins: 60, label: '60m Cut' },
  { mins: 240, label: '4h Cut' },
  { mins: 2880, label: '48h War' }
];

export function getBftQuorumThreshold(ticker: string): number {
  const tk = String(ticker || '').toUpperCase();
  if (tk === 'XRP' || tk === 'PI' || tk === 'XLM') return 80;
  if (tk === 'AVAX') return 75;
  if (tk === 'STX') return 70;
  if (tk === 'ADA') return 101;
  return 66.7;
}

export interface SimulatorTelemetry {
  statusLabel: string;
  statusColor: string;
  westAlive: boolean;
  eastAlive: boolean;
  metrics: Array<{ label: string; value: string; color: string }>;
  caption: string;
}

export function getSimulatorTelemetry(
  auditObj: AuditData,
  phase: PartitionPhase,
  westShare = 58,
  durationMins = 60
): SimulatorTelemetry {
  const fam = auditObj?.consensusFamily || 'ZERO_JOULE_BFT';
  const tk = String(auditObj?.ticker || '').toUpperCase();
  const eastShare = 100 - westShare;
  const minoritySide = westShare >= 50 ? 'East' : 'West';
  const minorityPct = Math.min(westShare, eastShare);
  const majoritySide = westShare >= 50 ? 'West' : 'East';
  const majorityPct = Math.max(westShare, eastShare);
  const durationLabel =
    durationMins >= 1440
      ? `${Math.round(durationMins / 60)}h`
      : durationMins >= 60
      ? `${durationMins / 60}h`
      : `${durationMins}m`;

  if (tk === 'GEEK') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'L1 KRC-20 + HQ REDIS SYNC',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'L1 KRC-20 Rail', value: '10.0 BPS Kaspa PoW', color: '#49EACB' },
          { label: 'HQ API + Redis', value: 'Server-Scored Alpha', color: '#FACC15' },
          { label: 'Token State', value: 'KRC-20 Indexer Read', color: '#F59E0B' }
        ],
        caption:
          'User-signed GEEK fair-mint & transfer inscriptions ride Kaspa’s 10-BPS BlockDAG, while Vercel HQ API + Upstash Redis score Proof-of-Learning runs off-chain.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'L1 LIVE • HQ FAIL-CLOSED',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: false,
        metrics: [
          { label: `L1 Wallet (${westShare}/${eastShare})`, value: '10 BPS P2P Mining', color: '#49EACB' },
          { label: 'Severed HQ Cloud', value: 'Fail-Closed (0 Runs)', color: '#EF4444' },
          { label: 'KRC-20 Indexer', value: 'Split Observation Lag', color: '#FACC15' }
        ],
        caption: `Across a ${durationLabel} cable cut, raw wallet-to-wallet GEEK inscriptions keep mining on both severed Kaspa L1 continents, while regions cut off from Vercel/Upstash Redis/Indexer fail closed.`
      };
    }
    return {
      statusLabel: 'BLUE-WORK INDEXER REPLAY',
      statusColor: '#4ADE80',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Kaspa L1 Carrier', value: '0% Orphans Merged', color: '#49EACB' },
        { label: 'KRC-20 Balances', value: 'Blue-Work Replayed', color: '#4ADE80' },
        { label: 'HQ Redis State', value: 'Replay-Lock Recovery', color: '#FACC15' }
      ],
      caption:
        'At resplice, Kaspa L1 merges both continental sub-DAGs with zero block loss; KRC-20 indexers replay deterministic Blue-Work inscription order and HQ reconciles saved Redis receipts.'
    };
  }

  if (tk === 'IGRA') {
    const westAttesterQuorum = westShare >= 66.7;
    const eastAttesterQuorum = eastShare >= 66.7;
    const attesterStalled = !westAttesterQuorum && !eastAttesterQuorum;
    if (phase === 'PEACE') {
      return {
        statusLabel: 'KASPA L1 BASED SEQUENCING',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'L1 Carrier (viaduct)', value: '10.0 BPS Kaspa PoW', color: '#49EACB' },
          { label: 'Execution (reth)', value: 'Deterministic EVM', color: '#FACC15' },
          { label: '$IGRA Token', value: '10B Premine + PoS', color: '#EF4444' }
        ],
        caption:
          'RLP payloads sequence directly inside Kaspa’s 10-BPS BlockDAG without a centralized L2 sequencer, while external Hyperlane bridge exits rely on 400k-$IGRA PoS Attesters.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'L1 ROLLUP LIVE • BRIDGES PAUSE',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `L1 Sequencing (${westShare}/${eastShare})`, value: '10 BPS Both Halves', color: '#49EACB' },
          {
            label: 'External Bridge Exits',
            value: attesterStalled ? '<66.7% Attesters Paused' : 'Minority Exits Paused',
            color: '#EF4444'
          },
          { label: `${durationLabel} Cut`, value: '0 Sequencer Halts', color: '#4ADE80' }
        ],
        caption: `Across a ${durationLabel} cable cut, isolated continents keep posting Igra EVM transactions directly to local Kaspa L1 miners, while external $IGRA PoS Attester Hyperlane bridge exits stall.`
      };
    }
    return {
      statusLabel: 'SELECTED-PARENT EVM REPLAY',
      statusColor: '#4ADE80',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Kaspa L1 Carrier', value: '0% Orphans Merged', color: '#49EACB' },
        { label: 'viaduct + reth', value: 'Selected-Parent Sync', color: '#4ADE80' },
        { label: 'Hyperlane Exits', value: 'Attester Quorum Resumed', color: '#FACC15' }
      ],
      caption:
        'At resplice, Kaspa L1 weaves both continental sub-DAGs without losing carrier blocks, viaduct + reth deterministically replay Selected Parent Chain ordering, and bridge exits resume.'
    };
  }

  if (tk === 'LN') {
    if (phase === 'PEACE') {
      return {
        statusLabel: '0-JOULE HTLC MESH OVER 600s L1',
        statusColor: '#F59E0B',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Off-Chain Hop', value: '0.0 J Promissory IOU', color: '#FACC15' },
          { label: 'L1 Exit Funnel', value: '600s / ~7 TPS Choke', color: '#FB923C' },
          { label: 'True Velocity', value: 'M_LN < M_BTC < 1.0', color: '#EF4444' }
        ],
        caption:
          'Sub-second HTLC/PTLC hops exchange 0-Joule revocable signatures (not PoW finality), while channel opens, splices, and exits remain bottlenecked by Bitcoin’s 600s (~7 TPS) sequential chain.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'HTLC EXPIRY -> L1 MASS FORCE-CLOSE',
        statusColor: '#EF4444',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Cross-Ocean HTLCs', value: 'CLTV Expiring -> Jammed', color: '#EF4444' },
          { label: 'L1 Exit Queue', value: '~7 TPS Flood-and-Loot', color: '#EF4444' },
          { label: 'Offline Receivers', value: '0% Reachable (Hot-Key)', color: '#FB923C' }
        ],
        caption: `Across a ${durationLabel} cable cut, severed cross-hemisphere HTLCs hang until CLTV timelocks expire, triggering emergency unilateral force-closes (CVE-2020-26895) that flood Bitcoin’s ~7 TPS blocks.`
      };
    }
    return {
      statusLabel: `${minoritySide.toUpperCase()} (${minorityPct}%) CHANNELS WIPED`,
      statusColor: '#EF4444',
      westAlive: westShare >= 50,
      eastAlive: eastShare > 50,
      metrics: [
        { label: 'L1 Carrier Reorg', value: '100% Minority Orphaned', color: '#EF4444' },
        { label: 'Force-Close / Justice', value: 'Sweeps Erased + Pinned', color: '#EF4444' },
        { label: 'CLTV / CSV Locks', value: 'Up to 14d (2,016 Blks)', color: '#FB923C' }
      ],
      caption: `At resplice, Bitcoin’s heaviest-chain reorg erases 100% of channel opens, splices, force-closes, and watchtower justice sweeps mined on the ${minorityPct}% ${minoritySide} chain while stranding capital in multi-day CSV locks.`
    };
  }

  if (fam === 'BLOCKDAG_POW') {
    if (phase === 'PEACE') {
      return {
        statusLabel: '10.0 BPS PARALLEL WEAVE',
        statusColor: '#49EACB',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West (${westShare}%)`, value: '10.0 BPS Synced', color: '#49EACB' },
          { label: `East (${eastShare}%)`, value: '10.0 BPS Synced', color: '#49EACB' },
          { label: 'Orphan Waste', value: '0.0% (M = 1.0)', color: '#49EACB' }
        ],
        caption:
          'Concurrent kHeavyHash blocks across both hemispheres weave simultaneously into one chronological GHOSTDAG spine with zero orphan energy waste.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'BOTH CONTINENTS 100% LIVE',
        statusColor: '#49EACB',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West (${westShare}%)`, value: 'DAA -> 10.0 BPS', color: '#49EACB' },
          { label: `East (${eastShare}%)`, value: 'DAA -> 10.0 BPS', color: '#49EACB' },
          { label: `${durationLabel} Blackout`, value: '0 Halts • 2 Sub-DAGs', color: '#49EACB' }
        ],
        caption: `Even under a ${westShare}% / ${eastShare}% split for ${durationLabel}, neither hemisphere halts—KIP-0004 per-block DAA smoothly ramps both isolated continents to 10.0 BPS.`
      };
    }
    return {
      statusLabel: 'ZERO-LOSS BLUE-WORK MERGE',
      statusColor: '#49EACB',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: `West (${westShare}%)`, value: '100% Merged', color: '#49EACB' },
        { label: `East (${eastShare}%)`, value: '100% Merged', color: '#49EACB' },
        { label: 'Work Destroyed', value: '0.0% (0 Orphans)', color: '#49EACB' }
      ],
      caption: `At resplice, GHOSTDAG / DAGKNIGHT weaves 100% of blocks from both the ${westShare}% West and ${eastShare}% East sub-DAGs into one unified graph without amputating the ${minorityPct}% side.`
    };
  }

  if (fam === 'LINEAR_POW') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'SINGLE-FILE LINEAR CHAIN',
        statusColor: '#4ADE80',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Topology', value: '1-Parent Line', color: '#4ADE80' },
          { label: 'Concurrent PoW', value: 'Orphaned (M < 1)', color: '#FACC15' },
          { label: 'Cost Floor', value: 'E > 0 Hardware', color: '#4ADE80' }
        ],
        caption:
          'Genuine Proof-of-Work cost floor, but sequential single-parent blocks force long block intervals and discard simultaneous discoveries as stale orphans.'
      };
    }
    if (phase === 'WARTIME') {
      const westRate = ((westShare / 100) * 100).toFixed(0);
      const eastRate = ((eastShare / 100) * 100).toFixed(0);
      const bchCheckpointSplit = tk === 'BCH' && durationMins >= 120;
      return {
        statusLabel: bchCheckpointSplit
          ? '>2h 10-BLOCK CHECKPOINT LOCK!'
          : '2 INCOMPATIBLE FORKS',
        statusColor: bchCheckpointSplit ? '#EF4444' : '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          {
            label: `West (${westShare}%)`,
            value: bchCheckpointSplit
              ? 'Finalized Tip A (Depth 10)'
              : `${westRate}% Pace (${westShare >= 50 ? 'Heavier' : 'Lighter'})`,
            color: bchCheckpointSplit ? '#EF4444' : westShare >= 50 ? '#4ADE80' : '#FACC15'
          },
          {
            label: `East (${eastShare}%)`,
            value: bchCheckpointSplit
              ? 'Finalized Tip B (Depth 10)'
              : `${eastRate}% Pace (${eastShare > 50 ? 'Heavier' : 'Lighter'})`,
            color: bchCheckpointSplit ? '#EF4444' : eastShare > 50 ? '#4ADE80' : '#FACC15'
          },
          {
            label: `${durationLabel} Split`,
            value: bchCheckpointSplit ? '-maxreorgdepth=10 Hit' : 'Diverging Histories',
            color: bchCheckpointSplit ? '#EF4444' : '#FB923C'
          }
        ],
        caption: bchCheckpointSplit
          ? `At ${durationLabel} (>=2h / -finalizationdelay=7200s), BOTH isolated BCH continents mine past BCHN’s -maxreorgdepth=10 rolling checkpoint and locally lock incompatible finalized blocks!`
          : tk === 'BTC' || tk === 'LTC'
          ? `Both continents keep mining without halting, but rigid 2,016-block difficulty retargeting throttles the ${minorityPct}% ${minoritySide} chain while rival histories diverge.`
          : `Both continents keep mining locally across the ${durationLabel} cable cut, but single-chain topology forces West (${westShare}%) and East (${eastShare}%) onto rival histories.`
      };
    }
    const isTie = westShare === 50;
    const xmrCoinbaseWiped = tk === 'XMR' && durationMins >= 120;
    const bchPermanentSplit = tk === 'BCH' && durationMins >= 120;
    if (bchPermanentSplit) {
      return {
        statusLabel: 'PERMANENT CHAIN SPLIT (-maxreorgdepth=10)',
        statusColor: '#EF4444',
        westAlive: false,
        eastAlive: false,
        metrics: [
          { label: `West (${westShare}%)`, value: 'Rejects East (-100 DoS)', color: '#EF4444' },
          { label: `East (${eastShare}%)`, value: 'Rejects West (-100 DoS)', color: '#EF4444' },
          { label: 'BCHN Finalization', value: 'Manual -reindex Needed', color: '#FB923C' }
        ],
        caption: `Because the ${durationLabel} cut exceeded BCHN’s 10-block / 7,200s rolling checkpoint, -finalizeheaders=1 forces West and East nodes to ban each other upon resplice—permanently splitting BCH!`
      };
    }
    return {
      statusLabel: isTie
        ? '50/50 RACE -> 1 SIDE WIPED'
        : `${minoritySide.toUpperCase()} (${minorityPct}%) CHAIN WIPED`,
      statusColor: '#EF4444',
      westAlive: westShare >= 50,
      eastAlive: eastShare > 50,
      metrics: [
        {
          label: `${majoritySide} (${majorityPct}%)`,
          value: isTie ? 'Tie-Break Winner' : 'Overwrites Global Tip',
          color: '#4ADE80'
        },
        {
          label: `${minoritySide} (${minorityPct}%)`,
          value: '100% Orphaned & Erased',
          color: '#EF4444'
        },
        {
          label: tk === 'XMR' ? 'RingCT Impact' : 'Energy & TX Loss',
          value:
            tk === 'XMR'
              ? xmrCoinbaseWiped
                ? 'Coinbase + Decoys Dead'
                : 'Decoy Rings Poisoned'
              : `${minorityPct}% Wartime Work Lost`,
          color: '#EF4444'
        }
      ],
      caption:
        tk === 'XMR'
          ? `Nakamoto reorg annihilates 100% of the ${minorityPct}% ${minoritySide} chain${
              xmrCoinbaseWiped ? ', erases >2h unlocked 0.6 XMR coinbase commerce,' : ''
            } and invalidates honest user RingCT transactions whose 16-member rings grabbed vanished ${minoritySide} decoys.`
          : `Nakamoto’s Heaviest-Chain Rule ruthlessly orphans and erases every block, Joule of electricity, and merchant payment mined on the ${minorityPct}% ${minoritySide} continent.`
    };
  }

  if (fam === 'PHYSICAL_COMMODITY') {
    if (phase === 'PEACE') {
      return {
        statusLabel: 'VAULTED ATOMS & PAPER IOUs',
        statusColor: '#22C55E',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: `West Vaults (${westShare}%)`, value: '100:1 Paper Claims', color: '#FACC15' },
          { label: `East Vaults (${eastShare}%)`, value: 'Armored Custody', color: '#FACC15' },
          { label: 'Digital Velocity', value: '0.0 BPS (Baryonic)', color: '#FB923C' }
        ],
        caption:
          'Unforgeable nuclear stability, but physical weight and assay friction lock bullion inside centralized vaults trading fractional paper claims.'
      };
    }
    if (phase === 'WARTIME') {
      return {
        statusLabel: 'COINS OK • OCEAN 0.0 TPS',
        statusColor: '#FACC15',
        westAlive: true,
        eastAlive: true,
        metrics: [
          { label: 'Hand-to-Hand Coin', value: '100% Offline Ready', color: '#22C55E' },
          { label: 'Cross-Ocean Rail', value: '0.0 TPS Blockaded', color: '#EF4444' },
          { label: 'Custodial Vaults', value: 'EO 6102 Freeze Risk', color: '#EF4444' }
        ],
        caption:
          'Bearer coins in your palm barter offline with zero electricity, but cross-ocean digital throughput is 0.0 TPS and sovereign vaults freeze redemptions.'
      };
    }
    return {
      statusLabel: '4-YEAR REPATRIATION FREIGHT',
      statusColor: '#FB923C',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Fiber Resplice', value: '0 Atoms Teleported', color: '#EF4444' },
        { label: 'Ocean Settlement', value: 'Ships / Cargo Jets', color: '#FB923C' },
        { label: 'Bar Verification', value: 'Ultrasonic / XRF Assay', color: '#FACC15' }
      ],
      caption:
        'Repairing undersea fiber-optic cables cannot teleport physical gold or silver—international settlement still crawls via armored freight and ultrasonic tungsten assays.'
    };
  }

  const req = getBftQuorumThreshold(tk);

  if (phase === 'PEACE') {
    return {
      statusLabel: '0-JOULE VALIDATOR QUORUM',
      statusColor: '#FB923C',
      westAlive: true,
      eastAlive: true,
      metrics: [
        { label: 'Energy Floor', value: '0.0 Joules (PoS)', color: '#EF4444' },
        {
          label: 'Halt Threshold',
          value: tk === 'ADA' ? '36h k=2160 Window' : `>=${req}% Stake Quorum`,
          color: '#FB923C'
        },
        { label: 'History Storage', value: 'Pruned / Cloud S3', color: '#EF4444' }
      ],
      caption:
        'Streams weightless digital validator signatures across cloud data centers at 0 Joules while pruning raw history onto centralized cloud buckets.'
    };
  }

  if (tk === 'ADA') {
    const permanentSplit = durationMins >= 2160;
    if (phase === 'WARTIME') {
      return {
        statusLabel: permanentSplit ? '>36h PERMANENT FORK SPLIT' : 'UNFINALIZED PRAOS DRIFT',
        statusColor: permanentSplit ? '#EF4444' : '#FB923C',
        westAlive: !permanentSplit,
        eastAlive: !permanentSplit,
        metrics: [
          {
            label: `West (${westShare}%)`,
            value: permanentSplit ? 'Irreconcilable Fork A' : '20s Unfinalized Drift',
            color: permanentSplit ? '#EF4444' : '#FACC15'
          },
          {
            label: `East (${eastShare}%)`,
            value: permanentSplit ? 'Irreconcilable Fork B' : '20s Unfinalized Drift',
            color: permanentSplit ? '#EF4444' : '#FACC15'
          },
          {
            label: `${durationLabel} vs 36h Limit`,
            value: permanentSplit ? 'Exceeded k=2160!' : 'Approaching k=2160',
            color: '#EF4444'
          }
        ],
        caption: permanentSplit
          ? `At ${durationLabel} (>36h / 2,160 blocks), Cardano breaches Ouroboros chain-density safety—permanently splitting West (${westShare}%) and East (${eastShare}%) into incompatible ledgers!`
          : `During a ${durationLabel} cut, 95% of Cardano slots sit idle (f=0.05) while both halves drift without finality toward the fatal 36-hour (k=2160) split horizon.`
      };
    }
    return {
      statusLabel: permanentSplit ? 'SOCIAL HARD-FORK REQUIRED' : 'MINORITY STAKE REORG',
      statusColor: '#EF4444',
      westAlive: !permanentSplit && westShare >= 50,
      eastAlive: !permanentSplit && eastShare > 50,
      metrics: [
        {
          label: 'Reconciliation',
          value: permanentSplit ? 'Impossible via Physics' : '0-Joule Chain Reorg',
          color: '#EF4444'
        },
        {
          label: `${minoritySide} (${minorityPct}%)`,
          value: permanentSplit ? 'Permanent Split' : '100% Blocks Wiped',
          color: '#EF4444'
        },
        { label: 'Energy Proof', value: '0.0 Joules (VRF)', color: '#EF4444' }
      ],
      caption: permanentSplit
        ? 'Past 36 hours (2,160 blocks) with 0 Joules of Proof-of-Work cumulative difficulty, nodes cannot mathematically unite the forks without a human social hard fork.'
        : `Upon resplicing before 36h, Cardano wipes out 100% of blocks produced on the ${minorityPct}% ${minoritySide} fork via zero-joule VRF slot density.`
    };
  }

  const westHasQuorum = westShare >= req;
  const eastHasQuorum = eastShare >= req;
  const bothDead = !westHasQuorum && !eastHasQuorum;
  const algoBlind = tk === 'ALGO' && durationMins >= 45;

  if (phase === 'WARTIME') {
    return {
      statusLabel: bothDead
        ? 'GLOBAL CARDIAC ARREST (0 TPS)'
        : `${westHasQuorum ? 'EAST' : 'WEST'} CONTINENT DEAD (0 TPS)`,
      statusColor: bothDead ? '#EF4444' : '#FB923C',
      westAlive: westHasQuorum,
      eastAlive: eastHasQuorum,
      metrics: [
        {
          label: `West (${westShare}%)`,
          value: westHasQuorum ? `>=${req}% -> LIVE` : `<${req}% -> HALTED`,
          color: westHasQuorum ? '#FACC15' : '#EF4444'
        },
        {
          label: `East (${eastShare}%)`,
          value: eastHasQuorum ? `>=${req}% -> LIVE` : `<${req}% -> HALTED`,
          color: eastHasQuorum ? '#FACC15' : '#EF4444'
        },
        {
          label: algoBlind ? '45m Pruning Limit' : 'Quorum Requirement',
          value: algoBlind ? 'Peer Sync Blinded!' : `Needs >=${req}% Stake`,
          color: '#EF4444'
        }
      ],
      caption: bothDead
        ? `Mathematical BFT deadlock: neither West (${westShare}%) nor East (${eastShare}%) reaches ${tk}’s >=${req}% supermajority quorum—freezing 100% of global finality at 0.0 TPS!`
        : `Skewed ${westShare}% / ${eastShare}% split: ${
            westHasQuorum ? `West (${westShare}%)` : `East (${eastShare}%)`
          } barely clears >=${req}% quorum, leaving ${
            westHasQuorum ? `East (${eastShare}%)` : `West (${westShare}%)`
          } completely paralyzed at 0.0 TPS${
            tk === 'ETH' ? ' and bleeding stake via quadratic Inactivity Leak!' : '!'
          }`
    };
  }

  return {
    statusLabel:
      bothDead || algoBlind ? 'DISCORD / ADMIN OVERRIDE' : `${minorityPct}% SIDE SNAPSHOT SYNC`,
    statusColor: '#EF4444',
    westAlive: westHasQuorum && !algoBlind,
    eastAlive: eastHasQuorum && !algoBlind,
    metrics: [
      {
        label: 'Partition Commerce',
        value: bothDead ? '0 TXs Settled Globally' : `${minoritySide} (${minorityPct}%) 0 TXs`,
        color: '#EF4444'
      },
      {
        label: 'Recovery Method',
        value: algoBlind
          ? 'Foundation Catchpoint'
          : bothDead
          ? 'Discord Slot Reboot'
          : 'Central Cloud Snapshot',
        color: '#FB923C'
      },
      { label: 'Thermodynamic Mass', value: '0.0 Joules (M = 0)', color: '#EF4444' }
    ],
    caption: algoBlind
      ? `Because the ${durationLabel} cut exceeded Algorand’s 1,000-round (~45m) non-archival memory buffer, isolated nodes cannot peer-sync and must trust centralized Foundation Catchpoints.`
      : bothDead
      ? `After flatlining both continents at 0.0 TPS across the ${westShare}/${eastShare} split, validators coordinate out-of-band on Discord to restart from a manual slot snapshot.`
      : `The frozen ${minorityPct}% ${minoritySide} continent settled 0 transactions during the entire ${durationLabel} blackout and must download centralized cloud state snapshots to catch up.`
  };
}

export interface TopologyMeshCanvasProps {
  auditObj: AuditData;
  phase: PartitionPhase;
  westShare: number;
  durationMins: number;
}

export function TopologyMeshCanvas({
  auditObj,
  phase,
  westShare,
  durationMins
}: TopologyMeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fam = auditObj?.consensusFamily || 'ZERO_JOULE_BFT';
  const tk = String(auditObj?.ticker || '').toUpperCase();
  const eastShare = 100 - westShare;
  const info = getSimulatorTelemetry(auditObj, phase, westShare, durationMins);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    let rafId: number | null = null;
    let width = 480;
    const height = 178;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(280, Math.floor(rect.width));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateSize();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize);
      ro.observe(container);
    } else {
      window.addEventListener('resize', updateSize);
    }

    const startMs = performance.now();
    let lastDrawMs = 0;

    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const renderFrame = (now: number) => {
      if (typeof document !== 'undefined' && document.hidden) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }
      if (lastDrawMs !== 0 && now - lastDrawMs < 32) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }
      lastDrawMs = now;

      const t = (now - startMs) / 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      const gutterX = 104;
      const rightPad = 14;
      const laneW = Math.max(160, width - gutterX - rightPad);
      const westY = 46;
      const midY = 89;
      const eastY = 132;

      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let gx = gutterX; gx < width - rightPad; gx += 36) {
        ctx.beginPath();
        ctx.moveTo(gx, 12);
        ctx.lineTo(gx, height - 12);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(gutterX, westY);
      ctx.lineTo(width - rightPad, westY);
      ctx.moveTo(gutterX, eastY);
      ctx.lineTo(width - rightPad, eastY);
      ctx.stroke();

      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle =
        phase === 'WARTIME' ? 'rgba(239,68,68,0.32)' : 'rgba(73,234,203,0.18)';
      ctx.beginPath();
      ctx.moveTo(gutterX, midY);
      ctx.lineTo(width - rightPad, midY);
      ctx.stroke();
      ctx.restore();

      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = info.westAlive ? '#E5E7EB' : '#EF4444';
      ctx.fillText(`WEST (${westShare}%)`, 10, westY - 3);
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Americas / EU', 10, westY + 9);

      ctx.font = '700 8px "JetBrains Mono", monospace';
      ctx.fillStyle =
        phase === 'WARTIME' ? '#EF4444' : phase === 'SPLICE' ? info.statusColor : '#49EACB';
      ctx.fillText(
        phase === 'WARTIME'
          ? '⚡ CABLE CUT'
          : phase === 'SPLICE'
          ? '⇄ RESPLICED'
          : '⇄ FIBER SYNC',
        10,
        midY + 3
      );

      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillStyle = info.eastAlive ? '#E5E7EB' : '#EF4444';
      ctx.fillText(`EAST (${eastShare}%)`, 10, eastY - 3);
      ctx.font = '400 8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6B7280';
      ctx.fillText('Asia / Oceania', 10, eastY + 9);

      if (fam === 'BLOCKDAG_POW') {
        const speed = 56;
        const stepX = 38;
        const offset = (t * speed) % stepX;
        const count = Math.ceil(laneW / stepX) + 2;

        if (phase === 'PEACE') {
          const nodes: Array<{ x: number; wy1: number; wy2: number; ey1: number; ey2: number }> =
            [];
          for (let i = 0; i < count; i++) {
            const x = gutterX + laneW - i * stepX + offset - 12;
            if (x < gutterX - 18 || x > width) continue;
            const wobW = Math.sin(i * 1.7) * 8;
            const wobE = Math.cos(i * 1.9) * 8;
            nodes.push({
              x,
              wy1: westY - 10 + wobW * 0.4,
              wy2: westY + 11 - wobW * 0.3,
              ey1: eastY - 11 + wobE * 0.3,
              ey2: eastY + 10 - wobE * 0.4
            });
          }

          for (let i = 0; i < nodes.length - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.38)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.wy1);
            ctx.lineTo(b.x, b.wy1);
            ctx.moveTo(a.x, a.wy2);
            ctx.lineTo(b.x, b.wy1);
            ctx.moveTo(a.x, a.wy1);
            ctx.lineTo(b.x, b.ey1);
            ctx.moveTo(a.x, a.ey1);
            ctx.lineTo(b.x, b.wy2);
            ctx.moveTo(a.x, a.ey1);
            ctx.lineTo(b.x, b.ey1);
            ctx.moveTo(a.x, a.ey2);
            ctx.lineTo(b.x, b.ey1);
            ctx.stroke();
          }

          for (let p = 0; p < 4; p++) {
            const px = gutterX + 24 + ((p * 0.25 + t * 0.45) % 1) * (laneW - 40);
            const dir = p % 2 === 0 ? 1 : -1;
            const prog = (t * 2.2 + p * 0.37) % 1;
            const py = dir > 0 ? westY + (eastY - westY) * prog : eastY - (eastY - westY) * prog;
            ctx.fillStyle = '#49EACB';
            ctx.beginPath();
            ctx.arc(px, py, 2.3, 0, Math.PI * 2);
            ctx.fill();
          }

          nodes.forEach((n) => {
            [n.wy1, n.wy2, n.ey1, n.ey2].forEach((ny) => {
              ctx.fillStyle = '#0B1917';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.5;
              drawRoundedRect(ctx, n.x - 5.5, ny - 5.5, 11, 11, 2.8);
              ctx.fill();
              ctx.stroke();
            });
          });
        } else if (phase === 'WARTIME') {
          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 8, midY);
          ctx.lineTo(width - rightPad, midY);
          ctx.stroke();
          ctx.restore();

          const sparkX = gutterX + laneW * 0.48;
          const pulseR = 5 + Math.abs(Math.sin(t * 7)) * 5;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.beginPath();
          ctx.arc(sparkX, midY, pulseR, 0, Math.PI * 2);
          ctx.fill();

          const drawSubDagLane = (centerY: number, phaseShift: number) => {
            const pts: Array<{ x: number; y1: number; y2: number }> = [];
            for (let i = 0; i < count; i++) {
              const x = gutterX + laneW - i * stepX + ((t * speed + phaseShift) % stepX) - 10;
              if (x < gutterX - 14 || x > width) continue;
              pts.push({ x, y1: centerY - 11, y2: centerY + 11 });
            }
            for (let i = 0; i < pts.length - 1; i++) {
              const a = pts[i];
              const b = pts[i + 1];
              ctx.strokeStyle = 'rgba(73, 234, 203, 0.48)';
              ctx.lineWidth = 1.3;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y1);
              ctx.lineTo(b.x, b.y1);
              ctx.moveTo(a.x, a.y2);
              ctx.lineTo(b.x, b.y2);
              ctx.moveTo(a.x, a.y1);
              ctx.lineTo(b.x, b.y2);
              ctx.moveTo(a.x, a.y2);
              ctx.lineTo(b.x, b.y1);
              ctx.stroke();
            }
            pts.forEach((p) => {
              [p.y1, p.y2].forEach((py) => {
                ctx.fillStyle = '#0B1917';
                ctx.strokeStyle = '#49EACB';
                ctx.lineWidth = 1.5;
                drawRoundedRect(ctx, p.x - 5.5, py - 5.5, 11, 11, 2.8);
                ctx.fill();
                ctx.stroke();
              });
            });
          };

          drawSubDagLane(westY, 0);
          drawSubDagLane(eastY, 17);
        } else {
          const spliceX = gutterX + laneW * 0.52;

          const waveR = ((t * 38) % 44) + 8;
          ctx.strokeStyle = `rgba(73, 234, 203, ${Math.max(0, 0.55 - waveR / 90)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(spliceX, midY, waveR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(73, 234, 203, 0.55)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(spliceX, 16);
          ctx.lineTo(spliceX, height - 16);
          ctx.stroke();
          ctx.setLineDash([]);

          const leftCols = [gutterX + 22, gutterX + 66, gutterX + 110].filter(
            (x) => x < spliceX - 18
          );
          leftCols.forEach((cx, idx) => {
            const nx = idx < leftCols.length - 1 ? leftCols[idx + 1] : spliceX;
            const targetWY = idx < leftCols.length - 1 ? westY : midY - 12;
            const targetEY = idx < leftCols.length - 1 ? eastY : midY + 12;
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.55)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(cx, westY - 8);
            ctx.lineTo(nx, targetWY);
            ctx.moveTo(cx, westY + 8);
            ctx.lineTo(nx, targetWY);
            ctx.moveTo(cx, eastY - 8);
            ctx.lineTo(nx, targetEY);
            ctx.moveTo(cx, eastY + 8);
            ctx.lineTo(nx, targetEY);
            ctx.stroke();

            [westY - 8, westY + 8, eastY - 8, eastY + 8].forEach((py) => {
              ctx.fillStyle = '#0B1917';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.5;
              drawRoundedRect(ctx, cx - 5.5, py - 5.5, 11, 11, 2.8);
              ctx.fill();
              ctx.stroke();
            });
          });

          const rightCols = [spliceX + 46, spliceX + 92, spliceX + 138].filter(
            (x) => x < width - rightPad - 8
          );
          let prevX = spliceX;
          rightCols.forEach((rx) => {
            ctx.strokeStyle = 'rgba(73, 234, 203, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(prevX, midY - 12);
            ctx.lineTo(rx, westY);
            ctx.moveTo(prevX, midY + 12);
            ctx.lineTo(rx, westY);
            ctx.moveTo(prevX, midY - 12);
            ctx.lineTo(rx, eastY);
            ctx.moveTo(prevX, midY + 12);
            ctx.lineTo(rx, eastY);
            ctx.stroke();
            prevX = rx;

            [westY, midY, eastY].forEach((ry) => {
              ctx.fillStyle = '#0E2622';
              ctx.strokeStyle = '#49EACB';
              ctx.lineWidth = 1.6;
              drawRoundedRect(ctx, rx - 6, ry - 6, 12, 12, 3);
              ctx.fill();
              ctx.stroke();
            });
          });

          [midY - 12, midY + 12].forEach((my) => {
            ctx.fillStyle = '#13352F';
            ctx.strokeStyle = '#49EACB';
            ctx.lineWidth = 2;
            drawRoundedRect(ctx, spliceX - 7, my - 7, 14, 14, 3.5);
            ctx.fill();
            ctx.stroke();
          });
        }
      } else if (fam === 'LINEAR_POW') {
        if (phase === 'PEACE') {
          const stepX = 56;
          const offset = (t * 24) % stepX;
          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, midY);
          ctx.lineTo(width - rightPad - 6, midY);
          ctx.stroke();

          for (let x = gutterX + 18 + offset; x < width - rightPad - 8; x += stepX) {
            const idx = Math.round((x - offset) / stepX);
            if (idx % 3 === 1) {
              const oy = idx % 2 === 0 ? westY - 4 : eastY + 4;
              ctx.save();
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.48)';
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(x - 22, midY);
              ctx.lineTo(x, oy);
              ctx.stroke();
              drawRoundedRect(ctx, x - 6, oy - 6, 12, 12, 3);
              ctx.fillStyle = '#18100B';
              ctx.fill();
              ctx.strokeStyle = '#F97316';
              ctx.stroke();
              ctx.restore();
            }

            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 7, midY - 7, 14, 14, 3.5);
            ctx.fill();
            ctx.stroke();
          }
        } else if (phase === 'WARTIME') {
          const westSpacing = Math.max(30, 82 - westShare * 0.55);
          const eastSpacing = Math.max(30, 82 - eastShare * 0.55);
          const westSpeed = 10 + westShare * 0.34;
          const eastSpeed = 10 + eastShare * 0.34;

          const drawLinearBranch = (y: number, spacing: number, spd: number, color: string) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(gutterX + 8, y);
            ctx.lineTo(width - rightPad - 8, y);
            ctx.stroke();

            const off = (t * spd) % spacing;
            for (let x = gutterX + 16 + off; x < width - rightPad - 8; x += spacing) {
              ctx.fillStyle = '#0B0E11';
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.8;
              drawRoundedRect(ctx, x - 6.5, y - 6.5, 13, 13, 3.2);
              ctx.fill();
              ctx.stroke();
            }
          };

          drawLinearBranch(westY, westSpacing, westSpeed, westShare >= 50 ? '#4ADE80' : '#FACC15');
          drawLinearBranch(eastY, eastSpacing, eastSpeed, eastShare > 50 ? '#4ADE80' : '#FACC15');
        } else {
          const westWins = westShare >= 50;
          const winY = westWins ? westY : eastY;
          const loseY = westWins ? eastY : westY;
          const spliceX = gutterX + laneW * 0.58;
          const shockCycle = (t * 0.65) % 1;
          const shockX = spliceX - shockCycle * (spliceX - gutterX);

          ctx.strokeStyle = '#4ADE80';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gutterX + 12, winY);
          ctx.lineTo(spliceX, winY);
          ctx.lineTo(spliceX + 34, midY);
          ctx.lineTo(width - rightPad - 10, midY);
          ctx.stroke();

          for (let x = gutterX + 24; x < spliceX - 8; x += 44) {
            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 6.5, winY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();
          }
          for (let x = spliceX + 38; x < width - rightPad - 10; x += 44) {
            ctx.fillStyle = '#0B1910';
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, x - 6.5, midY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();
          }

          ctx.save();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 12, loseY);
          ctx.lineTo(spliceX - 10, loseY);
          ctx.stroke();
          ctx.restore();

          for (let x = gutterX + 26; x < spliceX - 14; x += 46) {
            const isHit = x >= shockX;
            const shake = isHit ? Math.sin(t * 28 + x) * 1.4 : 0;
            ctx.fillStyle = isHit ? '#220C0E' : '#17150B';
            ctx.strokeStyle = isHit ? '#EF4444' : '#FACC15';
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6.5 + shake, loseY - 6.5, 13, 13, 3.2);
            ctx.fill();
            ctx.stroke();

            if (isHit) {
              ctx.strokeStyle = '#EF4444';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(x - 4 + shake, loseY - 4);
              ctx.lineTo(x + 4 + shake, loseY + 4);
              ctx.moveTo(x + 4 + shake, loseY - 4);
              ctx.lineTo(x - 4 + shake, loseY + 4);
              ctx.stroke();
            }
          }

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(shockX, loseY, 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (fam === 'PHYSICAL_COMMODITY') {
        if (phase === 'PEACE') {
          const shipX = gutterX + 20 + ((t * 14) % (laneW - 40));
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          ctx.moveTo(gutterX + 16, westY);
          ctx.lineTo(width - rightPad - 16, eastY);
          ctx.stroke();
          ctx.restore();

          [gutterX + 28, gutterX + laneW * 0.5, width - rightPad - 28].forEach((vx) => {
            [westY, eastY].forEach((vy) => {
              ctx.fillStyle = '#191507';
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.arc(vx, vy, 7.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            });
          });

          ctx.fillStyle = '#FACC15';
          drawRoundedRect(ctx, shipX - 8, midY - 5, 16, 10, 2.5);
          ctx.fill();
        } else if (phase === 'WARTIME') {
          [westY, eastY].forEach((cy, idx) => {
            for (let k = 0; k < 3; k++) {
              const cx = gutterX + 42 + k * ((laneW - 84) / 2);
              const ang = t * 2.1 + k + idx;
              ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
              ctx.beginPath();
              ctx.arc(cx, cy, 12, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = '#22C55E';
              ctx.beginPath();
              ctx.arc(cx + Math.cos(ang) * 12, cy + Math.sin(ang) * 12, 2.5, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#171407';
              ctx.strokeStyle = '#FACC15';
              ctx.lineWidth = 1.7;
              ctx.beginPath();
              ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          });

          ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
          drawRoundedRect(ctx, gutterX + laneW * 0.18, midY - 10, laneW * 0.64, 20, 10);
          ctx.fill();
          ctx.font = '700 8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#EF4444';
          ctx.textAlign = 'center';
          ctx.fillText('OCEAN BLOCKADE • 0.0 DIGITAL TPS', gutterX + laneW * 0.5, midY + 3);
          ctx.textAlign = 'start';
        } else {
          const crawlX = gutterX + 24 + ((t * 7) % (laneW - 48));
          ctx.fillStyle = '#1C1408';
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 1.6;
          drawRoundedRect(ctx, crawlX - 28, midY - 9, 56, 18, 5);
          ctx.fill();
          ctx.stroke();
          ctx.font = '700 7.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FACC15';
          ctx.textAlign = 'center';
          ctx.fillText('4-YR SHIP', crawlX, midY + 2.5);
          ctx.textAlign = 'start';
        }
      } else {
        const req = getBftQuorumThreshold(tk);
        const adaPermSplit = tk === 'ADA' && durationMins >= 2160;
        const westQuorum = tk === 'ADA' ? !adaPermSplit : westShare >= req;
        const eastQuorum = tk === 'ADA' ? !adaPermSplit : eastShare >= req;

        const drawEkgFlatline = (y: number, labelText: string) => {
          const sweepX = gutterX + ((t * 95) % laneW);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX, y);
          ctx.lineTo(width - rightPad, y);
          ctx.stroke();

          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(sweepX, y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(24, 11, 13, 0.9)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
          ctx.lineWidth = 1.1;
          drawRoundedRect(ctx, gutterX + laneW * 0.2, y - 9.5, laneW * 0.6, 19, 9.5);
          ctx.fill();
          ctx.stroke();

          ctx.font = '700 7.8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#FCA5A5';
          ctx.textAlign = 'center';
          ctx.fillText(labelText, gutterX + laneW * 0.5, y + 2.8);
          ctx.textAlign = 'start';
        };

        const drawLiveBftLane = (y: number, color: string) => {
          const stepX = 48;
          const off = (t * 36) % stepX;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, y);
          ctx.lineTo(width - rightPad - 6, y);
          ctx.stroke();
          for (let x = gutterX + 16 + off; x < width - rightPad - 8; x += stepX) {
            ctx.fillStyle = '#17120B';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6, y - 6, 12, 12, 3);
            ctx.fill();
            ctx.stroke();
          }
        };

        if (phase === 'PEACE') {
          const stepX = 50;
          const off = (t * 38) % stepX;
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gutterX + 6, midY);
          ctx.lineTo(width - rightPad - 6, midY);
          ctx.stroke();

          for (let x = gutterX + 18 + off; x < width - rightPad - 8; x += stepX) {
            ctx.strokeStyle = 'rgba(251, 146, 60, 0.25)';
            ctx.beginPath();
            ctx.moveTo(x, westY);
            ctx.lineTo(x, eastY);
            ctx.stroke();

            ctx.fillStyle = '#18110A';
            ctx.strokeStyle = '#FB923C';
            ctx.lineWidth = 1.6;
            drawRoundedRect(ctx, x - 6, midY - 6, 12, 12, 3);
            ctx.fill();
            ctx.stroke();
          }
        } else if (phase === 'WARTIME') {
          if (westQuorum) {
            drawLiveBftLane(westY, '#FACC15');
          } else {
            drawEkgFlatline(
              westY,
              tk === 'ADA'
                ? 'IRRECONCILABLE FORK (>36h)'
                : `${westShare}% < ${req}% QUORUM -> 0.0 TPS`
            );
          }

          if (eastQuorum) {
            drawLiveBftLane(eastY, '#FACC15');
          } else {
            drawEkgFlatline(
              eastY,
              tk === 'ADA'
                ? 'IRRECONCILABLE FORK (>36h)'
                : `${eastShare}% < ${req}% QUORUM -> 0.0 TPS`
            );
          }
        } else {
          const algoBlind = tk === 'ALGO' && durationMins >= 45;
          const bothDead = (!westQuorum && !eastQuorum) || adaPermSplit || algoBlind;

          if (bothDead) {
            drawEkgFlatline(westY, 'STALLED SLOTS • 0.0 J');
            drawEkgFlatline(eastY, 'STALLED SLOTS • 0.0 J');

            const pulse = 0.65 + Math.abs(Math.sin(t * 4)) * 0.35;
            ctx.fillStyle = '#220E11';
            ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
            ctx.lineWidth = 1.8;
            drawRoundedRect(ctx, gutterX + laneW * 0.22, midY - 13, laneW * 0.56, 26, 7);
            ctx.fill();
            ctx.stroke();

            ctx.font = '700 8px "JetBrains Mono", monospace';
            ctx.fillStyle = '#FCA5A5';
            ctx.textAlign = 'center';
            ctx.fillText(
              algoBlind
                ? 'FOUNDATION CATCHPOINT REQUIRED'
                : adaPermSplit
                ? 'SOCIAL HARD-FORK REQUIRED'
                : 'DISCORD SLOT REBOOT REQUIRED',
              gutterX + laneW * 0.5,
              midY + 3
            );
            ctx.textAlign = 'start';
          } else {
            const liveY = westQuorum ? westY : eastY;
            const deadY = westQuorum ? eastY : westY;
            drawLiveBftLane(liveY, '#FB923C');
            drawEkgFlatline(deadY, '0 TXs SETTLED -> CLOUD SNAPSHOT SYNC');
          }
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateSize);
    };
  }, [fam, tk, phase, westShare, eastShare, durationMins, info.westAlive, info.eastAlive, info.statusColor]);

  return (
    <div className="rounded-2xl bg-[#07080A] border border-white/[0.07] p-4 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor: info.statusColor,
              boxShadow: `0 0 8px ${info.statusColor}`
            }}
          />
          <span className="font-mono text-xs font-bold text-white truncate">
            ${auditObj.ticker}{' '}
            <span className="text-neutral-500 font-normal">// {auditObj.name}</span>
          </span>
        </div>

        <span
          className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold shrink-0"
          style={{
            color: info.statusColor,
            backgroundColor: `${info.statusColor}18`,
            border: `1px solid ${info.statusColor}50`
          }}
        >
          {info.statusLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full rounded-xl bg-[#0B0C0E] border border-white/[0.05] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          data-testid={`wartime-canvas-${auditObj.ticker}`}
          className="w-full block"
          style={{ height: '178px' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {info.metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-[#0B0C0E] border border-white/[0.05] px-2.5 py-2"
          >
            <div className="font-mono text-[9.5px] uppercase tracking-wider text-neutral-500 truncate">
              {m.label}
            </div>
            <div
              className="font-mono text-[10.5px] font-bold mt-0.5 truncate"
              style={{ color: m.color }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-300 leading-relaxed">{info.caption}</p>
    </div>
  );
}

export interface WartimeSpliceSimulatorProps {
  activeAudit: AuditData;
  kasAudit: AuditData;
  accent: GradeAccent;
}

export function WartimeSpliceSimulator({
  activeAudit,
  kasAudit,
  accent
}: WartimeSpliceSimulatorProps) {
  const [phase, setPhase] = useState<PartitionPhase>('WARTIME');
  const [westShare, setWestShare] = useState(58);
  const [durationMins, setDurationMins] = useState(60);
  const [compareKas, setCompareKas] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  const showSideBySide = compareKas && activeAudit?.ticker !== 'KAS' && Boolean(kasAudit);
  const eastShare = 100 - westShare;

  useEffect(() => {
    if (!autoPlay) return undefined;
    const order: PartitionPhase[] = ['PEACE', 'WARTIME', 'SPLICE'];
    const timer = setInterval(() => {
      setPhase((prev) => order[(order.indexOf(prev) + 1) % order.length]);
    }, 4200);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const phases: Array<{
    id: PartitionPhase;
    label: string;
    icon: typeof Wifi;
    iconColor: string;
  }> = [
    { id: 'PEACE', label: '1. Peacetime Sync', icon: Wifi, iconColor: '#49EACB' },
    { id: 'WARTIME', label: '2. Wartime Fiber Cut', icon: Scissors, iconColor: '#EF4444' },
    { id: 'SPLICE', label: '3. Cable Resplice', icon: GitMerge, iconColor: accent.primary }
  ];

  return (
    <div className="rounded-2xl bg-[#0B0C0E] border border-white/[0.08] p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            INVARIANT 04 // INTERACTIVE PARTITION &amp; RESPLICE LAB
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
            Wartime Partition, Quorum Cliff &amp; Cable Splice Simulator
          </h3>
        </div>

        <div
          className={`p-0.5 rounded-full bg-[#121418] border border-white/10 flex flex-nowrap items-center justify-between sm:justify-start gap-0.5 sm:gap-1 ${
            activeAudit?.ticker !== 'KAS' ? 'w-full sm:w-auto' : 'w-auto'
          }`}
        >
          <button
            type="button"
            aria-pressed={autoPlay}
            onClick={() => setAutoPlay((p) => !p)}
            className={`px-1.5 sm:px-3 py-1 rounded-full font-mono text-[9px] sm:text-[11px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0 transition ${
              autoPlay
                ? 'font-bold border'
                : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
            style={
              autoPlay
                ? {
                    backgroundColor: accent.softBg,
                    color: accent.primary,
                    borderColor: accent.border
                  }
                : undefined
            }
          >
            {autoPlay ? (
              <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
            ) : (
              <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
            )}
            <span>{autoPlay ? 'Auto-Cycling' : 'Auto-Play Cycle'}</span>
          </button>

          {activeAudit?.ticker !== 'KAS' && (
            <button
              type="button"
              aria-pressed={compareKas}
              onClick={() => setCompareKas((prev) => !prev)}
              className={`px-1.5 sm:px-3 py-1 rounded-full font-mono text-[9px] sm:text-[11px] flex-1 sm:flex-none inline-flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap min-w-0 transition ${
                compareKas
                  ? 'font-bold border'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
              style={
                compareKas
                  ? {
                      backgroundColor: accent.softBg,
                      color: accent.primary,
                      borderColor: accent.border
                    }
                  : undefined
              }
            >
              <Columns className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span>{compareKas ? 'Side-by-Side vs $KAS' : 'Compare vs $KAS'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-1 rounded-2xl sm:rounded-full bg-[#07080A] border border-white/[0.07] grid grid-cols-1 sm:grid-cols-3 gap-1">
        {phases.map((p) => {
          const PIcon = p.icon;
          const isActive = phase === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setAutoPlay(false);
                setPhase(p.id);
              }}
              className={`px-3 py-2 rounded-xl sm:rounded-full font-mono text-xs transition flex items-center justify-center gap-1.5 ${
                isActive
                  ? 'bg-[#151820] text-white font-semibold border border-white/15 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              <PIcon className="w-3.5 h-3.5 shrink-0" style={{ color: p.iconColor }} />
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-[#07080A] border border-white/[0.07] p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#49EACB] font-bold">WEST: {westShare}%</span>
            <span className="text-neutral-600">//</span>
            <span className="text-[#FACC15] font-bold">EAST: {eastShare}%</span>
            <span className="hidden sm:inline text-neutral-500 text-[11px]">
              (Hashrate / Stake Split)
            </span>
          </div>

          <div className="w-full sm:w-auto grid grid-cols-4 sm:flex items-center gap-0.5 sm:gap-1 bg-[#0B0C0E] p-0.5 rounded-full border border-white/[0.07]">
            {DURATION_OPTIONS.map((opt) => {
              const activeDur = durationMins === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  aria-pressed={activeDur}
                  onClick={() => setDurationMins(opt.mins)}
                  className={`px-1.5 sm:px-2.5 py-1 sm:py-0.5 rounded-full font-mono text-[9.5px] sm:text-[10px] whitespace-nowrap text-center transition ${
                    activeDur
                      ? 'font-bold border'
                      : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
                  }`}
                  style={
                    activeDur
                      ? {
                          backgroundColor: accent.softBg,
                          color: accent.primary,
                          borderColor: accent.border
                        }
                      : undefined
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative pt-1 pb-0.5">
          <div
            className="w-full h-2.5 rounded-full overflow-hidden flex border border-white/10"
            style={{ backgroundColor: '#121418' }}
          >
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${westShare}%`,
                background: 'linear-gradient(90deg, #49EACB 0%, #22C55E 100%)'
              }}
            />
            <div
              className="h-full transition-all duration-75"
              style={{
                width: `${eastShare}%`,
                background: 'linear-gradient(90deg, #FACC15 0%, #FB923C 100%)'
              }}
            />
          </div>

          <input
            type="range"
            min={10}
            max={90}
            step={1}
            value={westShare}
            aria-label="Adjust West vs East Hemisphere Hashrate or Stake Split"
            onChange={(e) => setWestShare(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />

          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#07080A] shadow-[0_0_12px_rgba(73,234,203,0.85)]"
            style={{ left: `${((westShare - 10) / 80) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-1.5 sm:gap-2 pt-0.5">
          {PARTITION_PRESETS.map((pr, idx) => {
            const isPreset = westShare === pr.west;
            const isLastOdd = idx === PARTITION_PRESETS.length - 1;
            return (
              <button
                key={pr.west}
                type="button"
                aria-pressed={isPreset}
                onClick={() => setWestShare(pr.west)}
                className={`px-1.5 sm:px-2.5 py-1.5 sm:py-1 rounded-full font-mono text-[9.5px] sm:text-[10px] transition flex items-center justify-center gap-1 whitespace-nowrap ${
                  isLastOdd ? 'col-span-2 sm:col-span-1' : ''
                } ${
                  isPreset
                    ? 'font-bold border'
                    : 'bg-[#0B0C0E] hover:bg-[#14171E] text-neutral-400 border border-white/[0.06]'
                }`}
                style={
                  isPreset
                    ? {
                        backgroundColor: accent.softBg,
                        color: accent.primary,
                        borderColor: accent.border
                      }
                    : undefined
                }
              >
                <span>{pr.label}</span>
                <span className="text-[9px] opacity-65 hidden md:inline">• {pr.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showSideBySide ? 'lg:grid-cols-2' : ''} gap-3.5`}>
        <TopologyMeshCanvas
          auditObj={activeAudit}
          phase={phase}
          westShare={westShare}
          durationMins={durationMins}
        />
        {showSideBySide && (
          <TopologyMeshCanvas
            auditObj={kasAudit}
            phase={phase}
            westShare={westShare}
            durationMins={durationMins}
          />
        )}
      </div>
    </div>
  );
}

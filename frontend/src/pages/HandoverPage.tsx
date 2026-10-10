import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  FileCode2, 
  Cpu, 
  Copy, 
  Check, 
  Sparkles,
  Terminal,
  Activity,
  Layers,
  Plane
} from 'lucide-react';
import { FileItem } from '../api/client';

interface HandoverScenario {
  id: string;
  title: string;
  tag: string;
  domain: string;
  objective: string;
  departingEngineer: string;
  shiftTime: string;
  progressPercent: number;
  completedItems: Array<{ file: string; desc: string; lines: string }>;
  incompleteItems: Array<{ file: string; desc: string; risk: 'HIGH' | 'CRITICAL' | 'MEDIUM'; action: string }>;
  safetyInvariants: Array<{ rule: string; status: 'VERIFIED' | 'PENDING' | 'WARNING'; detail: string }>;
  codeBefore: string;
  codeAfterWIP: string;
  recommendedNextSteps: string[];
}

export const HandoverPage: React.FC<{ files?: FileItem[]; onNavigate?: (page: string) => void }> = () => {
  const scenarios: HandoverScenario[] = [
    {
      id: 'atc_equipment_status',
      title: 'ATC Radar & Avionics: Equipment Status 3-State Migration',
      tag: 'Air Traffic Control',
      domain: 'Mission-Critical Aerospace',
      objective: 'Simplify legacy multi-flag fault state into three clean canonical states: Operational, Maintenance, and Offline.',
      departingEngineer: 'Captain Sarah Jenkins (Shift A - 14:00 to 22:00)',
      shiftTime: 'Shift Handover @ 21:58 UTC',
      progressPercent: 62,
      completedItems: [
        { file: 'backend/avionics/equipmentModel.ts', desc: 'Added enum EquipmentState { Operational, Maintenance, Offline }', lines: '+18 -4' },
        { file: 'backend/telemetry/radarIngest.ts', desc: 'Updated primary telemetry stream decoder to map raw bits to new 3 states', lines: '+34 -12' },
        { file: 'database/migrations/004_equipment_v3.sql', desc: 'Added generated dual-write view `v_equipment_status` for zero-downtime telemetry', lines: '+45 -0' }
      ],
      incompleteItems: [
        { 
          file: 'backend/controllers/flightPlanner.ts', 
          desc: 'Still references legacy `is_fault_code_9` boolean flag; flight clearance logic will reject operational radars.', 
          risk: 'CRITICAL',
          action: 'Patch `checkRunwayRadarAvailability()` to use `state === EquipmentState.Operational`'
        },
        { 
          file: 'backend/services/alertDispatch.ts', 
          desc: 'Alert dispatcher missing branch for `EquipmentState.Maintenance`; alarms will default to emergency sirens.', 
          risk: 'HIGH',
          action: 'Add `case EquipmentState.Maintenance: dispatchMaintenanceTicket()`'
        },
        { 
          file: 'tests/telemetry_simulation_test.py', 
          desc: 'Heartbeat ping test fails with KeyError: legacy `fault_bitmap` removed in schema.', 
          risk: 'HIGH',
          action: 'Update mock payload fixture to include both legacy fallback and new canonical enum'
        }
      ],
      safetyInvariants: [
        { rule: 'Zero Downtime Telemetry Invariant', status: 'VERIFIED', detail: 'Dual-write trigger active; old flight control clients receive translated status.' },
        { rule: 'Fail-Safe Default to Offline', status: 'VERIFIED', detail: 'Unparseable equipment packets safely default to Offline rather than crashing.' },
        { rule: 'Flight Clearance Dispatch Guard', status: 'WARNING', detail: 'flightPlanner.ts has not been recompiled with new enum imports.' }
      ],
      codeBefore: `// LEGACY ATC CODE (Untidy 8-flag bitmap):
export function getRadarEquipmentStatus(rawDevice: DeviceRecord): string {
  if (rawDevice.is_fault_code_9) return "DEGRADED_SECTOR_9";
  if (rawDevice.fault_flags & 0x04) return "HARDWARE_ERR";
  if (!rawDevice.ping_ok) return "DEAD";
  return "NORMAL";
}`,
      codeAfterWIP: `// PARTIALLY IMPLEMENTED (WIP by Shift A):
export enum EquipmentState {
  Operational = "OPERATIONAL",
  Maintenance = "MAINTENANCE",
  Offline = "OFFLINE"
}

export function getRadarEquipmentStatus(rawDevice: DeviceRecord): EquipmentState {
  if (!rawDevice.ping_ok) return EquipmentState.Offline;
  if (rawDevice.in_scheduled_service) return EquipmentState.Maintenance;
  // TODO [Shift B]: What about legacy is_fault_code_9?
  // Still needs translation for flightPlanner.ts!
  return EquipmentState.Operational;
}`,
      recommendedNextSteps: [
        'Apply scoped AST patch to flightPlanner.ts (replace is_fault_code_9 check)',
        'Wire alertDispatch.ts Maintenance case to quiet technician alert channel',
        'Run simulated radar test suite to verify 0 dropped telemetry packets',
        'Merge PR #412 into avionics-main and trigger staging canary deployment'
      ]
    },
    {
      id: 'ecommerce_payment_split',
      title: 'Enterprise E-Commerce: Payment Gateway Dual-Write & Idempotency Key',
      tag: 'Fintech Core',
      domain: 'High-Volume Transaction Banking',
      objective: 'Transition legacy Stripe V1 checkout to Stripe V3 with mandatory UUIDv7 idempotency keys.',
      departingEngineer: 'Alex Chen (Fintech Infrastructure)',
      shiftTime: 'Shift Handover @ 18:00 EST',
      progressPercent: 75,
      completedItems: [
        { file: 'backend/services/paymentService.ts', desc: 'Added IdempotencyKey generator and V3 SDK initialization', lines: '+52 -18' },
        { file: 'backend/models/paymentTransaction.ts', desc: 'Added idempotency_key column with UNIQUE index', lines: '+12 -2' }
      ],
      incompleteItems: [
        { 
          file: 'backend/controllers/checkoutController.ts', 
          desc: 'Missing client retry handler; duplicates on network timeout are not yet deduped at HTTP layer.', 
          risk: 'CRITICAL',
          action: 'Wrap `processOrderCheckout` in `@WithIdempotencyHeader()` decorator'
        },
        { 
          file: 'backend/workers/refundReconciler.ts', 
          desc: 'Still querying legacy `charge_id` table rather than `idempotent_charge_v3`.', 
          risk: 'MEDIUM',
          action: 'Switch SQL query to `v_reconciled_charges`'
        }
      ],
      safetyInvariants: [
        { rule: 'Double-Charge Prevention Invariant', status: 'VERIFIED', detail: 'Database unique constraint prevents duplicate charge execution.' },
        { rule: 'Webhook Signature Verification', status: 'VERIFIED', detail: 'Secret rotation verified against sandbox webhook listeners.' },
        { rule: 'Auto-Refund on Partial Cart Failure', status: 'PENDING', detail: 'Pending test verification in worker queue.' }
      ],
      codeBefore: `// LEGACY STRIPE V1 EXECUTION:
async function executeCharge(order: Order): Promise<ChargeResult> {
  return await stripeLegacy.charges.create({
    amount: order.cents,
    currency: 'usd',
    customer: order.customer_id
  });
}`,
      codeAfterWIP: `// PARTIALLY IMPLEMENTED STRIPE V3 WITH IDEMPOTENCY:
async function executeCharge(order: Order, key?: string): Promise<ChargeResult> {
  const idempotencyKey = key || generateUUIDv7();
  return await stripeV3.paymentIntents.create({
    amount: order.cents,
    currency: 'usd',
    customer: order.customer_id
  }, {
    idempotencyKey // WIP: What if checkoutController retries without passing key?
  });
}`,
      recommendedNextSteps: [
        'Enforce mandatory Idempotency-Key HTTP header in checkoutController.ts',
        'Run reconciliation dry-run in staging ledger database',
        'Verify zero double-billing under 500 RPS chaos test'
      ]
    }
  ];

  const [activeScenarioId, setActiveScenarioId] = useState<string>('atc_equipment_status');
  const [copied, setCopied] = useState(false);
  const [resumingState, setResumingState] = useState<'idle' | 'analyzing' | 'synthesizing' | 'ready'>('idle');

  const currentScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  const handleExportBriefing = () => {
    const text = `# SHIFT HANDOVER BRIEFING: ${currentScenario.title}
**Domain:** ${currentScenario.domain}
**Handover Timestamp:** ${currentScenario.shiftTime}
**Departing Engineer:** ${currentScenario.departingEngineer}
**Overall Progress:** ${currentScenario.progressPercent}%

## 1. COMPLETED & MERGED WORK
${currentScenario.completedItems.map(c => `- **${c.file}**: ${c.desc} (${c.lines})`).join('\n')}

## 2. UNFINISHED WORK & CRITICAL CAVEATS
${currentScenario.incompleteItems.map(i => `- [${i.risk}] **${i.file}**: ${i.desc}\n  -> Action Required: ${i.action}`).join('\n')}

## 3. SAFETY INVARIANTS & VERIFICATION
${currentScenario.safetyInvariants.map(s => `- [${s.status}] **${s.rule}**: ${s.detail}`).join('\n')}

## 4. IMMEDIATE ACTION CHECKLIST FOR NEXT SHIFT
${currentScenario.recommendedNextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateResume = () => {
    setResumingState('analyzing');
    setTimeout(() => {
      setResumingState('synthesizing');
      setTimeout(() => {
        setResumingState('ready');
      }, 900);
    }, 700);
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-y-auto w-full">
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full animate-fade-in text-[var(--text-primary)]">
      
      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-purple-50/90 dark:from-indigo-950/80 dark:via-slate-900/90 dark:to-purple-950/70 border border-indigo-100 dark:border-indigo-500/30 shadow-sm dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 shadow-sm">
                <Users className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] font-mono">
                    Shift Handover Pro
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
                    Live Continuity Engine
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  AI-assisted maintenance resume system: safe continuity for partially implemented development requests across engineering shifts.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportBriefing}
              className="btn-studio btn-studio-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold shadow-sm"
              title="Copy formatted markdown briefing for Jira/Slack handover"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[var(--text-tertiary)]" />}
              <span>{copied ? 'Copied Briefing!' : 'Export Handover Briefing'}</span>
            </button>

            <button
              onClick={handleSimulateResume}
              className="btn-studio btn-studio-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-md shadow-indigo-600/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Resume Work with AI</span>
            </button>
          </div>
        </div>

        {/* Scenario Selector Pills */}
        <div className="mt-6 pt-4 border-t border-[var(--border-hairline)] flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-tertiary)] font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Select Active Shift:
          </span>
          {scenarios.map(sc => (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenarioId(sc.id);
                setResumingState('idle');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 ${
                activeScenarioId === sc.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-600 font-bold'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-hairline)]'
              }`}
            >
              {sc.id.startsWith('atc') ? <Plane className="w-3.5 h-3.5 text-amber-500" /> : <Activity className="w-3.5 h-3.5 text-cyan-500" />}
              <span>{sc.tag}</span>
              <span className="text-[10px] opacity-80 font-mono">({sc.progressPercent}%)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Departing Engineer Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] font-semibold">Departing Engineer</span>
          <div className="text-xs font-semibold text-[var(--text-primary)]">{currentScenario.departingEngineer}</div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] font-semibold">Handover Time</span>
          <div className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {currentScenario.shiftTime}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] font-semibold">Implementation Progress</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full" 
                style={{ width: `${currentScenario.progressPercent}%` }} 
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{currentScenario.progressPercent}%</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-1 shadow-sm">
          <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)] font-semibold">Safety Invariants</span>
          <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> 2 Verified, 1 Guard
          </div>
        </div>
      </div>

      {/* Main Differential Handover Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: What has already changed */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase font-mono tracking-wider">
                1. What Has Already Changed (Completed)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/50 px-2 py-0.5 rounded font-bold">
              {currentScenario.completedItems.length} Files Ready
            </span>
          </div>

          <div className="space-y-3">
            {currentScenario.completedItems.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300">{item.file}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    {item.lines}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Safety Invariants Status */}
          <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Verified Safety Invariants
            </h3>
            <div className="space-y-1.5">
              {currentScenario.safetyInvariants.map((inv, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-start gap-2.5 text-xs">
                  <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold shrink-0 uppercase ${
                    inv.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    {inv.status}
                  </span>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{inv.rule}</div>
                    <div className="text-[var(--text-tertiary)] text-[11px] mt-0.5">{inv.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: What Remains Incomplete & Risk Radius */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase font-mono tracking-wider">
                2. What Remains Incomplete (Immediate Risk)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/50 px-2 py-0.5 rounded font-bold">
              {currentScenario.incompleteItems.length} Blockers
            </span>
          </div>

          <div className="space-y-3">
            {currentScenario.incompleteItems.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-amber-200 dark:border-amber-900/30 hover:border-amber-300 transition-colors space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{item.file}</span>
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                    item.risk === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300' : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}>
                    {item.risk} RISK
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {item.desc}
                </p>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] font-mono text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Next Engineer Action:</strong> {item.action}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action Checklist */}
          <div className="mt-4 pt-3 border-t border-[var(--border-hairline)] space-y-2">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Recommended Shift B Execution Sequence
            </h3>
            <div className="space-y-1.5 font-mono text-xs">
              {currentScenario.recommendedNextSteps.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-surface)] flex items-center gap-2 text-[var(--text-secondary)] border border-[var(--border-hairline)]">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Side-by-Side WIP Code Inspector */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-hairline)] space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">
              WIP Code Inspection & Incomplete Branch Point
            </h2>
          </div>
          <span className="text-xs text-[var(--text-tertiary)] font-mono">
            Comparing original legacy implementation with uncommitted shift work
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] font-semibold block">
              Original Legacy Code (Before Shift)
            </span>
            <pre className="p-3.5 rounded-xl pro-code-block text-xs overflow-x-auto leading-relaxed">
              {currentScenario.codeBefore}
            </pre>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono text-indigo-600 dark:text-cyan-400 font-semibold block flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Unfinished Shift Work (Where Shift A Ended)
            </span>
            <pre className="p-3.5 rounded-xl pro-code-block text-xs overflow-x-auto leading-relaxed border-indigo-500/30">
              {currentScenario.codeAfterWIP}
            </pre>
          </div>
        </div>

        {/* AI Resume Simulation Status */}
        {resumingState !== 'idle' && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/50 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-800 dark:text-indigo-300">
              <Cpu className="w-4 h-4 animate-spin text-indigo-600 dark:text-cyan-400" />
              <span>
                {resumingState === 'analyzing' && 'Analyzing AST Call Graph Collisions for Incomplete Interfaces...'}
                {resumingState === 'synthesizing' && 'Synthesizing Backward-Compatible Adapter for flightPlanner.ts...'}
                {resumingState === 'ready' && '✅ Autonomous Resume Patch Synthesized: Ready for Pull Request'}
              </span>
            </div>
            {resumingState === 'ready' && (
              <div className="text-xs text-[var(--text-primary)] font-mono p-2.5 rounded bg-[var(--bg-surface)] border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between">
                <span>PR #413 auto-generated: "complete-equipment-state-migration-shift-handover"</span>
                <span className="text-emerald-600 font-bold">100% Invariants Preserved</span>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

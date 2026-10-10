import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  GitPullRequest, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Database, 
  CheckCircle2, 
  ArrowRight, 
  Cloud, 
  RotateCcw, 
  Terminal, 
  Search, 
  FileCode2, 
  Filter, 
  Activity,
  Play
} from 'lucide-react';
import { 
  api, 
  RefactorScenarioItem, 
  RefactorSimulationResult, 
  FleetScaleData 
} from '../api/client';

interface SystemDNAModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoId: string;
}

export const SystemDNAModal: React.FC<SystemDNAModalProps> = ({ isOpen, onClose, repoId }) => {
  const [activeTab, setActiveTab] = useState<'refactor' | 'waves' | 'fleet' | 'pr'>('refactor');
  const [scenarios, setScenarios] = useState<RefactorScenarioItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario_rename_customer_id');
  const [customInput, setCustomInput] = useState<string>('');
  const [simulation, setSimulation] = useState<RefactorSimulationResult | null>(null);
  const [fleetData, setFleetData] = useState<FleetScaleData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [rollbackSimulated, setRollbackSimulated] = useState<boolean>(false);
  const [fleetTierFilter, setFleetTierFilter] = useState<'ALL' | 'GOLDEN' | 'GRAY' | 'RED'>('ALL');

  useEffect(() => {
    if (isOpen && repoId) {
      loadInitialData();
    }
  }, [isOpen, repoId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [scenariosRes, fleetRes] = await Promise.all([
        api.getRefactorScenarios(repoId),
        api.getFleetScale(repoId)
      ]);
      setScenarios(scenariosRes);
      setFleetData(fleetRes);

      // Run default simulation
      const simRes = await api.simulateRefactor(repoId, selectedScenarioId);
      setSimulation(simRes);
    } catch (err) {
      console.error('Failed to load SystemDNA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async (scenarioId?: string, custom?: string) => {
    setLoading(true);
    setRollbackSimulated(false);
    try {
      const res = await api.simulateRefactor(repoId, scenarioId || selectedScenarioId, custom || customInput);
      setSimulation(res);
    } catch (err) {
      console.error('Failed to simulate refactor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRollback = () => {
    setRollbackSimulated(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  SystemDNA & Cloud Migration Accelerator
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ForgeHacks 2026
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Compiler Precision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deep AST Refactoring • Grep Precision Matrix • Multi-Wave Scoped Fixers • 1,000-App Enterprise Fleet Modernization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
          <button
            onClick={() => setActiveTab('refactor')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all ${
              activeTab === 'refactor'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Ripple Predictor & Grep vs. AST
          </button>

          <button
            onClick={() => setActiveTab('waves')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all ${
              activeTab === 'waves'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. Multi-Wave Scoped Fixers & Agent City
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all ${
              activeTab === 'fleet'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            3. Enterprise Fleet Scale (1,000 Apps)
          </button>

          <button
            onClick={() => setActiveTab('pr')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all ${
              activeTab === 'pr'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            4. Generated Migration & PR Diff
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: REFACTOR PREDICTOR & GREP VS AST */}
          {activeTab === 'refactor' && (
            <div className="space-y-6 animate-fade-in">
              {/* Scenario Selector & Custom Prompt */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    Select High-Risk Enterprise Refactor Scenario:
                  </label>
                  <select
                    value={selectedScenarioId}
                    onChange={(e) => {
                      setSelectedScenarioId(e.target.value);
                      handleRunSimulation(e.target.value);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    {scenarios.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        [{sc.category}] {sc.title} — ({sc.estimated_waves} waves)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    disabled={loading}
                    onClick={() => handleRunSimulation(selectedScenarioId)}
                    className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {loading ? 'Analyzing AST...' : 'Simulate Ripple'}
                  </button>
                </div>
              </div>

              {simulation && (
                <>
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-xs text-slate-400">Target Symbol</div>
                      <div className="text-lg font-mono font-bold text-indigo-400 mt-1">
                        {simulation.target_symbol}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Cross-tier refactor</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-xs text-slate-400">Architectural Risk</div>
                      <div className="text-lg font-bold text-rose-400 mt-1 flex items-center gap-2">
                        {simulation.risk_score} / 100
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                          {simulation.risk_level}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Blast radius severity</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-xs text-slate-400">Grep Noise Filtered</div>
                      <div className="text-lg font-bold text-amber-400 mt-1">
                        {simulation.grep_comparison.false_positives_avoided.length} False Alarms
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-0.5">Prevented by AST</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-xs text-slate-400">Missed Usages Rescued</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">
                        {simulation.grep_comparison.false_negatives_rescued.length} Indirect Calls
                      </div>
                      <div className="text-[11px] text-indigo-400 mt-0.5">Found via Compiler</div>
                    </div>
                  </div>

                  {/* GREP VS COMPILER PRECISION MATRIX */}
                  <div className="p-5 rounded-xl bg-slate-800/40 border border-indigo-500/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Search className="w-4 h-4 text-indigo-400" />
                          Why Grep Fails: The Compiler vs. Text Search Precision Gap
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Standard search tools drown engineers in false alarms and fail on destructuring, SQL binds, and inheritance.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          AST Precision: 100%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* False Positives Grep Flags */}
                      <div className="p-4 rounded-lg bg-slate-900/80 border border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Grep False Alarms (Avoided by AST)
                          </span>
                          <span className="text-[11px] text-slate-500">Unrelated Homonyms</span>
                        </div>
                        <div className="space-y-2.5">
                          {simulation.grep_comparison.false_positives_avoided.map((fp, i) => (
                            <div key={i} className="p-2.5 rounded bg-slate-800/40 border border-slate-700/50 text-xs">
                              <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                                <span>{fp.file}:{fp.line}</span>
                                <span className="text-amber-400 text-[10px]">Ignored by SystemDNA</span>
                              </div>
                              <code className="block bg-slate-950 p-1.5 rounded text-amber-200/90 font-mono text-[11px] my-1">
                                {fp.code_snippet}
                              </code>
                              <div className="text-slate-400 text-[11px] leading-relaxed">
                                {fp.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* False Negatives Grep Misses */}
                      <div className="p-4 rounded-lg bg-slate-900/80 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Indirect Usages Grep Misses (Rescued by AST)
                          </span>
                          <span className="text-[11px] text-slate-500">Silent Outage Prevention</span>
                        </div>
                        <div className="space-y-2.5">
                          {simulation.grep_comparison.false_negatives_rescued.map((fn, i) => (
                            <div key={i} className="p-2.5 rounded bg-slate-800/40 border border-slate-700/50 text-xs">
                              <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                                <span>{fn.file}:{fn.line}</span>
                                <span className="text-emerald-400 text-[10px]">Captured in Graph</span>
                              </div>
                              <code className="block bg-slate-950 p-1.5 rounded text-emerald-200/90 font-mono text-[11px] my-1">
                                {fn.code_snippet}
                              </code>
                              <div className="text-slate-400 text-[11px] leading-relaxed">
                                {fn.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impacted Business Processes */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      Critical Business Processes Governed by this Change:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {simulation.impacted_business_processes.map((proc, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                          {proc}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: MULTI-WAVE SCOPED FIXERS & AGENT CITY */}
          {activeTab === 'waves' && simulation && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Topological Wave Execution Pipeline
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Never mutates consumers before providers. Each wave enforces strict file-level permits, type-checks, and auto-rollback.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSimulateRollback}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {rollbackSimulated ? 'Rollback Triggered!' : 'Test Auto-Rollback Gate'}
                  </button>
                </div>
              </div>

              {rollbackSimulated && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-200 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong>Safety Sentinel Triggered:</strong> Simulated compilation mismatch in Wave 3 route signature. Scoped fixer reverted within 0.8s. Database and service state restored cleanly to prior milestone.
                  </span>
                </div>
              )}

              {/* Waves Stack */}
              <div className="space-y-4">
                {simulation.waves.map((wave) => (
                  <div key={wave.wave_number} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/40 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {wave.wave_number}
                        </span>
                        <h4 className="text-sm font-bold text-white">{wave.wave_title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          wave.tier === 'GOLDEN' ? 'bg-emerald-500/20 text-emerald-300' :
                          wave.tier === 'GRAY' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          Tier {wave.tier}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{wave.risk_profile}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {wave.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">Target Files ({wave.files_count}):</span>
                        <ul className="space-y-1">
                          {wave.files.map((f, i) => (
                            <li key={i} className="font-mono text-indigo-300/90 text-[11px] bg-slate-900/60 px-2 py-1 rounded flex items-center gap-1.5">
                              <FileCode2 className="w-3 h-3 text-slate-500" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Verification Gate:</span>
                          <span className="text-slate-200 text-[11px]">{wave.verification}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Rollback Guarantee:</span>
                          <span className="text-slate-300 text-[11px] font-mono">{wave.rollback_guarantee}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agent City Live Activity Radar */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Agent City: Live Cooperating Agents Execution Log
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">5/5 AGENTS SYNCHRONIZED</span>
                </div>

                <div className="space-y-2">
                  {simulation.agents.map((ag) => (
                    <div key={ag.agent_id} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-white">{ag.name}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{ag.role}</span>
                        <span className="font-mono text-[10px] text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                          {ag.permit_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">{ag.log}</span>
                        <span className="font-mono text-[10px] text-slate-500">{ag.execution_time_ms}ms</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {ag.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENTERPRISE FLEET SCALE (1,000 APPS) */}
          {activeTab === 'fleet' && fleetData && (
            <div className="space-y-6 animate-fade-in">
              {/* Fleet Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <div className="text-xs text-slate-400">Total Estate Fleet</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {fleetData.estate_overview.total_applications} Apps
                  </div>
                  <div className="text-[11px] text-indigo-300 mt-0.5">Enterprise Cloud Migration</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-emerald-500/30 bg-emerald-500/5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>🌟 GOLDEN Tier</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Auto-Rehost</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {fleetData.estate_overview.golden_tier_count}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Zero security blockers</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-amber-500/30 bg-amber-500/5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>⚡ GRAY Tier</span>
                    <span className="text-[10px] text-amber-400 font-bold">Wave Scheduled</span>
                  </div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {fleetData.estate_overview.gray_tier_count}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Auto-config migration</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-rose-500/30 bg-rose-500/5">
                  <div className="text-xs text-slate-400 flex items-center justify-between">
                    <span>🚨 RED Tier</span>
                    <span className="text-[10px] text-rose-400 font-bold">Action Required</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">
                    {fleetData.estate_overview.red_tier_count}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">High-risk architectural debts</div>
                </div>
              </div>

              {/* Cutover & Canary Gates */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                    Zero-Downtime Traffic Cutover & Canary Telemetry Sentinel
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-mono">Auto-Rollback Guard: 30s</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                    <div className="font-semibold text-white">Stage 1: Canary 10%</div>
                    <div className="text-slate-400 text-[11px] mt-1">{fleetData.cutover_pipeline.canary_stage_1}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                    <div className="font-semibold text-white">Stage 2: Staging 50%</div>
                    <div className="text-slate-400 text-[11px] mt-1">{fleetData.cutover_pipeline.stage_2}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60">
                    <div className="font-semibold text-white">Stage 3: 100% Production Cutover</div>
                    <div className="text-slate-400 text-[11px] mt-1">{fleetData.cutover_pipeline.stage_3}</div>
                  </div>
                </div>
              </div>

              {/* Sample Estate Applications Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Representative Fleet Estate Apps (Triage & Recommendations)
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs">
                    {(['ALL', 'GOLDEN', 'GRAY', 'RED'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setFleetTierFilter(t)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          fleetTierFilter === t
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">App ID & Name</th>
                        <th className="px-4 py-3">Tier</th>
                        <th className="px-4 py-3">Security Score</th>
                        <th className="px-4 py-3">Wave</th>
                        <th className="px-4 py-3">Critical Findings & Recommendations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {fleetData.sample_applications
                        .filter((a) => fleetTierFilter === 'ALL' || a.tier === fleetTierFilter)
                        .map((app) => (
                          <tr key={app.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-3 font-mono font-medium text-white">
                              {app.id} <span className="text-slate-400">({app.name})</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                app.tier === 'GOLDEN' ? 'bg-emerald-500/20 text-emerald-300' :
                                app.tier === 'GRAY' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {app.tier}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              <span className={app.security_score >= 80 ? 'text-emerald-400' : app.security_score >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                                {app.security_score}/100
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono">Wave {app.wave}</td>
                            <td className="px-4 py-3 space-y-1">
                              <div className="text-slate-200">{app.recommendation}</div>
                              <div className="text-[10px] text-slate-400">
                                {app.critical_findings.join(' • ')}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PR DIFF & AUDIT TRAIL PREVIEW */}
          {activeTab === 'pr' && simulation && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-indigo-400" />
                    Automated Pull Request & Zero-Downtime Migration
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ready-to-merge branch generated with backward compatibility views and multi-wave diffs.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-400">Audit Certificate:</span>
                  <div className="text-xs font-mono font-bold text-indigo-400">{simulation.audit_trail_id}</div>
                </div>
              </div>

              {/* SQL Migration Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    1. Auto-Generated Non-Breaking SQL Migration (Shadow Column Pattern)
                  </span>
                  <span className="text-[10px] text-emerald-400">Zero Downtime Guaranteed</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  {simulation.generated_migration_sql}
                </pre>
              </div>

              {/* Unified Git Diff */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
                    2. Unified Git Pull Request Diff Preview
                  </span>
                  <span className="text-[10px] text-indigo-300">Wave 2 & Wave 3 Scoped Edits</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
                  {simulation.generated_pull_request_diff}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>ForgeHacks 2026 Modernization Suite • Ready for Live Demonstration</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Close Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

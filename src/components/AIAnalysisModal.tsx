import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  ShieldAlert,
  Target,
  Layers,
  Globe2,
  CheckCircle2,
} from 'lucide-react';
import { SignalSetup, Indicators, Timeframe } from '../types/trading';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: SignalSetup | undefined;
  indicators: Indicators | undefined;
  timeframe: Timeframe;
}

interface AIReport {
  summary: string;
  keyLevels: {
    immediateSupport: string;
    immediateResistance: string;
    invalidationLevel: string;
  };
  orderFlow: string;
  executionPlaybook: string[];
  macroContext: string;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  setup,
  indicators,
  timeframe,
}) => {
  const [report, setReport] = useState<AIReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAnalysis = async () => {
    if (!setup) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrice: setup.currentPrice,
          direction: setup.direction,
          confidenceScore: setup.confidenceScore,
          timeframe,
          reasons: setup.confidenceReasons,
          indicators,
        }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to get AI analysis:', err);
      setError(err?.message || 'Failed to generate AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report) {
      fetchAIAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0f1422] border border-purple-500/30 shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#171b30] via-[#131728] to-[#0f1422]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Institutional AI Scalping Intelligence
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  GEMINI POWERED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gold Desk Macro Synthesis • Order Flow Liquidity Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                Synthesizing multi-timeframe order flow & macro Gold drivers...
              </p>
              <p className="text-xs text-slate-500">
                Querying Google Gemini with live COMEX Gold ticks
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-center space-y-3">
              <p className="text-sm text-rose-300">{error}</p>
              <button
                onClick={fetchAIAnalysis}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Retry Analysis
              </button>
            </div>
          ) : report ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                  Institutional Desk Summary
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {report.summary}
                </p>
              </div>

              {/* Key Liquidity Levels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Immediate Support
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    ${report.keyLevels?.immediateSupport || '--'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Immediate Resistance
                  </span>
                  <span className="font-mono text-sm font-bold text-rose-400">
                    ${report.keyLevels?.immediateResistance || '--'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Invalidation Price
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    ${report.keyLevels?.invalidationLevel || '--'}
                  </span>
                </div>
              </div>

              {/* Order Flow & Liquidity */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Order Flow & Fair Value Gap Dynamics</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.orderFlow}
                </p>
              </div>

              {/* Tactical Scalper Execution Playbook */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Tactical Scalper Execution Playbook</span>
                </div>
                <div className="space-y-2">
                  {report.executionPlaybook?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Macro & Geopolitical Context */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-blue-300 uppercase tracking-wider">
                  <Globe2 className="w-4 h-4 text-blue-400" />
                  <span>Macroeconomic Drivers (DXY & US Real Yields)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {report.macroContext}
                </p>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#121827] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchAIAnalysis}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Debrief</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  History,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { SignalSetup } from '../types/trading';

interface SignalHistoryViewProps {
  history: SignalSetup[];
  onClear: () => void;
  currentPrice: number;
}

export const SignalHistoryView: React.FC<SignalHistoryViewProps> = ({
  history,
  onClear,
  currentPrice,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold text-white">Live Signal Session History</h2>
            <p className="text-xs text-slate-400">
              Audit log of real-time AI scalping setups detected during your active session
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-rose-400 hover:bg-rose-950/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-12 text-center text-slate-500">
          <p className="text-sm">No signals recorded yet in this session.</p>
          <p className="text-xs mt-1 text-slate-600">
            Signals generated on any timeframe will automatically log here with full audit levels.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {history.map((s) => {
            const isBuy = s.direction === 'BUY';
            const isSell = s.direction === 'SELL';
            const timeFormatted = new Date(s.generationTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={s.id}
                className="rounded-xl bg-[#0e121b] border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isSell
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isBuy && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {isSell && <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>{s.direction}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {s.timeframe}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{timeFormatted}</span>
                  </div>
                </div>

                {/* Levels */}
                <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Entry</span>
                    <span className="text-white font-bold">${s.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Stop Loss</span>
                    <span className="text-rose-400 font-bold">${s.stopLoss.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">TP1</span>
                    <span className="text-emerald-400 font-bold">${s.takeProfit1.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Confidence</span>
                    <span className="text-amber-300 font-bold">{s.confidenceScore}%</span>
                  </div>
                </div>

                {/* Reasons preview */}
                <div className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {s.confidenceReasons.join(' • ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

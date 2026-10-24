import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { Timeframe, TimeframeAnalysis } from '../types/trading';

interface MultiTimeframeTableProps {
  analyses: Record<Timeframe, TimeframeAnalysis> | undefined;
  selectedTf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  macroTrend: string;
}

const TF_WORKFLOW_MAP: Record<Timeframe, { purpose: string; weight: string; iconRole: string }> = {
  M1: { purpose: 'Scalp Entry Timing', weight: 'High (Trigger)', iconRole: 'M1 Trigger' },
  M5: { purpose: 'Setup Confirmation', weight: 'Critical (Primary)', iconRole: 'M5 Setup' },
  M15: { purpose: 'Market Structure & Orderflow', weight: 'High (Structure)', iconRole: 'M15 Struct' },
  M30: { purpose: 'Trading Zones & Liquidity', weight: 'Medium (Zones)', iconRole: 'M30 Zones' },
  H1: { purpose: 'Broader Intraday Trend', weight: 'High (Trend)', iconRole: 'H1 Trend' },
  H4: { purpose: 'Major Direction Anchor', weight: 'Critical (Anchor)', iconRole: 'H4 Anchor' },
  D1: { purpose: 'Major S/R & Key Levels', weight: 'Macro (Levels)', iconRole: 'D1 S/R' },
  W1: { purpose: 'Institutional Position Trend', weight: 'Macro (Long Term)', iconRole: 'W1 Context' },
  MN1: { purpose: 'Multi-Month Commodity Cycle', weight: 'Macro (Cycle)', iconRole: 'MN1 Cycle' },
};

const TF_ORDER: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'];

export const MultiTimeframeTable: React.FC<MultiTimeframeTableProps> = ({
  analyses,
  selectedTf,
  onSelectTf,
  macroTrend,
}) => {
  if (!analyses) return null;

  // Calculate weighted confirmation
  let bullWeight = 0;
  let bearWeight = 0;
  let totalWeight = 0;

  const weights: Record<Timeframe, number> = {
    H4: 25,
    H1: 20,
    M15: 15,
    M5: 20,
    M1: 10,
    M30: 5,
    D1: 3,
    W1: 1,
    MN1: 1,
  };

  TF_ORDER.forEach((tf) => {
    const item = analyses[tf];
    const w = weights[tf] || 5;
    totalWeight += w;
    if (item?.trend === 'BULLISH') bullWeight += w;
    else if (item?.trend === 'BEARISH') bearWeight += w;
  });

  const bullPercent = Math.round((bullWeight / totalWeight) * 100);
  const bearPercent = Math.round((bearWeight / totalWeight) * 100);
  const neutralPercent = 100 - bullPercent - bearPercent;

  return (
    <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-xl overflow-hidden">
      {/* Table Header & Confluence Summary */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e121a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Multi-Timeframe Confirmation Matrix (M1 – MN1)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Weighted cross-timeframe alignment engine enforcing institutional entry rules
            </p>
          </div>

          {/* Weighted Bias Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
                Weighted Market Bias
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs sm:text-sm font-bold font-mono ${
                    bullPercent > bearPercent && bullPercent >= 55
                      ? 'text-emerald-400'
                      : bearPercent > bullPercent && bearPercent >= 55
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {bullPercent > bearPercent && bullPercent >= 55
                    ? `BULLISH (${bullPercent}%)`
                    : bearPercent > bullPercent && bearPercent >= 55
                    ? `BEARISH (${bearPercent}%)`
                    : `MIXED / NEUTRAL`}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-300">Anchor: <strong className="text-white">{macroTrend}</strong></span>
              </div>
            </div>

            <div className="w-28 sm:w-36 h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${bullPercent}%` }} className="bg-emerald-500 h-full" title={`Bullish: ${bullPercent}%`} />
              <div style={{ width: `${neutralPercent}%` }} className="bg-slate-600 h-full" title={`Neutral: ${neutralPercent}%`} />
              <div style={{ width: `${bearPercent}%` }} className="bg-rose-500 h-full" title={`Bearish: ${bearPercent}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              <th className="py-3 px-3 sm:px-4">Timeframe</th>
              <th className="py-3 px-3 sm:px-4">Workflow Purpose</th>
              <th className="py-3 px-3 sm:px-4">Trend</th>
              <th className="py-3 px-3 sm:px-4">Signal</th>
              <th className="py-3 px-3 sm:px-4 hidden md:table-cell">EMA 9 / 21</th>
              <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">RSI (14)</th>
              <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Market Structure</th>
              <th className="py-3 px-3 sm:px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {TF_ORDER.map((tf) => {
              const row = analyses[tf];
              const isSelected = selectedTf === tf;
              const meta = TF_WORKFLOW_MAP[tf];
              const ind = row?.indicators;

              const isEmaBull = ind ? ind.ema9 > ind.ema21 : false;

              return (
                <tr
                  key={tf}
                  onClick={() => onSelectTf(tf)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 hover:bg-amber-500/15'
                      : 'hover:bg-slate-900/70'
                  }`}
                >
                  {/* Timeframe */}
                  <td className="py-3 px-3 sm:px-4 font-bold text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <span className="text-xs sm:text-sm">{tf}</span>
                  </td>

                  {/* Purpose */}
                  <td className="py-3 px-3 sm:px-4 font-sans text-slate-300">
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-white">{meta.purpose}</span>
                      <span className="text-[10px] text-slate-400">{meta.weight}</span>
                    </div>
                  </td>

                  {/* Trend */}
                  <td className="py-3 px-3 sm:px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        row?.trend === 'BULLISH'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : row?.trend === 'BEARISH'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row?.trend === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5" />}
                      {row?.trend === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5" />}
                      {row?.trend === 'NEUTRAL' && <Minus className="w-3.5 h-3.5" />}
                      <span>{row?.trend || 'NEUTRAL'}</span>
                    </span>
                  </td>

                  {/* Signal */}
                  <td className="py-3 px-3 sm:px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${
                        row?.signal === 'BUY'
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : row?.signal === 'SELL'
                          ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800/80 text-amber-300/80 border border-slate-700'
                      }`}
                    >
                      {row?.signal || 'WAIT'}
                    </span>
                  </td>

                  {/* EMA 9 / 21 */}
                  <td className="py-3 px-3 sm:px-4 hidden md:table-cell text-slate-300">
                    {ind ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className={isEmaBull ? 'text-emerald-400' : 'text-rose-400'}>
                          ${ind.ema9}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">${ind.ema21}</span>
                      </div>
                    ) : (
                      '--'
                    )}
                  </td>

                  {/* RSI */}
                  <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                    {ind ? (
                      <span
                        className={`text-xs font-bold ${
                          ind.rsi14 >= 70
                            ? 'text-amber-400'
                            : ind.rsi14 <= 30
                            ? 'text-blue-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {ind.rsi14}
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>

                  {/* Market Structure */}
                  <td className="py-3 px-3 sm:px-4 hidden lg:table-cell font-sans text-xs">
                    {ind?.structure ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            ind.structure.lastEvent.includes('BULL')
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ind.structure.lastEvent.includes('BEAR')
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ind.structure.lastEvent.replace('_', ' ')}
                        </span>
                      </div>
                    ) : (
                      '--'
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 sm:px-4 text-right">
                    <button
                      className={`px-2.5 py-1 text-[11px] rounded font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-black font-bold'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Analyze'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="p-3 sm:p-4 bg-[#090c12] border-t border-slate-800 flex items-start sm:items-center gap-2 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <p className="leading-relaxed">
          <strong>Scalping Rule:</strong> A simple majority of bullish or bearish timeframes is NOT sufficient alone for execution. You must have entry-timeframe confirmation (M5/M1) and acceptable spread conditions before placing orders.
        </p>
      </div>
    </div>
  );
};

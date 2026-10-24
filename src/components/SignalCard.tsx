import React from 'react';
import {
  ShieldAlert,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Layers,
  Activity,
  CheckCircle,
  HelpCircle,
  Calculator,
  Flame,
} from 'lucide-react';
import { SignalSetup, Timeframe } from '../types/trading';

interface SignalCardProps {
  setup: SignalSetup | undefined;
  currentPrice: number;
  selectedTf: Timeframe;
  onOpenAiAnalysis: () => void;
  onOpenRiskCalc: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  setup,
  currentPrice,
  selectedTf,
  onOpenAiAnalysis,
  onOpenRiskCalc,
}) => {
  if (!setup) {
    return (
      <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center text-slate-500">
          <Activity className="w-8 h-8 animate-pulse text-amber-500 mb-2" />
          <p className="text-sm">Calculating real-time multi-timeframe signals...</p>
        </div>
      </div>
    );
  }

  const isBuy = setup.direction === 'BUY';
  const isSell = setup.direction === 'SELL';
  const isWait = setup.direction === 'WAIT';

  const confidenceColor =
    setup.confidenceScore >= 75
      ? 'from-emerald-500 to-teal-400'
      : setup.confidenceScore >= 50
      ? 'from-amber-500 to-yellow-400'
      : 'from-slate-600 to-slate-500';

  const timeFormatted = new Date(setup.generationTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0f1422] to-[#090c13] border border-slate-800/90 shadow-xl overflow-hidden">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-slate-800/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              XAUUSD • {selectedTf}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeFormatted}</span>
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                setup.status === 'CONFIRMED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : setup.status === 'ACTIVE'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {setup.status === 'WAITING_CONFIRMATION' ? 'WAITING FOR CONFIRMATION' : setup.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiAnalysis}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 hover:from-purple-600/50 hover:to-blue-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>AI Intelligence Debrief</span>
            </button>
            <button
              onClick={onOpenRiskCalc}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Position Size</span>
            </button>
          </div>
        </div>

        {/* Signal Hero Banner */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left Signal Indicator */}
          <div className="md:col-span-5 flex items-center gap-4">
            <div
              className={`flex items-center justify-center px-6 py-4 rounded-2xl font-black text-2xl sm:text-3xl tracking-wider shadow-lg ${
                isBuy
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-emerald-500/10'
                  : isSell
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-rose-500/10'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-amber-500/10'
              }`}
            >
              {isBuy && <ArrowUpRight className="w-7 h-7 sm:w-8 sm:h-8 mr-2 stroke-[3]" />}
              {isSell && <ArrowDownRight className="w-7 h-7 sm:w-8 sm:h-8 mr-2 stroke-[3]" />}
              {isWait && <Flame className="w-6 h-6 mr-2 text-amber-400" />}
              <span>{setup.direction}</span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Setup Direction
              </p>
              <p className="text-sm font-semibold text-white">
                {isBuy
                  ? 'Bullish Scalp Entry'
                  : isSell
                  ? 'Bearish Scalp Entry'
                  : 'No Trade / Neutral Structure'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Macro Trend (H4/H1):</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    setup.higherTimeframeTrend === 'BULLISH'
                      ? 'text-emerald-400'
                      : setup.higherTimeframeTrend === 'BEARISH'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {setup.higherTimeframeTrend}
                </span>
              </div>
            </div>
          </div>

          {/* Center AI Setup Confidence Gauge */}
          <div className="md:col-span-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Setup Confidence</span>
              </span>
              <span className="font-mono font-bold text-sm text-white">
                {setup.confidenceScore}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${confidenceColor} transition-all duration-700`}
                style={{ width: `${setup.confidenceScore}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>Low (0%)</span>
              <span>Confluence Quality: {setup.confidenceScore >= 75 ? 'HIGH' : setup.confidenceScore >= 50 ? 'MODERATE' : 'OBSERVE'}</span>
              <span>100%</span>
            </div>
          </div>

          {/* Right Market Condition Badges */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Spread</span>
              <span
                className={`font-bold ${
                  setup.spreadStatus === 'TIGHT'
                    ? 'text-emerald-400'
                    : setup.spreadStatus === 'WIDE'
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                ${setup.spread.toFixed(2)} ({setup.spreadStatus})
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase block">Volatility (ATR)</span>
              <span className="font-bold text-amber-300">
                ${setup.volatilityValue.toFixed(2)} ({setup.marketVolatility})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Levels Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[#0a0d15]">
        {/* Entry Price */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Potential Entry</span>
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-white">
            ${setup.entryPrice.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Current Market Price</span>
        </div>

        {/* Stop Loss */}
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium mb-1">
            <span>Stop Loss (SL)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-rose-400">
            ${setup.stopLoss.toFixed(2)}
          </p>
          <span className="text-[10px] text-rose-300/80">
            Δ ${Math.abs(setup.entryPrice - setup.stopLoss).toFixed(2)} Risk Buffer
          </span>
        </div>

        {/* Take Profit 1 */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
            <span>Target 1 (TP1)</span>
            <span className="text-[10px] font-mono font-bold px-1 rounded bg-emerald-500/20">1:1</span>
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-emerald-400">
            ${setup.takeProfit1.toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-300/80">
            +${Math.abs(setup.takeProfit1 - setup.entryPrice).toFixed(2)} Target
          </span>
        </div>

        {/* Take Profit 2 */}
        <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-800/40">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
            <span>Target 2 (TP2)</span>
            <span className="text-[10px] font-mono font-bold px-1 rounded bg-emerald-500/20">1:2</span>
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-emerald-400">
            ${setup.takeProfit2.toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-300/80">
            +${Math.abs(setup.takeProfit2 - setup.entryPrice).toFixed(2)} Primary Target
          </span>
        </div>

        {/* Take Profit 3 */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-700/40">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-medium mb-1">
            <span>Target 3 (TP3)</span>
            <span className="text-[10px] font-mono font-bold px-1 rounded bg-emerald-500/20">1:3</span>
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-emerald-400">
            ${setup.takeProfit3.toFixed(2)}
          </p>
          <span className="text-[10px] text-emerald-300/80">
            +${Math.abs(setup.takeProfit3 - setup.entryPrice).toFixed(2)} Runner
          </span>
        </div>

        {/* Risk-to-Reward Ratio */}
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <div className="flex items-center justify-between text-amber-300 text-xs font-medium mb-1">
            <span>Risk / Reward</span>
            <Layers className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="font-mono text-base sm:text-lg font-bold text-amber-400">
            1 : {setup.riskReward.toFixed(1)}
          </p>
          <span className="text-[10px] text-amber-300/80">
            Rec Lot: {setup.riskSettings.recommendedLotSize}
          </span>
        </div>
      </div>

      {/* AI Signal Generation Rationale Breakdown */}
      <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-[#0c1018]">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Why this signal was generated (Verified Confluence)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {setup.confidenceReasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{reason}</span>
            </div>
          ))}
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/50 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>
              All prices calculated from COMEX Gold live candles. AI Confidence reflects verified technical conditions, not a guaranteed win rate.
            </span>
          </span>
          <span className="font-mono text-slate-400">
            Safety Buffer: ATR x 1.2 • Floor Pivots & Swing High/Low Anchored
          </span>
        </div>
      </div>
    </div>
  );
};

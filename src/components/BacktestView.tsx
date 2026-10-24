import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Play,
  RotateCcw,
  ShieldAlert,
  Percent,
  DollarSign,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Timeframe, BacktestResult, RiskManagementConfig } from '../types/trading';

interface BacktestViewProps {
  initialTimeframe: Timeframe;
  config: RiskManagementConfig;
}

export const BacktestView: React.FC<BacktestViewProps> = ({ initialTimeframe, config }) => {
  const [selectedTf, setSelectedTf] = useState<Timeframe>(
    ['M1', 'M5', 'M15', 'M30', 'H1'].includes(initialTimeframe) ? initialTimeframe : 'M5'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [riskPercent, setRiskPercent] = useState(config.riskPercentage || 1.0);
  const [rrTarget, setRrTarget] = useState(config.rrTarget || 2.0);

  const runSimulation = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/market/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeframe: selectedTf,
          config: {
            ...config,
            riskPercentage: riskPercent,
            rrTarget,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BacktestResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Backtest error:', err);
      setError(err?.message || 'Backtest failed to execute');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Simulation Controls Card */}
      <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Historical Quantitative Backtesting Engine
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simulates verified signal logic across actual historical XAUUSD candles with spread and commission friction
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {(['M1', 'M5', 'M15', 'M30', 'H1'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTf(tf)}
                  className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                    selectedTf === tf
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={runSimulation}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isRunning ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-black" />
              )}
              <span>{isRunning ? 'Calculating Strategy...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>

        {/* Backtest Parameters */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              Starting Balance
            </span>
            <span className="text-sm font-bold text-white">
              ${config.accountBalance.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              Risk Per Trade
            </span>
            <span className="text-sm font-bold text-amber-300">
              {riskPercent}% (${((config.accountBalance * riskPercent) / 100).toFixed(0)})
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              Target Risk:Reward
            </span>
            <span className="text-sm font-bold text-emerald-400">1 : {rrTarget}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block font-sans">
              Spread & Cost Assumption
            </span>
            <span className="text-sm font-bold text-slate-300">$0.30 / oz</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Results View */}
      {result ? (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Total Trades
              </span>
              <p className="font-mono text-xl font-bold text-white mt-1">
                {result.totalTrades}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                {result.winningTrades}W / {result.losingTrades}L
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Win Rate
              </span>
              <p
                className={`font-mono text-xl font-bold mt-1 ${
                  result.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.winRate}%
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Historical hit rate
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Profit Factor
              </span>
              <p
                className={`font-mono text-xl font-bold mt-1 ${
                  result.profitFactor >= 1.5
                    ? 'text-emerald-400'
                    : result.profitFactor >= 1.0
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {result.profitFactor}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Gross Win / Loss
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Max Drawdown
              </span>
              <p className="font-mono text-xl font-bold text-rose-400 mt-1">
                {result.maxDrawdown}%
              </p>
              <span className="text-[10px] text-rose-300/80 font-mono">
                -${result.maxDrawdownUSD}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Net Profit (After Costs)
              </span>
              <p
                className={`font-mono text-xl font-bold mt-1 ${
                  result.netProfitUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfitUSD >= 0 ? '+' : ''}${result.netProfitUSD}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                Spread: -${result.spreadCommissionDeducted}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Avg Risk:Reward
              </span>
              <p className="font-mono text-xl font-bold text-amber-300 mt-1">
                1 : {result.avgRiskReward}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                TP Target Anchor
              </span>
            </div>
          </div>

          {/* Equity Curve SVG Chart */}
          {result.equityCurve.length > 1 && (
            <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Simulated Account Equity Curve
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {result.equityCurve.length} Trade Points
                </span>
              </div>

              <div className="w-full h-44 bg-[#07090e] rounded-xl p-2 border border-slate-900">
                <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
                  {(() => {
                    const equities = result.equityCurve.map((p) => p.equity);
                    const minEq = Math.min(...equities) * 0.99;
                    const maxEq = Math.max(...equities) * 1.01;
                    const range = maxEq - minEq || 100;

                    const points = result.equityCurve
                      .map((p, i) => {
                        const x = (i / (result.equityCurve.length - 1)) * 580 + 10;
                        const y = 110 - ((p.equity - minEq) / range) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ');

                    return (
                      <polyline
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Trade Journal Table */}
          <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-[#0e121a] flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Trade Execution Journal ({result.trades.length} Closed Trades)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                No Look-Ahead Bias • Spread Adjusted
              </span>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Entry Time</th>
                    <th className="py-2.5 px-3">Entry Price</th>
                    <th className="py-2.5 px-3">Exit Price</th>
                    <th className="py-2.5 px-3">Exit Reason</th>
                    <th className="py-2.5 px-3">Net PnL ($)</th>
                    <th className="py-2.5 px-3">Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {result.trades.map((t, idx) => {
                    const isWin = t.status === 'WIN';
                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 text-slate-500">{result.trades.length - idx}</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                              t.direction === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {t.direction === 'BUY' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>{t.direction}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(t.entryTime).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3">${t.entryPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3">${t.exitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              t.exitReason.includes('TP')
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {t.exitReason}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 font-bold ${
                            isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                        </td>
                        <td
                          className={`py-2.5 px-3 font-semibold ${
                            isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isWin ? '+' : ''}
                          {t.pnlPercent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-12 text-center text-slate-500">
          <p className="text-sm">
            Select a timeframe above and click <strong>"Run Simulation"</strong> to backtest the strategy against real historical Gold candles.
          </p>
        </div>
      )}

      {/* Mandatory Regulatory & Risk Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong>Historical Disclaimer:</strong> Past performance backtested on historical candles is simulated for quantitative evaluation and does not guarantee future live trading profits. Always execute proper risk management and never risk more than 1–2% per trade.
        </p>
      </div>
    </div>
  );
};

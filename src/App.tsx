import React, { useState } from 'react';
import { useMarketData } from './hooks/useMarketData';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Navbar } from './components/Navbar';
import { SignalCard } from './components/SignalCard';
import { MultiTimeframeTable } from './components/MultiTimeframeTable';
import { InteractiveChart } from './components/InteractiveChart';
import { RiskCalculatorModal } from './components/RiskCalculatorModal';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { BacktestView } from './components/BacktestView';
import { SignalHistoryView } from './components/SignalHistoryView';
import { SettingsModal } from './components/SettingsModal';
import {
  Flame,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
  WifiOff,
  AlertTriangle,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { Timeframe } from './types/trading';

export default function App() {
  const {
    data,
    isLoading,
    isRefreshing,
    error,
    selectedTf,
    setSelectedTf,
    tickDirection,
    signalHistory,
    clearSignalHistory,
    riskConfig,
    saveRiskConfig,
    refetch,
  } = useMarketData();

  const isOnline = useOnlineStatus();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'signals' | 'chart' | 'timeframes' | 'backtest' | 'history'
  >('dashboard');

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const currentAnalysis = data?.analyses?.[selectedTf];
  const activeSetup = data?.activeSetup;
  const currentPrice = data?.price || 0;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-amber-500/25 selection:text-amber-200">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-600 text-black px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — Displaying cached XAUUSD market snapshot</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        data={data}
        selectedTf={selectedTf}
        onSelectTf={setSelectedTf}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
        soundAlerts={riskConfig.soundAlerts}
        onToggleSound={() => saveRiskConfig({ soundAlerts: !riskConfig.soundAlerts })}
        onOpenRiskCalc={() => setIsRiskModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        tickDirection={tickDirection}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-5">
        {/* Market Stats Quick Ribbon */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Bid / Ask</span>
              <span className="text-white font-bold">
                ${data.bid.toFixed(2)} / ${data.ask.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Spread</span>
              <span className="text-emerald-400 font-bold">
                ${data.spread.toFixed(2)} ({data.activeSetup.spreadStatus})
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">24h High / Low</span>
              <span className="text-slate-200 font-bold">
                ${data.high24h.toFixed(1)} / ${data.low24h.toFixed(1)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">24h Change</span>
              <span className={`font-bold ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {data.change >= 0 ? '+' : ''}${data.change.toFixed(2)} ({data.change >= 0 ? '+' : ''}
                {data.changePercent.toFixed(2)}%)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Macro Trend (H4)</span>
              <span
                className={`font-bold ${
                  data.macroTrend === 'BULLISH'
                    ? 'text-emerald-400'
                    : data.macroTrend === 'BEARISH'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {data.macroTrend}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b0e14] border border-slate-800/80 flex flex-col justify-center">
              <span className="text-[10px] text-slate-400 font-sans uppercase">Feed Source</span>
              <span className="text-slate-300 font-medium truncate" title={data.provider}>
                COMEX Gold (GC=F)
              </span>
            </div>
          </div>
        )}

        {/* Global Loading Spinner */}
        {isLoading && !data && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-amber-400 font-bold">
                AU
              </div>
            </div>
            <p className="text-sm font-medium text-slate-300">
              Connecting to COMEX Gold real-time market feed...
            </p>
            <p className="text-xs text-slate-500">
              Synthesizing 9 timeframe candle structures (M1 – MN1)
            </p>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={refetch}
              className="px-3 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-white font-semibold"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* View Tab 1: Dashboard */}
        {activeTab === 'dashboard' && data && (
          <div className="space-y-5">
            {/* Primary Signal Hero Card */}
            <SignalCard
              setup={activeSetup}
              currentPrice={currentPrice}
              selectedTf={selectedTf}
              onOpenAiAnalysis={() => setIsAiModalOpen(true)}
              onOpenRiskCalc={() => setIsRiskModalOpen(true)}
            />

            {/* Quick Chart */}
            <InteractiveChart
              candles={currentAnalysis?.candles || []}
              timeframe={selectedTf}
              onSelectTf={setSelectedTf}
              indicators={currentAnalysis?.indicators}
              setup={activeSetup}
              currentPrice={currentPrice}
            />

            {/* Multi-Timeframe Confirmation Matrix */}
            <MultiTimeframeTable
              analyses={data.analyses}
              selectedTf={selectedTf}
              onSelectTf={setSelectedTf}
              macroTrend={data.macroTrend}
            />
          </div>
        )}

        {/* View Tab 2: Live Setup Deep Breakdown */}
        {activeTab === 'signals' && data && (
          <div className="space-y-5">
            <SignalCard
              setup={activeSetup}
              currentPrice={currentPrice}
              selectedTf={selectedTf}
              onOpenAiAnalysis={() => setIsAiModalOpen(true)}
              onOpenRiskCalc={() => setIsRiskModalOpen(true)}
            />

            {/* In-depth Indicator Breakdown for Selected Timeframe */}
            {currentAnalysis && (
              <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-white">
                      {selectedTf} Quantitative Technical Indicators
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Signal: {currentAnalysis.signal}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      EMA 9 (Fast)
                    </span>
                    <span className="text-base font-bold text-cyan-400">
                      ${currentAnalysis.indicators.ema9}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      EMA 21 (Slow)
                    </span>
                    <span className="text-base font-bold text-amber-400">
                      ${currentAnalysis.indicators.ema21}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      RSI (14 Wilder's)
                    </span>
                    <span
                      className={`text-base font-bold ${
                        currentAnalysis.indicators.rsi14 >= 70
                          ? 'text-rose-400'
                          : currentAnalysis.indicators.rsi14 <= 30
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {currentAnalysis.indicators.rsi14}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Institutional VWAP
                    </span>
                    <span className="text-base font-bold text-purple-400">
                      ${currentAnalysis.indicators.vwap}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      ATR (14 Volatility)
                    </span>
                    <span className="text-base font-bold text-slate-200">
                      ${currentAnalysis.indicators.atr14}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Market Structure Event
                    </span>
                    <span className="text-base font-bold text-emerald-400">
                      {currentAnalysis.indicators.structure.lastEvent.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Candle Pattern
                    </span>
                    <span className="text-base font-bold text-amber-300">
                      {currentAnalysis.indicators.candlePattern.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block font-sans">
                      Floor Pivot (PP)
                    </span>
                    <span className="text-base font-bold text-slate-300">
                      ${currentAnalysis.indicators.pivots.pp}
                    </span>
                  </div>
                </div>

                {/* Classical Pivots Ladder */}
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Session Floor Pivot Points (Floor Levels)
                  </span>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-mono">
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-900/30">
                      <span className="text-[10px] text-rose-400 block font-bold">R3</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.r3}</span>
                    </div>
                    <div className="p-2 rounded bg-rose-950/20 border border-rose-900/20">
                      <span className="text-[10px] text-rose-400 block font-bold">R2</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.r2}</span>
                    </div>
                    <div className="p-2 rounded bg-rose-950/10 border border-rose-900/10">
                      <span className="text-[10px] text-rose-400 block font-bold">R1</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.r1}</span>
                    </div>
                    <div className="p-2 rounded bg-amber-500/15 border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 block font-bold">PP</span>
                      <span className="text-amber-300 font-bold">
                        ${currentAnalysis.indicators.pivots.pp}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-emerald-950/10 border border-emerald-900/10">
                      <span className="text-[10px] text-emerald-400 block font-bold">S1</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.s1}</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/20">
                      <span className="text-[10px] text-emerald-400 block font-bold">S2</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.s2}</span>
                    </div>
                    <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/30">
                      <span className="text-[10px] text-emerald-400 block font-bold">S3</span>
                      <span className="text-slate-200">${currentAnalysis.indicators.pivots.s3}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Tab 3: Charts */}
        {activeTab === 'chart' && data && (
          <div className="space-y-4">
            <InteractiveChart
              candles={currentAnalysis?.candles || []}
              timeframe={selectedTf}
              onSelectTf={setSelectedTf}
              indicators={currentAnalysis?.indicators}
              setup={activeSetup}
              currentPrice={currentPrice}
            />
          </div>
        )}

        {/* View Tab 4: All Timeframes Matrix */}
        {activeTab === 'timeframes' && data && (
          <div className="space-y-4">
            <MultiTimeframeTable
              analyses={data.analyses}
              selectedTf={selectedTf}
              onSelectTf={setSelectedTf}
              macroTrend={data.macroTrend}
            />

            {/* Scalper Multi-Timeframe Workflow Guide */}
            <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Institutional XAUUSD Multi-Timeframe Scalping Framework
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-amber-400 font-bold font-mono">
                    <span>H4 + H1</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">
                      Major Trend
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Determines broader market direction. Never take counter-trend scalps when H4/H1 trend is strongly opposing.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-blue-400 font-bold font-mono">
                    <span>M30 + M15</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20">
                      Structure & Zones
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Identifies key Order Blocks, Fair Value Gaps (FVG), and Break of Structure (BOS) supply/demand zones.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400 font-bold font-mono">
                    <span>M5</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">
                      Setup Confirmation
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Primary scalping decision chart. Confirms EMA 9/21 cross, RSI momentum acceleration, and price rejection.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-purple-400 font-bold font-mono">
                    <span>M1</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20">
                      Entry Timing
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Micro-timing execution. Refines tight stop loss entry with minimal drawdown on gold price swings.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold font-mono">
                    <span>D1 + W1 + MN1</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">
                      Macro Liquidity
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Major daily and weekly support/resistance anchors. Prevents scalping directly into heavy institutional sell walls or historical all-time high barriers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Tab 5: Backtest */}
        {activeTab === 'backtest' && (
          <BacktestView initialTimeframe={selectedTf} config={riskConfig} />
        )}

        {/* View Tab 6: History */}
        {activeTab === 'history' && (
          <SignalHistoryView
            history={signalHistory}
            onClear={clearSignalHistory}
            currentPrice={currentPrice}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#07090e] py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">XAUUSD Scalping AI Pro</span>
            <span>•</span>
            <span>All-Timeframe Precision Engine</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Gold Spot Benchmark: COMEX CME (GC=F) • Demo Analysis Mode
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RiskCalculatorModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        setup={activeSetup}
        config={riskConfig}
        onSaveConfig={saveRiskConfig}
      />

      <AIAnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        setup={activeSetup}
        indicators={currentAnalysis?.indicators}
        timeframe={selectedTf}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={riskConfig}
        onSaveConfig={saveRiskConfig}
      />
    </div>
  );
}

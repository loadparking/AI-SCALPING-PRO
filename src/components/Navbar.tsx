import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Calculator,
  History,
  LineChart,
  Grid,
  Radio,
  Zap,
} from 'lucide-react';
import { MarketDataResponse, Timeframe } from '../types/trading';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  data: MarketDataResponse | null;
  selectedTf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  activeTab: 'dashboard' | 'signals' | 'chart' | 'timeframes' | 'backtest' | 'history';
  onSelectTab: (tab: 'dashboard' | 'signals' | 'chart' | 'timeframes' | 'backtest' | 'history') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  soundAlerts: boolean;
  onToggleSound: () => void;
  onOpenRiskCalc: () => void;
  onOpenSettings: () => void;
  tickDirection: 'UP' | 'DOWN' | 'NEUTRAL';
}

const TIMEFRAMES: { tf: Timeframe; label: string; role: string }[] = [
  { tf: 'M1', label: '1m', role: 'Entry Timing' },
  { tf: 'M5', label: '5m', role: 'Setup Conf.' },
  { tf: 'M15', label: '15m', role: 'Structure' },
  { tf: 'M30', label: '30m', role: 'Zones' },
  { tf: 'H1', label: '1h', role: 'Macro Trend' },
  { tf: 'H4', label: '4h', role: 'Trend Anchor' },
  { tf: 'D1', label: 'D1', role: 'Major S/R' },
  { tf: 'W1', label: 'W1', role: 'Macro Key' },
  { tf: 'MN1', label: 'MN', role: 'Cycle' },
];

export const Navbar: React.FC<NavbarProps> = ({
  data,
  selectedTf,
  onSelectTf,
  activeTab,
  onSelectTab,
  isRefreshing,
  onRefresh,
  soundAlerts,
  onToggleSound,
  onOpenRiskCalc,
  onOpenSettings,
  tickDirection,
}) => {
  const price = data?.price ?? 0;
  const isPositive = (data?.change ?? 0) >= 0;

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      {/* Top Banner: Price Ticker & Global Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-700 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-[#0b0e14] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200">
                  AU
                </span>
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1">
                  XAUUSD <span className="text-amber-400 font-extrabold text-[10px] sm:text-xs px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">SCALPING AI</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                All-Timeframe Precision Signal Engine
              </p>
            </div>
          </div>

          {/* Center: Live Price Pill */}
          <div className="flex items-center gap-2 sm:gap-4 px-2.5 py-1 rounded-xl bg-[#0e121b] border border-slate-800/80 shadow-inner">
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                Spot Gold (USD)
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`font-mono text-xs sm:text-base font-extrabold transition-colors duration-300 ${
                    tickDirection === 'UP'
                      ? 'text-emerald-400'
                      : tickDirection === 'DOWN'
                      ? 'text-rose-400'
                      : 'text-white'
                  }`}
                >
                  ${price > 0 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---.--'}
                </span>
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden xs:block" />

            <div className="hidden xs:flex flex-col text-left font-mono text-[10px]">
              <span className={isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {isPositive ? '+' : ''}
                {data?.change ? data.change.toFixed(2) : '0.00'} ({isPositive ? '+' : ''}
                {data?.changePercent ? data.changePercent.toFixed(2) : '0.00'}%)
              </span>
              <span className="text-[9px] text-slate-400">
                Spread: <strong className="text-slate-300">${data?.spread ? data.spread.toFixed(2) : '0.25'}</strong>
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleSound}
              className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                soundAlerts
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : 'text-slate-400 border-slate-800 bg-slate-900/40 hover:text-white'
              }`}
              title={soundAlerts ? 'Sound Alerts: Active' : 'Sound Alerts: Muted'}
            >
              {soundAlerts ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              title="Refresh Live Market Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={onOpenRiskCalc}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              title="Risk & Position Size Calculator"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span>Risk Calc</span>
            </button>

            <PWAInstallButton />

            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              title="App Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Second Row: Timeframe Switcher & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-2 gap-2 border-t border-slate-800/40 pt-2">
          {/* Timeframe Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1 shrink-0 hidden lg:inline">
              TF:
            </span>
            {TIMEFRAMES.map((item) => {
              const isSelected = selectedTf === item.tf;
              return (
                <button
                  key={item.tf}
                  onClick={() => onSelectTf(item.tf)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-sm shadow-amber-500/20'
                      : 'text-slate-300 bg-slate-900/70 border border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`${item.tf} (${item.role})`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Navigation Views */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onSelectTab('signals')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'signals'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Setup</span>
            </button>

            <button
              onClick={() => onSelectTab('chart')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'chart'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Charts</span>
            </button>

            <button
              onClick={() => onSelectTab('timeframes')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'timeframes'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Matrix</span>
            </button>

            <button
              onClick={() => onSelectTab('backtest')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'backtest'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
              <span>Backtest</span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>History</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import {
  Candle,
  Timeframe,
  SignalSetup,
  Indicators,
} from '../types/trading';
import {
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  ExternalLink,
  Target,
  ShieldAlert,
  Flame,
  Info,
} from 'lucide-react';

interface InteractiveChartProps {
  candles: Candle[];
  timeframe: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
  indicators: Indicators | undefined;
  setup: SignalSetup | undefined;
  currentPrice: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  candles,
  timeframe,
  onSelectTf,
  indicators,
  setup,
  currentPrice,
}) => {
  const [chartMode, setChartMode] = useState<'smart' | 'tradingview'>('smart');
  const [showEMAs, setShowEMAs] = useState(true);
  const [showVWAP, setShowVWAP] = useState(true);
  const [showFVG, setShowFVG] = useState(true);
  const [showLevels, setShowLevels] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // We display the last 60-80 candles for crisp scalping visibility
  const visibleCandles = useMemo(() => {
    return candles.slice(-60);
  }, [candles]);

  // Compute scale min/max
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { minPrice: currentPrice - 5, maxPrice: currentPrice + 5, priceRange: 10 };
    }
    let min = Math.min(...visibleCandles.map((c) => c.low));
    let max = Math.max(...visibleCandles.map((c) => c.high));

    // Pad slightly
    if (setup && showLevels) {
      min = Math.min(min, setup.stopLoss, setup.takeProfit1, setup.takeProfit3);
      max = Math.max(max, setup.stopLoss, setup.takeProfit1, setup.takeProfit3);
    }
    const pad = (max - min) * 0.08 || 2;
    min -= pad;
    max += pad;
    return { minPrice: min, maxPrice: max, priceRange: max - min };
  }, [visibleCandles, setup, showLevels, currentPrice]);

  // Coordinate mapping
  const chartHeight = 360;
  const chartWidth = 800; // viewBox width

  const getY = (val: number) => {
    if (priceRange === 0) return chartHeight / 2;
    return chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = visibleCandles.length > 0 ? (chartWidth - 80) / visibleCandles.length : 10;

  // TradingView Interval mapping
  const tvInterval = useMemo(() => {
    switch (timeframe) {
      case 'M1':
        return '1';
      case 'M5':
        return '5';
      case 'M15':
        return '15';
      case 'M30':
        return '30';
      case 'H1':
        return '60';
      case 'H4':
        return '240';
      case 'D1':
        return 'D';
      case 'W1':
        return 'W';
      case 'MN1':
        return 'M';
      default:
        return '5';
    }
  }, [timeframe]);

  return (
    <div className="rounded-2xl bg-[#0b0e14] border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Chart Top Toolbar */}
      <div className="p-3 sm:p-4 bg-[#0e121a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              onClick={() => setChartMode('smart')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartMode === 'smart'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Smart Chart
            </button>
            <button
              onClick={() => setChartMode('tradingview')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartMode === 'tradingview'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TradingView Live
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-slate-300 hidden sm:inline">
            XAUUSD • {timeframe}
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline">
            Source: COMEX Gold Continuous Contract
          </span>
        </div>

        {/* Indicator Toggles (Active in Smart Mode) */}
        {chartMode === 'smart' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setShowEMAs(!showEMAs)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showEMAs
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              EMA 9/21
            </button>

            <button
              onClick={() => setShowVWAP(!showVWAP)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showVWAP
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              VWAP
            </button>

            <button
              onClick={() => setShowFVG(!showFVG)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showFVG
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              FVG Zones
            </button>

            <button
              onClick={() => setShowLevels(!showLevels)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                showLevels
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              Entry/SL/TP
            </button>
          </div>
        )}
      </div>

      {/* Main Chart Body */}
      <div className="relative w-full h-[400px] sm:h-[460px] bg-[#07090e] select-none" ref={containerRef}>
        {chartMode === 'tradingview' ? (
          <div className="w-full h-full">
            <iframe
              title="TradingView XAUUSD Chart"
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=OANDA%3AXAUUSD&interval=${tvInterval}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=07090e&studies=%5B%22EMA%40tv-basicstudies%22%2C%22RSI%40tv-basicstudies%22%5D&theme=dark&style=1&timezone=exchange&withdateranges=1&showpopupbutton=1`}
              className="w-full h-full border-none"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative w-full h-full p-2">
            {/* Hover Tooltip Header */}
            <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800/80 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-amber-400 font-bold">XAUUSD {timeframe}</span>
              {hoveredCandle ? (
                <>
                  <span className="text-slate-400">
                    O: <strong className="text-white">${hoveredCandle.open}</strong>
                  </span>
                  <span className="text-slate-400">
                    H: <strong className="text-emerald-400">${hoveredCandle.high}</strong>
                  </span>
                  <span className="text-slate-400">
                    L: <strong className="text-rose-400">${hoveredCandle.low}</strong>
                  </span>
                  <span className="text-slate-400">
                    C: <strong className="text-white">${hoveredCandle.close}</strong>
                  </span>
                  <span className="text-slate-400">
                    Vol: <strong className="text-slate-300">{hoveredCandle.volume}</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-slate-400">
                    Price: <strong className="text-white">${currentPrice}</strong>
                  </span>
                  {indicators && (
                    <>
                      <span className="text-cyan-400">EMA9: ${indicators.ema9}</span>
                      <span className="text-amber-400">EMA21: ${indicators.ema21}</span>
                      <span className="text-purple-400">VWAP: ${indicators.vwap}</span>
                      <span className="text-slate-300">RSI: {indicators.rsi14}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* SVG Candlestick Canvas */}
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * chartWidth;
                const y = ((e.clientY - rect.top) / rect.height) * chartHeight;
                setMousePos({ x, y });

                const index = Math.floor(x / candleWidth);
                if (index >= 0 && index < visibleCandles.length) {
                  setHoveredCandle(visibleCandles[index]);
                }
              }}
              onMouseLeave={() => {
                setHoveredCandle(null);
                setMousePos(null);
              }}
            >
              <defs>
                <linearGradient id="bullFvgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="bearFvgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                const y = chartHeight * ratio;
                const priceAtY = (maxPrice - (ratio * priceRange)).toFixed(2);
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartWidth - 65}
                      y2={y}
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={chartWidth - 60}
                      y={y + 4}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      ${priceAtY}
                    </text>
                  </g>
                );
              })}

              {/* Fair Value Gaps (FVG) */}
              {showFVG &&
                indicators?.fvgList.map((fvg, i) => {
                  const yTop = getY(fvg.top);
                  const yBottom = getY(fvg.bottom);
                  const height = Math.max(2, Math.abs(yBottom - yTop));
                  const y = Math.min(yTop, yBottom);
                  return (
                    <g key={`fvg-${i}`}>
                      <rect
                        x="30"
                        y={y}
                        width={chartWidth - 100}
                        height={height}
                        fill={fvg.type === 'BULLISH' ? 'url(#bullFvgGrad)' : 'url(#bearFvgGrad)'}
                        stroke={fvg.type === 'BULLISH' ? '#22c55e' : '#ef4444'}
                        strokeWidth="0.75"
                        strokeDasharray="2,2"
                        opacity={fvg.mitigated ? 0.35 : 0.8}
                      />
                      <text
                        x="35"
                        y={y + 9}
                        fill={fvg.type === 'BULLISH' ? '#4ade80' : '#f87171'}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {fvg.type === 'BULLISH' ? '+FVG (Demand)' : '-FVG (Supply)'}
                      </text>
                    </g>
                  );
                })}

              {/* Candlesticks */}
              {visibleCandles.map((c, i) => {
                const x = i * candleWidth + candleWidth * 0.15;
                const width = Math.max(2, candleWidth * 0.7);
                const isGreen = c.close >= c.open;
                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);
                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x + width / 2}
                      y1={yHigh}
                      x2={x + width / 2}
                      y2={yLow}
                      stroke={isGreen ? '#22c55e' : '#ef4444'}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x}
                      y={bodyTop}
                      width={width}
                      height={bodyHeight}
                      rx="1"
                      fill={isGreen ? '#22c55e' : '#ef4444'}
                    />
                  </g>
                );
              })}

              {/* VWAP Overlay Line */}
              {showVWAP && indicators && (
                <g>
                  <line
                    x1="0"
                    y1={getY(indicators.vwap)}
                    x2={chartWidth - 65}
                    y2={getY(indicators.vwap)}
                    stroke="#a855f7"
                    strokeWidth="1.5"
                    strokeDasharray="5,3"
                  />
                  <text
                    x={chartWidth - 60}
                    y={getY(indicators.vwap) + 3}
                    fill="#a855f7"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    VWAP
                  </text>
                </g>
              )}

              {/* Entry / Stop Loss / TP Levels */}
              {showLevels && setup && (
                <g>
                  {/* Entry Line */}
                  <line
                    x1="0"
                    y1={getY(setup.entryPrice)}
                    x2={chartWidth - 65}
                    y2={getY(setup.entryPrice)}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="6,4"
                  />
                  <text
                    x={chartWidth - 60}
                    y={getY(setup.entryPrice) + 3}
                    fill="#60a5fa"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ENTRY ${setup.entryPrice}
                  </text>

                  {/* Stop Loss Line */}
                  <line
                    x1="0"
                    y1={getY(setup.stopLoss)}
                    x2={chartWidth - 65}
                    y2={getY(setup.stopLoss)}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={chartWidth - 60}
                    y={getY(setup.stopLoss) + 3}
                    fill="#f87171"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    SL ${setup.stopLoss}
                  </text>

                  {/* TP1 Line */}
                  <line
                    x1="0"
                    y1={getY(setup.takeProfit1)}
                    x2={chartWidth - 65}
                    y2={getY(setup.takeProfit1)}
                    stroke="#10b981"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={chartWidth - 60}
                    y={getY(setup.takeProfit1) + 3}
                    fill="#34d399"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    TP1 ${setup.takeProfit1}
                  </text>

                  {/* TP2 Line */}
                  <line
                    x1="0"
                    y1={getY(setup.takeProfit2)}
                    x2={chartWidth - 65}
                    y2={getY(setup.takeProfit2)}
                    stroke="#10b981"
                    strokeWidth="1.5"
                  />
                  <text
                    x={chartWidth - 60}
                    y={getY(setup.takeProfit2) + 3}
                    fill="#10b981"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    TP2 ${setup.takeProfit2}
                  </text>
                </g>
              )}

              {/* Crosshair on hover */}
              {mousePos && (
                <g>
                  <line
                    x1={mousePos.x}
                    y1="0"
                    x2={mousePos.x}
                    y2={chartHeight}
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    strokeDasharray="3,3"
                  />
                  <line
                    x1="0"
                    y1={mousePos.y}
                    x2={chartWidth}
                    y2={mousePos.y}
                    stroke="#94a3b8"
                    strokeWidth="0.8"
                    strokeDasharray="3,3"
                  />
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator Status */}
      <div className="p-3 bg-[#0a0d14] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Bullish Candle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Bearish Candle</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-purple-500 rounded" />
            <span>VWAP Benchmark</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cyan-400 rounded" />
            <span>EMA 9 / 21</span>
          </span>
        </div>

        <div className="font-mono text-[11px] text-slate-400">
          Showing last 60 actual candles • Synchronized with {timeframe}
        </div>
      </div>
    </div>
  );
};

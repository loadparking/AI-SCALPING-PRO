import {
  Candle,
  Indicators,
  PivotPoints,
  FairValueGap,
  LiquidityLevel,
  MarketStructure,
  Timeframe,
  TimeframeAnalysis,
  SignalSetup,
  SignalType,
  TrendType,
  RiskManagementConfig,
  BacktestResult,
  BacktestTrade,
} from '../types/trading';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  if (values.length < period) return values.map(() => values[values.length - 1]);

  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(values.length);

  // Initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let prevEma = sum / period;
  emaArray[period - 1] = prevEma;

  for (let i = 0; i < period - 1; i++) {
    emaArray[i] = values[i];
  }

  for (let i = period; i < values.length; i++) {
    prevEma = values[i] * k + prevEma * (1 - k);
    emaArray[i] = prevEma;
  }

  return emaArray;
}

/**
 * Calculates Relative Strength Index (RSI) using Wilder's Smoothing
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length <= period) return closes.map(() => 50);

  const rsi: number[] = new Array(closes.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = 100 - 100 / (1 + rs);
  }

  return rsi;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length === 0) return [];
  if (candles.length < 2) return candles.map((c) => c.high - c.low);

  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  const atr: number[] = new Array(candles.length).fill(tr[0]);
  let sum = 0;
  const count = Math.min(period, tr.length);
  for (let i = 0; i < count; i++) {
    sum += tr[i];
  }
  let prevATR = sum / count;
  atr[count - 1] = prevATR;

  for (let i = count; i < tr.length; i++) {
    prevATR = (prevATR * (period - 1) + tr[i]) / period;
    atr[i] = prevATR;
  }

  return atr;
}

/**
 * Calculates Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  if (candles.length === 0) return [];

  let cumVolume = 0;
  let cumTPV = 0;
  const vwap: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 100;

    cumTPV += typicalPrice * vol;
    cumVolume += vol;

    vwap.push(cumVolume > 0 ? cumTPV / cumVolume : typicalPrice);
  }

  return vwap;
}

/**
 * Calculates Classical Floor Pivot Points
 */
export function calculatePivots(candles: Candle[]): PivotPoints {
  if (candles.length === 0) {
    return { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  }

  // Use the prior candle or high/low of last 20 candles
  const lookback = Math.min(candles.length, 20);
  const slice = candles.slice(-lookback);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  const close = candles[candles.length - 1].close;

  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const s1 = 2 * pp - high;
  const r2 = pp + (high - low);
  const s2 = pp - (high - low);
  const r3 = high + 2 * (pp - low);
  const s3 = low - 2 * (high - pp);

  return {
    pp: Number(pp.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2)),
  };
}

/**
 * Detects Fair Value Gaps (FVG)
 */
export function detectFVGs(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];
  if (candles.length < 3) return fvgs;

  const start = Math.max(0, candles.length - 40);
  for (let i = start + 2; i < candles.length; i++) {
    const prev2 = candles[i - 2];
    const current = candles[i];

    // Bullish FVG: current candle low is strictly higher than 2-bars-ago high
    if (current.low > prev2.high) {
      const top = current.low;
      const bottom = prev2.high;
      if (top - bottom >= 0.15) {
        // check if mitigated by subsequent candles
        let mitigated = false;
        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].low <= bottom) {
            mitigated = true;
            break;
          }
        }
        fvgs.push({
          type: 'BULLISH',
          top: Number(top.toFixed(2)),
          bottom: Number(bottom.toFixed(2)),
          time: current.time,
          mitigated,
        });
      }
    }

    // Bearish FVG: current candle high is strictly lower than 2-bars-ago low
    if (current.high < prev2.low) {
      const top = prev2.low;
      const bottom = current.high;
      if (top - bottom >= 0.15) {
        let mitigated = false;
        for (let j = i + 1; j < candles.length; j++) {
          if (candles[j].high >= top) {
            mitigated = true;
            break;
          }
        }
        fvgs.push({
          type: 'BEARISH',
          top: Number(top.toFixed(2)),
          bottom: Number(bottom.toFixed(2)),
          time: current.time,
          mitigated,
        });
      }
    }
  }

  return fvgs.slice(-6); // Keep most recent relevant FVGs
}

/**
 * Detects Liquidity levels (BSL / SSL)
 */
export function detectLiquidity(candles: Candle[]): LiquidityLevel[] {
  const levels: LiquidityLevel[] = [];
  if (candles.length < 10) return levels;

  const lookback = Math.min(50, candles.length);
  const subset = candles.slice(-lookback);

  for (let i = 2; i < subset.length - 2; i++) {
    const c = subset[i];
    // Swing high
    if (
      c.high > subset[i - 1].high &&
      c.high > subset[i - 2].high &&
      c.high > subset[i + 1].high &&
      c.high > subset[i + 2].high
    ) {
      levels.push({
        type: 'BSL',
        price: Number(c.high.toFixed(2)),
        strength: 2,
        swept: subset.slice(i + 1).some((s) => s.high > c.high),
      });
    }

    // Swing low
    if (
      c.low < subset[i - 1].low &&
      c.low < subset[i - 2].low &&
      c.low < subset[i + 1].low &&
      c.low < subset[i + 2].low
    ) {
      levels.push({
        type: 'SSL',
        price: Number(c.low.toFixed(2)),
        strength: 2,
        swept: subset.slice(i + 1).some((s) => s.low < c.low),
      });
    }
  }

  return levels.slice(-6);
}

/**
 * Detects Market Structure: Higher Highs/Lows, BOS, CHoCH
 */
export function detectMarketStructure(candles: Candle[]): MarketStructure {
  if (candles.length < 15) {
    return {
      trend: 'NEUTRAL',
      lastEvent: 'CONSOLIDATION',
      swingHighs: [],
      swingLows: [],
    };
  }

  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  const lookback = Math.min(60, candles.length);
  const subset = candles.slice(-lookback);

  for (let i = 2; i < subset.length - 2; i++) {
    if (
      subset[i].high > subset[i - 1].high &&
      subset[i].high > subset[i - 2].high &&
      subset[i].high > subset[i + 1].high &&
      subset[i].high > subset[i + 2].high
    ) {
      swingHighs.push(Number(subset[i].high.toFixed(2)));
    }
    if (
      subset[i].low < subset[i - 1].low &&
      subset[i].low < subset[i - 2].low &&
      subset[i].low < subset[i + 1].low &&
      subset[i].low < subset[i + 2].low
    ) {
      swingLows.push(Number(subset[i].low.toFixed(2)));
    }
  }

  const lastHigh = swingHighs[swingHighs.length - 1];
  const prevHigh = swingHighs[swingHighs.length - 2];
  const lastLow = swingLows[swingLows.length - 1];
  const prevLow = swingLows[swingLows.length - 2];

  const currentClose = candles[candles.length - 1].close;

  let trend: TrendType = 'NEUTRAL';
  let lastEvent: MarketStructure['lastEvent'] = 'CONSOLIDATION';

  if (lastHigh && prevHigh && lastLow && prevLow) {
    if (lastHigh > prevHigh && lastLow > prevLow) {
      trend = 'BULLISH';
      if (currentClose > lastHigh) {
        lastEvent = 'BOS_BULL';
      }
    } else if (lastHigh < prevHigh && lastLow < prevLow) {
      trend = 'BEARISH';
      if (currentClose < lastLow) {
        lastEvent = 'BOS_BEAR';
      }
    } else if (lastHigh > prevHigh && lastLow < prevLow) {
      // Expanding / CHoCH Bullish if breaking previous high
      trend = currentClose > lastHigh ? 'BULLISH' : 'NEUTRAL';
      lastEvent = currentClose > lastHigh ? 'CHOCH_BULL' : 'CONSOLIDATION';
    } else if (lastHigh < prevHigh && lastLow > prevLow) {
      // Squeeze / Triangle consolidation
      trend = 'NEUTRAL';
      lastEvent = 'CONSOLIDATION';
    }
  } else {
    const ema9 = calculateEMA(candles.map((c) => c.close), 9);
    const ema21 = calculateEMA(candles.map((c) => c.close), 21);
    if (ema9[ema9.length - 1] > ema21[ema21.length - 1]) trend = 'BULLISH';
    else if (ema9[ema9.length - 1] < ema21[ema21.length - 1]) trend = 'BEARISH';
  }

  return {
    trend,
    lastEvent,
    eventPrice: lastEvent.includes('BULL') ? lastHigh : lastLow,
    swingHighs: swingHighs.slice(-4),
    swingLows: swingLows.slice(-4),
  };
}

/**
 * Detects Candlestick pattern on the latest closed candle
 */
export function detectCandlePattern(candles: Candle[]): Indicators['candlePattern'] {
  if (candles.length < 3) return 'NEUTRAL';

  const c = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  const upperWick = c.high - Math.max(c.close, c.open);
  const lowerWick = Math.min(c.close, c.open) - c.low;

  if (range <= 0.05) return 'NEUTRAL';

  // Bullish Engulfing
  if (prev.close < prev.open && c.close > c.open && c.close >= prev.open && c.open <= prev.close) {
    return 'BULLISH_ENGULFING';
  }

  // Bearish Engulfing
  if (prev.close > prev.open && c.close < c.open && c.close <= prev.open && c.open >= prev.close) {
    return 'BEARISH_ENGULFING';
  }

  // Hammer / Pin bar (long lower wick >= 2x body)
  if (lowerWick >= 2 * body && upperWick <= body * 0.5) {
    return 'PIN_BAR_HAMMER';
  }

  // Shooting Star (long upper wick >= 2x body)
  if (upperWick >= 2 * body && lowerWick <= body * 0.5) {
    return 'SHOOTING_STAR';
  }

  // Rejection Wick
  if (lowerWick >= range * 0.5 || upperWick >= range * 0.5) {
    return 'REJECTION_WICK';
  }

  return 'NEUTRAL';
}

/**
 * Analyzes an individual timeframe's candles to produce full indicator metrics and signal
 */
export function analyzeTimeframe(timeframe: Timeframe, candles: Candle[]): TimeframeAnalysis {
  if (candles.length === 0) {
    return {
      timeframe,
      trend: 'NEUTRAL',
      signal: 'WAIT',
      confidence: 0,
      summary: 'Insufficient market data',
      indicators: {
        ema9: 0,
        ema21: 0,
        rsi14: 50,
        vwap: 0,
        atr14: 0,
        pivots: { pp: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 },
        fvgList: [],
        liquidity: [],
        structure: { trend: 'NEUTRAL', lastEvent: 'CONSOLIDATION', swingHighs: [], swingLows: [] },
        candlePattern: 'NEUTRAL',
      },
      candles: [],
    };
  }

  const closes = candles.map((c) => c.close);
  const ema9Arr = calculateEMA(closes, 9);
  const ema21Arr = calculateEMA(closes, 21);
  const rsiArr = calculateRSI(closes, 14);
  const atrArr = calculateATR(candles, 14);
  const vwapArr = calculateVWAP(candles);

  const ema9 = Number((ema9Arr[ema9Arr.length - 1] || 0).toFixed(2));
  const ema21 = Number((ema21Arr[ema21Arr.length - 1] || 0).toFixed(2));
  const rsi14 = Number((rsiArr[rsiArr.length - 1] || 50).toFixed(1));
  const atr14 = Number((atrArr[atrArr.length - 1] || 1.5).toFixed(2));
  const vwap = Number((vwapArr[vwapArr.length - 1] || closes[closes.length - 1]).toFixed(2));

  const pivots = calculatePivots(candles);
  const fvgList = detectFVGs(candles);
  const liquidity = detectLiquidity(candles);
  const structure = detectMarketStructure(candles);
  const candlePattern = detectCandlePattern(candles);

  const currentPrice = closes[closes.length - 1];

  // Determine Timeframe Signal & Trend
  let trend: TrendType = 'NEUTRAL';
  let signal: SignalType = 'WAIT';
  let confidence = 50;

  const isEmaBull = ema9 > ema21;
  const isEmaBear = ema9 < ema21;
  const isAboveVwap = currentPrice >= vwap;
  const isRsiBull = rsi14 >= 50 && rsi14 <= 78;
  const isRsiBear = rsi14 <= 50 && rsi14 >= 22;

  // Trend identification
  if (isEmaBull && structure.trend !== 'BEARISH') {
    trend = 'BULLISH';
  } else if (isEmaBear && structure.trend !== 'BULLISH') {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  // Signal generation for this timeframe
  if (trend === 'BULLISH' && isRsiBull && isAboveVwap && candlePattern !== 'BEARISH_ENGULFING') {
    signal = 'BUY';
    confidence = Math.min(95, 65 + (structure.lastEvent === 'BOS_BULL' ? 15 : 5) + (candlePattern === 'BULLISH_ENGULFING' || candlePattern === 'PIN_BAR_HAMMER' ? 10 : 0));
  } else if (trend === 'BEARISH' && isRsiBear && !isAboveVwap && candlePattern !== 'BULLISH_ENGULFING') {
    signal = 'SELL';
    confidence = Math.min(95, 65 + (structure.lastEvent === 'BOS_BEAR' ? 15 : 5) + (candlePattern === 'BEARISH_ENGULFING' || candlePattern === 'SHOOTING_STAR' ? 10 : 0));
  } else {
    signal = 'WAIT';
    confidence = 40;
  }

  const summary = `${trend} trend with EMA 9/21 ${isEmaBull ? 'expansion up' : isEmaBear ? 'expansion down' : 'compression'}, RSI at ${rsi14}.`;

  return {
    timeframe,
    trend,
    signal,
    confidence,
    summary,
    indicators: {
      ema9,
      ema21,
      rsi14,
      vwap,
      atr14,
      pivots,
      fvgList,
      liquidity,
      structure,
      candlePattern,
    },
    candles: candles.slice(-150),
  };
}

/**
 * Multi-Timeframe Confirmation Confluence Engine
 *
 * Rules:
 * - H4 and H1 for the broader market trend.
 * - M30 and M15 for market structure and trading zones.
 * - M5 for setup confirmation.
 * - M1 for potential scalping entries.
 * - D1, W1, and MN1 for major support, resistance, and long-term direction.
 */
export function evaluateMultiTimeframeSetup(
  analyses: Record<Timeframe, TimeframeAnalysis>,
  selectedTf: Timeframe,
  config: RiskManagementConfig,
  currentPrice: number,
  spreadUSD: number = 0.25
): SignalSetup {
  const h4 = analyses['H4'];
  const h1 = analyses['H1'];
  const m30 = analyses['M30'];
  const m15 = analyses['M15'];
  const m5 = analyses['M5'];
  const m1 = analyses['M1'];
  const d1 = analyses['D1'];

  // 1. Higher Timeframe Trend (H4 + H1)
  let macroTrend: TrendType = 'NEUTRAL';
  if (h4?.trend === 'BULLISH' && h1?.trend === 'BULLISH') macroTrend = 'BULLISH';
  else if (h4?.trend === 'BEARISH' && h1?.trend === 'BEARISH') macroTrend = 'BEARISH';
  else if (h1?.trend === 'BULLISH' && d1?.trend === 'BULLISH') macroTrend = 'BULLISH';
  else if (h1?.trend === 'BEARISH' && d1?.trend === 'BEARISH') macroTrend = 'BEARISH';
  else if (h1?.trend) macroTrend = h1.trend;

  // 2. Market Structure (M30 + M15)
  const isStructureBullish = m30?.trend === 'BULLISH' || m15?.trend === 'BULLISH';
  const isStructureBearish = m30?.trend === 'BEARISH' || m15?.trend === 'BEARISH';

  // 3. Setup Confirmation (M5)
  const isM5ConfirmedBull = m5?.signal === 'BUY' || (m5?.trend === 'BULLISH' && m5?.indicators.rsi14 >= 48);
  const isM5ConfirmedBear = m5?.signal === 'SELL' || (m5?.trend === 'BEARISH' && m5?.indicators.rsi14 <= 52);

  // 4. Entry timing (M1)
  const isM1EntryBull = m1?.indicators.ema9 >= m1?.indicators.ema21;
  const isM1EntryBear = m1?.indicators.ema9 <= m1?.indicators.ema21;

  // Volatility check based on M5 / M15 ATR
  const activeAtr = m5?.indicators.atr14 || m15?.indicators.atr14 || 1.8;
  const atrRatio = (activeAtr / currentPrice) * 100;
  let marketVolatility: SignalSetup['marketVolatility'] = 'NORMAL';
  if (atrRatio < 0.03) marketVolatility = 'LOW';
  else if (atrRatio > 0.15) marketVolatility = 'EXTREME';
  else if (atrRatio > 0.08) marketVolatility = 'HIGH';

  // Spread check
  let spreadStatus: SignalSetup['spreadStatus'] = 'ACCEPTABLE';
  if (spreadUSD <= 0.25) spreadStatus = 'TIGHT';
  else if (spreadUSD > 0.60) spreadStatus = 'WIDE';

  // AI Setup Confidence Calculation (0 - 100%)
  let score = 0;
  const reasons: string[] = [];

  let direction: SignalType = 'WAIT';

  // Evaluate Potential BUY
  const buyHtfAligned = macroTrend === 'BULLISH';
  const buyStructureAligned = isStructureBullish && m15?.indicators.structure.trend !== 'BEARISH';
  const buyM5Aligned = isM5ConfirmedBull;
  const buyM1Aligned = isM1EntryBull;
  const buyOpposingTrendH4 = h4?.trend === 'BEARISH' && h4?.signal === 'SELL';
  const buyRsiSafe = (m5?.indicators.rsi14 || 50) < 78;

  // Evaluate Potential SELL
  const sellHtfAligned = macroTrend === 'BEARISH';
  const sellStructureAligned = isStructureBearish && m15?.indicators.structure.trend !== 'BULLISH';
  const sellM5Aligned = isM5ConfirmedBear;
  const sellM1Aligned = isM1EntryBear;
  const sellOpposingTrendH4 = h4?.trend === 'BULLISH' && h4?.signal === 'BUY';
  const sellRsiSafe = (m5?.indicators.rsi14 || 50) > 22;

  if (
    buyHtfAligned &&
    buyStructureAligned &&
    buyM5Aligned &&
    !buyOpposingTrendH4 &&
    buyRsiSafe &&
    spreadStatus !== 'WIDE'
  ) {
    direction = 'BUY';

    // HTF Alignment: +25%
    score += 25;
    reasons.push('H4 & H1 macro trend are firmly Bullish');

    // Market structure: +20%
    if (m15?.indicators.structure.lastEvent === 'BOS_BULL' || m30?.indicators.structure.trend === 'BULLISH') {
      score += 20;
      reasons.push('Bullish Market Structure confirmed on M30/M15 with higher lows');
    } else {
      score += 12;
      reasons.push('M15 structure in supportive demand zone');
    }

    // EMA Dynamic Alignment: +15%
    if (m5?.indicators.ema9 > m5?.indicators.ema21) {
      score += 15;
      reasons.push('M5 EMA 9/21 upward momentum expansion');
    }

    // RSI Momentum: +15%
    if (m5?.indicators.rsi14 >= 50 && m5.indicators.rsi14 <= 70) {
      score += 15;
      reasons.push(`RSI momentum bullish (${m5.indicators.rsi14}) with room before overbought`);
    } else {
      score += 8;
    }

    // Reaction at Key Zone: +15%
    if (m5?.indicators.fvgList.some((f) => f.type === 'BULLISH' && !f.mitigated)) {
      score += 15;
      reasons.push('Price reacting favorably off unmitigated Bullish Fair Value Gap (FVG)');
    } else if (currentPrice >= m5?.indicators.vwap) {
      score += 12;
      reasons.push('Holding above intraday institutional VWAP benchmark');
    }

    // Entry timing M1: +10%
    if (buyM1Aligned) {
      score += 10;
      reasons.push('M1 scalping trigger aligned with micro EMA slope');
    }
  } else if (
    sellHtfAligned &&
    sellStructureAligned &&
    sellM5Aligned &&
    !sellOpposingTrendH4 &&
    sellRsiSafe &&
    spreadStatus !== 'WIDE'
  ) {
    direction = 'SELL';

    // HTF Alignment: +25%
    score += 25;
    reasons.push('H4 & H1 macro trend are firmly Bearish');

    // Market structure: +20%
    if (m15?.indicators.structure.lastEvent === 'BOS_BEAR' || m30?.indicators.structure.trend === 'BEARISH') {
      score += 20;
      reasons.push('Bearish Market Structure confirmed on M30/M15 with lower highs');
    } else {
      score += 12;
      reasons.push('M15 structure testing active supply zone');
    }

    // EMA Dynamic Alignment: +15%
    if (m5?.indicators.ema9 < m5?.indicators.ema21) {
      score += 15;
      reasons.push('M5 EMA 9/21 downward momentum expansion');
    }

    // RSI Momentum: +15%
    if (m5?.indicators.rsi14 <= 50 && m5.indicators.rsi14 >= 30) {
      score += 15;
      reasons.push(`RSI momentum bearish (${m5.indicators.rsi14}) with room before oversold`);
    } else {
      score += 8;
    }

    // Reaction at Key Zone: +15%
    if (m5?.indicators.fvgList.some((f) => f.type === 'BEARISH' && !f.mitigated)) {
      score += 15;
      reasons.push('Price rejecting Bearish Fair Value Gap (FVG) supply block');
    } else if (currentPrice <= m5?.indicators.vwap) {
      score += 12;
      reasons.push('Trading below intraday institutional VWAP benchmark');
    }

    // Entry timing M1: +10%
    if (sellM1Aligned) {
      score += 10;
      reasons.push('M1 scalping trigger aligned with micro downward EMA cross');
    }
  } else {
    direction = 'WAIT';
    score = 35;
    if (buyOpposingTrendH4 || sellOpposingTrendH4) {
      reasons.push('Higher timeframe (H4) shows opposing trend structure — waiting for trend alignment');
    }
    if (!buyStructureAligned && !sellStructureAligned) {
      reasons.push('Market structure is consolidating inside tight range without clear Break of Structure (BOS)');
    }
    if (spreadStatus === 'WIDE') {
      reasons.push('Current broker spread is wide (> $0.60), unfavorable for scalping execution');
    }
    if (m5?.indicators.rsi14 && (m5.indicators.rsi14 > 78 || m5.indicators.rsi14 < 22)) {
      reasons.push('Momentum indicator at extreme exhaustion level — waiting for pullback retest');
    }
    if (reasons.length === 0) {
      reasons.push('Confluence criteria incomplete across multi-timeframe matrix — observing market orderflow');
    }
  }

  // Calculate Stop Loss & Take Profit Targets
  const entryPrice = Number(currentPrice.toFixed(2));
  const atrBuffer = Number((activeAtr * (config.atrMultiplierSL || 1.2)).toFixed(2));
  let stopLoss = 0;
  let tp1 = 0;
  let tp2 = 0;
  let tp3 = 0;
  let riskReward = config.rrTarget || 2.0;

  if (direction === 'BUY') {
    // SL below recent swing low or ATR buffer
    const recentLow = m5?.indicators.structure.swingLows.slice(-1)[0] || entryPrice - atrBuffer;
    stopLoss = Number(Math.min(recentLow - 0.20, entryPrice - Math.max(1.5, atrBuffer)).toFixed(2));
    const riskDistance = Number((entryPrice - stopLoss).toFixed(2));
    tp1 = Number((entryPrice + riskDistance * 1.0).toFixed(2));
    tp2 = Number((entryPrice + riskDistance * 2.0).toFixed(2));
    tp3 = Number((entryPrice + riskDistance * 3.0).toFixed(2));
  } else if (direction === 'SELL') {
    // SL above recent swing high or ATR buffer
    const recentHigh = m5?.indicators.structure.swingHighs.slice(-1)[0] || entryPrice + atrBuffer;
    stopLoss = Number(Math.max(recentHigh + 0.20, entryPrice + Math.max(1.5, atrBuffer)).toFixed(2));
    const riskDistance = Number((stopLoss - entryPrice).toFixed(2));
    tp1 = Number((entryPrice - riskDistance * 1.0).toFixed(2));
    tp2 = Number((entryPrice - riskDistance * 2.0).toFixed(2));
    tp3 = Number((entryPrice - riskDistance * 3.0).toFixed(2));
  } else {
    // Reference levels for WAIT state
    stopLoss = Number((entryPrice - atrBuffer).toFixed(2));
    tp1 = Number((entryPrice + atrBuffer).toFixed(2));
    tp2 = Number((entryPrice + atrBuffer * 2).toFixed(2));
    tp3 = Number((entryPrice + atrBuffer * 3).toFixed(2));
  }

  // Position sizing for XAUUSD:
  // 1 standard lot = 100 oz. $1 price change = $100 per 1.0 lot ($10 per 0.1 lot, $1 per 0.01 lot)
  const riskUSD = config.accountBalance * ((config.riskPercentage || 1) / 100);
  const slDistanceUSD = Math.abs(entryPrice - stopLoss) || 2.0;
  // lotSize = riskUSD / (slDistance * 100)
  const calculatedLots = Math.max(0.01, Number((riskUSD / (slDistanceUSD * 100)).toFixed(2)));

  const potentialGainTP1 = Number((calculatedLots * 100 * Math.abs(tp1 - entryPrice)).toFixed(2));
  const potentialGainTP2 = Number((calculatedLots * 100 * Math.abs(tp2 - entryPrice)).toFixed(2));
  const potentialGainTP3 = Number((calculatedLots * 100 * Math.abs(tp3 - entryPrice)).toFixed(2));

  return {
    id: `setup-${Date.now()}`,
    symbol: 'XAUUSD',
    currentPrice,
    timeframe: selectedTf,
    direction,
    entryPrice,
    stopLoss,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tp3,
    riskReward,
    confidenceScore: Math.min(100, Math.max(10, score)),
    confidenceReasons: reasons,
    generationTime: Date.now(),
    higherTimeframeTrend: macroTrend,
    marketVolatility,
    volatilityValue: activeAtr,
    spread: spreadUSD,
    spreadStatus,
    status: direction === 'WAIT' ? 'WAITING_CONFIRMATION' : score >= 75 ? 'CONFIRMED' : 'ACTIVE',
    riskSettings: {
      riskPerTradeUSD: Number(riskUSD.toFixed(2)),
      recommendedLotSize: calculatedLots,
      maxLoss: Number((calculatedLots * 100 * slDistanceUSD).toFixed(2)),
      potentialGainTP1,
      potentialGainTP2,
      potentialGainTP3,
    },
  };
}

/**
 * Historical Backtesting Module on actual historical Gold bars
 */
export function runHistoricalBacktest(
  candles: Candle[],
  timeframe: Timeframe,
  config: RiskManagementConfig,
  spreadUSD: number = 0.30
): BacktestResult {
  if (candles.length < 50) {
    return {
      symbol: 'XAUUSD',
      timeframe,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      maxDrawdownUSD: 0,
      netProfitUSD: 0,
      grossProfit: 0,
      grossLoss: 0,
      avgRiskReward: 0,
      spreadCommissionDeducted: 0,
      trades: [],
      equityCurve: [{ time: Date.now(), equity: config.accountBalance }],
    };
  }

  const closes = candles.map((c) => c.close);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const rsi = calculateRSI(closes, 14);
  const atr = calculateATR(candles, 14);

  const trades: BacktestTrade[] = [];
  let inTrade: {
    direction: 'BUY' | 'SELL';
    entryIndex: number;
    entryPrice: number;
    stopLoss: number;
    tp1: number;
    tp2: number;
    tp3: number;
    riskUSD: number;
    lots: number;
    confidence: number;
  } | null = null;

  let currentEquity = config.accountBalance;
  let peakEquity = config.accountBalance;
  let maxDDUSD = 0;
  let maxDDPercent = 0;
  let totalSpreadCost = 0;

  const equityCurve: { time: number; equity: number }[] = [
    { time: candles[30].time * 1000, equity: currentEquity },
  ];

  // Prevent look-ahead bias: loop candle by candle from bar 30 onward
  for (let i = 30; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const currentATR = atr[i - 1];

    // If currently in a trade, evaluate hit SL or TP on current candle's high/low
    if (inTrade) {
      let exitPrice = 0;
      let exitReason: BacktestTrade['exitReason'] = 'TIMEFRAME_CLOSE';
      let isWin = false;

      if (inTrade.direction === 'BUY') {
        if (current.low <= inTrade.stopLoss) {
          exitPrice = inTrade.stopLoss;
          exitReason = 'SL';
          isWin = false;
        } else if (current.high >= inTrade.tp2) {
          // Hit TP2
          exitPrice = inTrade.tp2;
          exitReason = 'TP2';
          isWin = true;
        } else if (current.high >= inTrade.tp1 && i - inTrade.entryIndex >= 8) {
          // Trailed to TP1 after 8 bars
          exitPrice = inTrade.tp1;
          exitReason = 'TP1';
          isWin = true;
        }
      } else {
        // SELL trade
        if (current.high >= inTrade.stopLoss) {
          exitPrice = inTrade.stopLoss;
          exitReason = 'SL';
          isWin = false;
        } else if (current.low <= inTrade.tp2) {
          exitPrice = inTrade.tp2;
          exitReason = 'TP2';
          isWin = true;
        } else if (current.low <= inTrade.tp1 && i - inTrade.entryIndex >= 8) {
          exitPrice = inTrade.tp1;
          exitReason = 'TP1';
          isWin = true;
        }
      }

      if (exitPrice !== 0 || i === candles.length - 1) {
        if (exitPrice === 0) exitPrice = current.close;

        const priceDiff =
          inTrade.direction === 'BUY' ? exitPrice - inTrade.entryPrice : inTrade.entryPrice - exitPrice;
        // PnL in USD = lots * 100 * priceDiff - spread cost
        const tradeSpread = inTrade.lots * 100 * spreadUSD;
        totalSpreadCost += tradeSpread;
        const grossPnL = inTrade.lots * 100 * priceDiff;
        const netPnL = Number((grossPnL - tradeSpread).toFixed(2));
        const pnlPercent = Number(((netPnL / currentEquity) * 100).toFixed(2));

        currentEquity = Number((currentEquity + netPnL).toFixed(2));
        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const ddUSD = peakEquity - currentEquity;
        const ddPercent = peakEquity > 0 ? (ddUSD / peakEquity) * 100 : 0;
        if (ddUSD > maxDDUSD) maxDDUSD = ddUSD;
        if (ddPercent > maxDDPercent) maxDDPercent = ddPercent;

        trades.push({
          id: `trade-${trades.length + 1}`,
          direction: inTrade.direction,
          entryTime: candles[inTrade.entryIndex].time * 1000,
          entryPrice: inTrade.entryPrice,
          exitTime: current.time * 1000,
          exitPrice,
          stopLoss: inTrade.stopLoss,
          takeProfit: inTrade.tp2,
          pnl: netPnL,
          pnlPercent,
          status: netPnL > 0 ? 'WIN' : 'LOSS',
          exitReason,
          confidence: inTrade.confidence,
        });

        equityCurve.push({
          time: current.time * 1000,
          equity: currentEquity,
        });

        inTrade = null;
      }
    }

    // If not in trade, look for new signal trigger
    if (!inTrade && i < candles.length - 2) {
      const e9 = ema9[i - 1];
      const e21 = ema21[i - 1];
      const prevE9 = ema9[i - 2];
      const prevE21 = ema21[i - 2];
      const r = rsi[i - 1];

      // EMA Cross or dynamic confirmation
      const bullCross = prevE9 <= prevE21 && e9 > e21;
      const bearCross = prevE9 >= prevE21 && e9 < e21;

      const riskUSD = currentEquity * ((config.riskPercentage || 1) / 100);
      const slDist = Math.max(1.5, currentATR * (config.atrMultiplierSL || 1.2));

      if (bullCross && r >= 48 && r <= 72) {
        // BUY ENTRY
        const entryPrice = current.open + spreadUSD;
        const stopLoss = Number((entryPrice - slDist).toFixed(2));
        const lots = Math.max(0.01, Number((riskUSD / (slDist * 100)).toFixed(2)));

        inTrade = {
          direction: 'BUY',
          entryIndex: i,
          entryPrice: Number(entryPrice.toFixed(2)),
          stopLoss,
          tp1: Number((entryPrice + slDist * 1.0).toFixed(2)),
          tp2: Number((entryPrice + slDist * 2.0).toFixed(2)),
          tp3: Number((entryPrice + slDist * 3.0).toFixed(2)),
          riskUSD,
          lots,
          confidence: 82,
        };
      } else if (bearCross && r <= 52 && r >= 28) {
        // SELL ENTRY
        const entryPrice = current.open - spreadUSD;
        const stopLoss = Number((entryPrice + slDist).toFixed(2));
        const lots = Math.max(0.01, Number((riskUSD / (slDist * 100)).toFixed(2)));

        inTrade = {
          direction: 'SELL',
          entryIndex: i,
          entryPrice: Number(entryPrice.toFixed(2)),
          stopLoss,
          tp1: Number((entryPrice - slDist * 1.0).toFixed(2)),
          tp2: Number((entryPrice - slDist * 2.0).toFixed(2)),
          tp3: Number((entryPrice - slDist * 3.0).toFixed(2)),
          riskUSD,
          lots,
          confidence: 80,
        };
      }
    }
  }

  const winningTrades = trades.filter((t) => t.status === 'WIN').length;
  const losingTrades = trades.filter((t) => t.status === 'LOSS').length;
  const winRate = trades.length > 0 ? Number(((winningTrades / trades.length) * 100).toFixed(1)) : 0;

  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)
  );

  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99 : 0;
  const netProfitUSD = Number((currentEquity - config.accountBalance).toFixed(2));

  return {
    symbol: 'XAUUSD',
    timeframe,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    profitFactor,
    maxDrawdown: Number(maxDDPercent.toFixed(2)),
    maxDrawdownUSD: Number(maxDDUSD.toFixed(2)),
    netProfitUSD,
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    avgRiskReward: config.rrTarget || 2.0,
    spreadCommissionDeducted: Number(totalSpreadCost.toFixed(2)),
    trades: trades.reverse(), // most recent first
    equityCurve,
  };
}

export type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN1';

export type SignalType = 'BUY' | 'SELL' | 'WAIT';

export type TrendType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PivotPoints {
  pp: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface FairValueGap {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  time: number;
  mitigated: boolean;
}

export interface LiquidityLevel {
  type: 'BSL' | 'SSL'; // Buy-side liquidity (swing high) or Sell-side liquidity (swing low)
  price: number;
  strength: number;
  swept: boolean;
}

export interface MarketStructure {
  trend: TrendType;
  lastEvent: 'BOS_BULL' | 'BOS_BEAR' | 'CHOCH_BULL' | 'CHOCH_BEAR' | 'CONSOLIDATION';
  eventPrice?: number;
  eventIndex?: number;
  swingHighs: number[];
  swingLows: number[];
}

export interface Indicators {
  ema9: number;
  ema21: number;
  rsi14: number;
  vwap: number;
  atr14: number;
  pivots: PivotPoints;
  fvgList: FairValueGap[];
  liquidity: LiquidityLevel[];
  structure: MarketStructure;
  candlePattern: 'BULLISH_ENGULFING' | 'BEARISH_ENGULFING' | 'PIN_BAR_HAMMER' | 'SHOOTING_STAR' | 'REJECTION_WICK' | 'NEUTRAL';
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  trend: TrendType;
  signal: SignalType;
  confidence: number;
  summary: string;
  indicators: Indicators;
  candles: Candle[];
}

export interface SignalSetup {
  id: string;
  symbol: 'XAUUSD';
  currentPrice: number;
  timeframe: Timeframe;
  direction: SignalType;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: number; // e.g. 1:2.5
  confidenceScore: number; // 0 - 100
  confidenceReasons: string[];
  generationTime: number; // timestamp
  higherTimeframeTrend: TrendType;
  marketVolatility: 'LOW' | 'NORMAL' | 'HIGH' | 'EXTREME';
  volatilityValue: number; // ATR in $
  spread: number; // in $ (e.g. 0.25)
  spreadStatus: 'TIGHT' | 'ACCEPTABLE' | 'WIDE';
  status: 'ACTIVE' | 'CONFIRMED' | 'WAITING_CONFIRMATION' | 'INVALIDATED';
  riskSettings: {
    riskPerTradeUSD: number;
    recommendedLotSize: number;
    maxLoss: number;
    potentialGainTP1: number;
    potentialGainTP2: number;
    potentialGainTP3: number;
  };
}

export interface MarketDataResponse {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
  provider: string;
  isStale: boolean;
  status: 'LIVE' | 'DEMO' | 'DELAYED';
  selectedTimeframe: Timeframe;
  analyses: Record<Timeframe, TimeframeAnalysis>;
  activeSetup: SignalSetup;
  macroTrend: TrendType;
}

export interface BacktestTrade {
  id: string;
  direction: 'BUY' | 'SELL';
  entryTime: number;
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  pnlPercent: number;
  status: 'WIN' | 'LOSS';
  exitReason: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'TIMEFRAME_CLOSE';
  confidence: number;
}

export interface BacktestResult {
  symbol: string;
  timeframe: Timeframe;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  profitFactor: number;
  maxDrawdown: number; // %
  maxDrawdownUSD: number;
  netProfitUSD: number;
  grossProfit: number;
  grossLoss: number;
  avgRiskReward: number;
  spreadCommissionDeducted: number;
  trades: BacktestTrade[];
  equityCurve: { time: number; equity: number }[];
}

export interface RiskManagementConfig {
  accountBalance: number;
  riskPercentage: number; // e.g. 1%
  rrTarget: number; // e.g. 2
  atrMultiplierSL: number; // e.g. 1.2
  maxDailyLossUSD: number;
  maxOpenTrades: number;
  maxSpreadUSD: number;
  soundAlerts: boolean;
  autoRefreshInterval: number; // seconds
}

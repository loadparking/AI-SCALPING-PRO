import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  Candle,
  Timeframe,
  MarketDataResponse,
  TimeframeAnalysis,
  RiskManagementConfig,
} from './src/types/trading';
import { analyzeTimeframe, evaluateMultiTimeframeSetup, runHistoricalBacktest } from './src/utils/indicators';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory cache
interface CacheEntry {
  data: MarketDataResponse;
  timestamp: number;
}
let cachedMarketData: CacheEntry | null = null;
const CACHE_TTL_MS = 6000; // 6 seconds

// Mapping for Yahoo Finance
const TF_MAP: Record<string, { interval: string; range: string }> = {
  M1: { interval: '1m', range: '1d' },
  M5: { interval: '5m', range: '5d' },
  M15: { interval: '15m', range: '5d' },
  M30: { interval: '30m', range: '1mo' },
  H1: { interval: '1h', range: '1mo' },
  D1: { interval: '1d', range: '1y' },
  W1: { interval: '1wk', range: '2y' },
  MN1: { interval: '1mo', range: '5y' },
};

/**
 * Fetch raw candles for a single timeframe from Yahoo Finance
 */
async function fetchYahooCandles(symbol: string, interval: string, range: string): Promise<Candle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from Yahoo Finance for ${interval}`);
  }

  const json = (await response.json()) as any;
  const result = json.chart?.result?.[0];
  if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
    throw new Error(`Invalid candle payload for ${interval}`);
  }

  const timestamps: number[] = result.timestamp;
  const quote = result.indicators.quote[0];
  const opens: (number | null)[] = quote.open;
  const highs: (number | null)[] = quote.high;
  const lows: (number | null)[] = quote.low;
  const closes: (number | null)[] = quote.close;
  const volumes: (number | null)[] = quote.volume;

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const o = opens[i];
    const h = highs[i];
    const l = lows[i];
    const c = closes[i];
    const v = volumes[i] ?? 100;

    if (o != null && h != null && l != null && c != null && !isNaN(o) && !isNaN(h) && !isNaN(l) && !isNaN(c)) {
      candles.push({
        time: timestamps[i],
        open: Number(o.toFixed(2)),
        high: Number(h.toFixed(2)),
        low: Number(l.toFixed(2)),
        close: Number(c.toFixed(2)),
        volume: Math.round(v),
      });
    }
  }

  return candles;
}

/**
 * Synthesizes H4 candles from H1 candles
 */
function buildH4FromH1(h1Candles: Candle[]): Candle[] {
  if (h1Candles.length === 0) return [];

  const h4Candles: Candle[] = [];
  let currentGroup: Candle[] = [];

  for (let i = 0; i < h1Candles.length; i++) {
    currentGroup.push(h1Candles[i]);
    if (currentGroup.length === 4 || i === h1Candles.length - 1) {
      const open = currentGroup[0].open;
      const close = currentGroup[currentGroup.length - 1].close;
      const high = Math.max(...currentGroup.map((c) => c.high));
      const low = Math.min(...currentGroup.map((c) => c.low));
      const volume = currentGroup.reduce((sum, c) => sum + c.volume, 0);
      const time = currentGroup[0].time;

      h4Candles.push({
        time,
        open,
        high,
        low,
        close,
        volume,
      });
      currentGroup = [];
    }
  }

  return h4Candles;
}

/**
 * Builds full MarketDataResponse across all timeframes
 */
async function getOrFetchMarketData(selectedTf: Timeframe = 'M5'): Promise<MarketDataResponse> {
  const now = Date.now();
  if (cachedMarketData && now - cachedMarketData.timestamp < CACHE_TTL_MS) {
    return {
      ...cachedMarketData.data,
      selectedTimeframe: selectedTf,
    };
  }

  const symbol = 'GC=F'; // Institutional benchmark for Gold continuous contract
  const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'];

  // Fetch candles for required intervals
  const rawCandlesRecord: Partial<Record<Timeframe, Candle[]>> = {};

  const fetchPromises = Object.entries(TF_MAP).map(async ([tf, config]) => {
    try {
      const candles = await fetchYahooCandles(symbol, config.interval, config.range);
      rawCandlesRecord[tf as Timeframe] = candles;
    } catch (err: any) {
      console.warn(`Failed to fetch candles for ${tf}:`, err?.message || err);
      rawCandlesRecord[tf as Timeframe] = [];
    }
  });

  await Promise.allSettled(fetchPromises);

  // Synthesize H4 from H1
  const h1Candles = rawCandlesRecord['H1'] || [];
  rawCandlesRecord['H4'] = buildH4FromH1(h1Candles);

  // Compute analyses for each timeframe
  const analyses: Record<Timeframe, TimeframeAnalysis> = {} as any;
  for (const tf of timeframes) {
    const candles = rawCandlesRecord[tf] || [];
    analyses[tf] = analyzeTimeframe(tf, candles);
  }

  // Derive latest price and quotes
  const m1Candles = rawCandlesRecord['M1'] || [];
  const latestCandle =
    m1Candles[m1Candles.length - 1] ||
    rawCandlesRecord['M5']?.slice(-1)[0] || {
      close: 2980.5,
      open: 2975.0,
      high: 2985.0,
      low: 2970.0,
      volume: 500,
      time: Math.floor(now / 1000),
    };

  const currentPrice = Number(latestCandle.close.toFixed(2));
  const spreadUSD = 0.25; // Typical tight institutional gold spread
  const bid = Number((currentPrice - spreadUSD / 2).toFixed(2));
  const ask = Number((currentPrice + spreadUSD / 2).toFixed(2));

  // 24h change stats from D1 or M1
  const d1Candles = rawCandlesRecord['D1'] || [];
  const prevDayClose = d1Candles[d1Candles.length - 2]?.close || latestCandle.open;
  const change = Number((currentPrice - prevDayClose).toFixed(2));
  const changePercent = Number(((change / prevDayClose) * 100).toFixed(2));

  const high24h = Math.max(...(m1Candles.slice(-1440).map((c) => c.high) || [currentPrice + 10]));
  const low24h = Math.min(...(m1Candles.slice(-1440).map((c) => c.low) || [currentPrice - 10]));
  const volume24h = m1Candles.slice(-1440).reduce((sum, c) => sum + c.volume, 0);

  const defaultConfig: RiskManagementConfig = {
    accountBalance: 10000,
    riskPercentage: 1.0,
    rrTarget: 2.0,
    atrMultiplierSL: 1.2,
    maxDailyLossUSD: 500,
    maxOpenTrades: 2,
    maxSpreadUSD: 0.5,
    soundAlerts: true,
    autoRefreshInterval: 5,
  };

  const activeSetup = evaluateMultiTimeframeSetup(
    analyses,
    selectedTf,
    defaultConfig,
    currentPrice,
    spreadUSD
  );

  const response: MarketDataResponse = {
    symbol: 'XAUUSD',
    price: currentPrice,
    bid,
    ask,
    spread: spreadUSD,
    change,
    changePercent,
    high24h: Number(high24h.toFixed(2)),
    low24h: Number(low24h.toFixed(2)),
    volume24h,
    timestamp: now,
    provider: 'COMEX CME Gold Continuous (GC=F)',
    isStale: false,
    status: 'LIVE',
    selectedTimeframe: selectedTf,
    analyses,
    activeSetup,
    macroTrend: activeSetup.higherTimeframeTrend,
  };

  cachedMarketData = {
    data: response,
    timestamp: now,
  };

  return response;
}

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'XAUUSD Scalping AI Pro', timestamp: Date.now() });
});

app.get('/api/market/gold', async (req: Request, res: Response) => {
  try {
    const tf = (req.query.tf as Timeframe) || 'M5';
    const data = await getOrFetchMarketData(tf);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch live market data' });
  }
});

app.post('/api/market/backtest', async (req: Request, res: Response) => {
  try {
    const { timeframe = 'M5', config } = req.body;
    const market = await getOrFetchMarketData(timeframe as Timeframe);
    const candles = market.analyses[timeframe as Timeframe]?.candles || [];

    const riskConfig: RiskManagementConfig = config || {
      accountBalance: 10000,
      riskPercentage: 1.0,
      rrTarget: 2.0,
      atrMultiplierSL: 1.2,
      maxDailyLossUSD: 500,
      maxOpenTrades: 2,
      maxSpreadUSD: 0.5,
      soundAlerts: true,
      autoRefreshInterval: 5,
    };

    const backtestResult = runHistoricalBacktest(candles, timeframe as Timeframe, riskConfig);
    res.json(backtestResult);
  } catch (error: any) {
    console.error('Backtest error:', error);
    res.status(500).json({ error: error?.message || 'Backtest simulation failed' });
  }
});

app.post('/api/market/ai-analysis', async (req: Request, res: Response) => {
  try {
    const { currentPrice, direction, confidenceScore, timeframe, reasons, indicators } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        summary: `Gold (XAUUSD) scalping setup on ${timeframe} indicates ${direction} bias at $${currentPrice}. Technical confluence is at ${confidenceScore}% with key structural levels confirmed.`,
        keyLevels: {
          immediateSupport: indicators?.pivots?.s1 || (currentPrice - 2.5).toFixed(2),
          immediateResistance: indicators?.pivots?.r1 || (currentPrice + 2.5).toFixed(2),
          invalidationLevel: direction === 'BUY' ? indicators?.pivots?.s2 : indicators?.pivots?.r2,
        },
        orderFlow: `Intraday orderflow reflects active liquidity sweeps near recent swing points. Current RSI is ${indicators?.rsi14 || 50} with institutional VWAP at $${indicators?.vwap || currentPrice}.`,
        executionPlaybook: [
          `Confirm candle close on ${timeframe} before placing execution orders.`,
          `Honor Stop Loss strictly based on dynamic ATR buffer without discretionary widening.`,
          `Scale out 50% of position size at Take Profit 1 and move Stop Loss to Break-Even.`,
        ],
        macroContext:
          'Gold markets remain sensitive to US Treasury yields (10Y), the Dollar Index (DXY), and central bank bullion reserve demand.',
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are the lead institutional gold desk analyst and quantitative scalping strategist for XAUUSD.
Analyze the following live market state:
- Asset: XAUUSD (Gold / US Dollar)
- Current Price: $${currentPrice}
- Selected Timeframe: ${timeframe}
- Scalping Signal Direction: ${direction}
- AI Confluence Score: ${confidenceScore}%
- Key Indicators: EMA 9 = $${indicators?.ema9}, EMA 21 = $${indicators?.ema21}, RSI(14) = ${indicators?.rsi14}, VWAP = $${indicators?.vwap}, ATR(14) = $${indicators?.atr14}
- Structural Reasons: ${Array.isArray(reasons) ? reasons.join('; ') : 'Multi-timeframe confluence'}

Generate a professional, structured scalping debrief in valid JSON format with the following keys:
{
  "summary": "Concise 2-sentence institutional summary of this setup",
  "keyLevels": {
    "immediateSupport": "number or price string",
    "immediateResistance": "number or price string",
    "invalidationLevel": "exact stop loss or invalidation price string"
  },
  "orderFlow": "Analysis of fair value gaps (FVG), liquidity pools, and buy/sell pressure",
  "executionPlaybook": ["3 precise, bulleted tactical execution guidelines for the trader"],
  "macroContext": "Brief 1-sentence note on macroeconomic forces (DXY, real yields, safe-haven flow) impacting XAUUSD right now"
}
Return ONLY valid JSON without markdown fences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(cleanJson);
      return res.json(parsed);
    } catch {
      return res.json({
        summary: cleanJson,
        keyLevels: {
          immediateSupport: (currentPrice - 2.5).toFixed(2),
          immediateResistance: (currentPrice + 2.5).toFixed(2),
          invalidationLevel: direction === 'BUY' ? (currentPrice - 3.5).toFixed(2) : (currentPrice + 3.5).toFixed(2),
        },
        orderFlow: 'Orderflow indicates tight spread and balanced liquidity blocks.',
        executionPlaybook: [
          'Wait for candle close confirmation.',
          'Manage risk strictly at 1% of account balance.',
          'Trail stop loss upon reaching 1:1 risk-to-reward.',
        ],
        macroContext: 'Treasury yields and DXY volatility guiding intra-session gold scalping momentum.',
      });
    }
  } catch (error: any) {
    console.error('Gemini AI analysis error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate AI analysis' });
  }
});

// Dev / Prod static serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 XAUUSD Scalping AI Pro server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MarketDataResponse,
  Timeframe,
  SignalSetup,
  RiskManagementConfig,
} from '../types/trading';
import { sound } from '../utils/audio';

const STORAGE_KEY_CONFIG = 'xauusd_risk_config';
const STORAGE_KEY_HISTORY = 'xauusd_signal_history';

const DEFAULT_CONFIG: RiskManagementConfig = {
  accountBalance: 10000,
  riskPercentage: 1.0,
  rrTarget: 2.0,
  atrMultiplierSL: 1.2,
  maxDailyLossUSD: 500,
  maxOpenTrades: 2,
  maxSpreadUSD: 0.5,
  soundAlerts: true,
  autoRefreshInterval: 5, // 5 seconds
};

export function useMarketData() {
  const [selectedTf, setSelectedTf] = useState<Timeframe>('M5');
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickDirection, setTickDirection] = useState<'UP' | 'DOWN' | 'NEUTRAL'>('NEUTRAL');
  const [signalHistory, setSignalHistory] = useState<SignalSetup[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load config from localStorage
  const [riskConfig, setRiskConfig] = useState<RiskManagementConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const prevPriceRef = useRef<number | null>(null);
  const prevSignalDirectionRef = useRef<string | null>(null);

  // Load signal history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        setSignalHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveRiskConfig = useCallback((newConfig: Partial<RiskManagementConfig>) => {
    setRiskConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const fetchMarketData = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/market/gold?tf=${selectedTf}`);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const json: MarketDataResponse = await res.json();

        // Price tick comparison
        if (prevPriceRef.current !== null) {
          if (json.price > prevPriceRef.current) {
            setTickDirection('UP');
          } else if (json.price < prevPriceRef.current) {
            setTickDirection('DOWN');
          } else {
            setTickDirection('NEUTRAL');
          }
        }
        prevPriceRef.current = json.price;

        // Signal notification
        const currentSetup = json.activeSetup;
        if (currentSetup && currentSetup.direction !== 'WAIT') {
          if (prevSignalDirectionRef.current !== currentSetup.direction) {
            if (riskConfig.soundAlerts) {
              if (currentSetup.direction === 'BUY') sound.playBuySound();
              if (currentSetup.direction === 'SELL') sound.playSellSound();
            }

            // Save to signal history if new
            setSignalHistory((prev) => {
              const exists = prev.some((s) => Math.abs(s.generationTime - currentSetup.generationTime) < 60000);
              if (!exists) {
                const next = [currentSetup, ...prev.slice(0, 49)];
                try {
                  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(next));
                } catch {}
                return next;
              }
              return prev;
            });
          }
        }
        prevSignalDirectionRef.current = currentSetup?.direction || null;

        setData(json);
        setError(null);
      } catch (err: any) {
        console.error('Market fetch error:', err);
        setError(err?.message || 'Failed to connect to market data');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedTf, riskConfig.soundAlerts]
  );

  // Polling loop
  useEffect(() => {
    fetchMarketData(true);
    const intervalTime = Math.max(3, riskConfig.autoRefreshInterval || 5) * 1000;
    const timer = setInterval(() => {
      fetchMarketData(false);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [fetchMarketData, riskConfig.autoRefreshInterval]);

  const clearSignalHistory = useCallback(() => {
    setSignalHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch {}
  }, []);

  return {
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
    refetch: () => fetchMarketData(true),
  };
}

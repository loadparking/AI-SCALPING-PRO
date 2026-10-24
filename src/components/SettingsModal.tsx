import React, { useState } from 'react';
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Shield,
  Clock,
  RotateCcw,
  Check,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { RiskManagementConfig } from '../types/trading';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RiskManagementConfig;
  onSaveConfig: (newConfig: Partial<RiskManagementConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<RiskManagementConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveConfig(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    const defaultVals: RiskManagementConfig = {
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
    setForm(defaultVals);
    onSaveConfig(defaultVals);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1420] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Application & Risk Settings</h3>
              <p className="text-xs text-slate-400">
                Configure execution parameters, sound alerts, and refresh frequency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Sound Alerts */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                {form.soundAlerts ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Audio Signal Notifications
                </span>
                <span className="text-[11px] text-slate-400">
                  Plays harmonic chime when new BUY or SELL signal is confirmed
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, soundAlerts: !form.soundAlerts })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                form.soundAlerts ? 'bg-amber-400' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform absolute top-0.5 ${
                  form.soundAlerts ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* Auto Refresh Interval */}
          <div>
            <label className="text-xs text-slate-300 font-medium mb-1.5 block">
              Market Data Refresh Interval
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 5, 10, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setForm({ ...form, autoRefreshInterval: sec })}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                    form.autoRefreshInterval === sec
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Default 5s matches institutional fast-poll rate limit guidelines.
            </span>
          </div>

          {/* ATR Multiplier for Stop Loss */}
          <div>
            <label className="text-xs text-slate-300 font-medium mb-1.5 block">
              Stop Loss ATR Buffer Multiplier
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1.0, 1.2, 1.5, 2.0].map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setForm({ ...form, atrMultiplierSL: mult })}
                  className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all ${
                    form.atrMultiplierSL === mult
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {mult}x ATR
                </button>
              ))}
            </div>
          </div>

          {/* Max Spread Filter */}
          <div>
            <label className="text-xs text-slate-300 font-medium mb-1 block">
              Maximum Acceptable Spread Filter ($)
            </label>
            <input
              type="number"
              step="0.05"
              value={form.maxSpreadUSD}
              onChange={(e) => setForm({ ...form, maxSpreadUSD: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              If live broker spread exceeds this value, signal will default to WAIT state.
            </span>
          </div>

          {/* Data Provider Info */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Active Data Provider</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Institutional Gold Benchmark: <strong>COMEX CME Gold Continuous (GC=F)</strong> via backend proxy.
            </p>
            <p className="text-[10px] text-slate-500">
              Note: Spot Gold contract specs are standardized to 100 troy ounces per 1.00 lot.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121827] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

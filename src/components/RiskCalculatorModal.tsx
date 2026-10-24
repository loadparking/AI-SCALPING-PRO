import React, { useState } from 'react';
import {
  X,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
  Percent,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SignalSetup, RiskManagementConfig } from '../types/trading';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  setup: SignalSetup | undefined;
  config: RiskManagementConfig;
  onSaveConfig: (newConfig: Partial<RiskManagementConfig>) => void;
}

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  setup,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [balance, setBalance] = useState(config.accountBalance || 10000);
  const [riskPercent, setRiskPercent] = useState(config.riskPercentage || 1.0);
  const [entryPrice, setEntryPrice] = useState(setup?.entryPrice || 2980.0);
  const [stopLoss, setStopLoss] = useState(setup?.stopLoss || 2977.0);
  const [targetRR, setTargetRR] = useState(config.rrTarget || 2.0);
  const [maxDailyLoss, setMaxDailyLoss] = useState(config.maxDailyLossUSD || 500);

  // Math calculations
  const slDistanceUSD = Math.abs(entryPrice - stopLoss) || 2.0;
  const monetaryRisk = balance * (riskPercent / 100);

  // In XAUUSD: 1 Standard Lot = 100 oz. Price move of $1.00 = $100 per 1.0 lot.
  // Monetary Risk = Lots * 100 * SL_Distance
  // Lots = Monetary_Risk / (100 * SL_Distance)
  const exactLotSize = monetaryRisk / (100 * slDistanceUSD);
  const recommendedLotSize = Math.max(0.01, Number(exactLotSize.toFixed(2)));

  const isBuy = entryPrice > stopLoss;
  const tp1 = isBuy ? entryPrice + slDistanceUSD * 1.0 : entryPrice - slDistanceUSD * 1.0;
  const tp2 = isBuy ? entryPrice + slDistanceUSD * targetRR : entryPrice - slDistanceUSD * targetRR;
  const tp3 = isBuy ? entryPrice + slDistanceUSD * 3.0 : entryPrice - slDistanceUSD * 3.0;

  const gainTP1 = Number((recommendedLotSize * 100 * slDistanceUSD * 1.0).toFixed(2));
  const gainTP2 = Number((recommendedLotSize * 100 * slDistanceUSD * targetRR).toFixed(2));
  const gainTP3 = Number((recommendedLotSize * 100 * slDistanceUSD * 3.0).toFixed(2));
  const actualMaxLoss = Number((recommendedLotSize * 100 * slDistanceUSD).toFixed(2));

  // Required margin assuming standard 1:100 leverage
  const notionalValue = recommendedLotSize * 100 * entryPrice;
  const marginRequired = Number((notionalValue / 100).toFixed(2));

  const handleApply = () => {
    onSaveConfig({
      accountBalance: balance,
      riskPercentage: riskPercent,
      rrTarget: targetRR,
      maxDailyLossUSD: maxDailyLoss,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-[#0f1420] border border-amber-500/30 shadow-2xl text-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#121827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                XAUUSD Position Size & Risk Calculator
              </h3>
              <p className="text-xs text-slate-400">
                Institutional lot sizing calibrated for Gold 100 oz contract specification
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

        {/* Inputs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Balance */}
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Balance ($)</span>
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Math.max(100, Number(e.target.value)))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Risk Percentage */}
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Risk Per Trade:</span>
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {riskPercent}% (${monetaryRisk.toFixed(2)})
                </span>
              </label>
              <input
                type="range"
                min="0.25"
                max="5.0"
                step="0.25"
                value={riskPercent}
                onChange={(e) => setRiskPercent(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                Entry Price ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Stop Loss Price */}
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                Stop Loss Price ($)
              </label>
              <input
                type="number"
                step="0.10"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-rose-300 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* R:R Target */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                Target Risk-to-Reward Ratio
              </label>
              <div className="flex items-center gap-2">
                {[1.5, 2.0, 2.5, 3.0].map((rr) => (
                  <button
                    key={rr}
                    type="button"
                    onClick={() => setTargetRR(rr)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                      targetRR === rr
                        ? 'bg-amber-400 text-black border-amber-400 shadow-sm'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    1:{rr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium mb-1 block">
                Max Daily Loss Limit ($)
              </label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Output Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#121929] to-[#0c121e] border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-300 font-medium">Recommended Position Size</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-black text-amber-400">
                  {recommendedLotSize}
                </span>
                <span className="text-xs text-amber-300/80 font-mono">LOTS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SL Risk ($)</span>
                <span className="text-rose-400 font-bold">-${actualMaxLoss}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TP1 Gain ($)</span>
                <span className="text-emerald-400 font-bold">+${gainTP1}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">TP2 Gain ($)</span>
                <span className="text-emerald-400 font-bold">+${gainTP2}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Est. Margin</span>
                <span className="text-slate-300 font-bold">${marginRequired}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Calculated on 100 oz standard Gold contract. SL distance is ${slDistanceUSD.toFixed(2)}.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#121827] border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>Save & Apply Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

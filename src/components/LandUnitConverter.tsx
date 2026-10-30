import React, { useState } from 'react';
import { X, Calculator, Check, Scale } from 'lucide-react';
import { toBengaliNumber } from '../utils/faraizCalculator';

interface LandUnitConverterProps {
  isOpen: boolean;
  onClose: () => void;
  decimalsPerKatha?: number;
  onUpdateDecimalsPerKatha?: (val: number) => void;
}

export const LandUnitConverter: React.FC<LandUnitConverterProps> = ({ 
  isOpen, 
  onClose,
  decimalsPerKatha = 3.30,
  onUpdateDecimalsPerKatha,
}) => {
  if (!isOpen) return null;

  const [decimals, setDecimals] = useState<number>(100);
  const [activeKathaRate, setActiveKathaRate] = useState<number>(decimalsPerKatha || 3.30);

  const handleRateChange = (newRate: number) => {
    setActiveKathaRate(newRate);
    if (onUpdateDecimalsPerKatha) {
      onUpdateDecimalsPerKatha(newRate);
    }
  };

  // Conversions based on chosen katha rate:
  // User region: 1 কাঠা = 3.30 শতক (20 কাঠা = 66 শতক = 1 বিঘা / পাখি)
  // Standard Govt: 1 কাঠা = 1.65 শতক (20 কাঠা = 33 শতক = 1 বিঘা)
  const katha = decimals / (activeKathaRate || 3.30);
  const bigha = decimals / ((activeKathaRate || 3.30) * 20);
  const acre = decimals / 100;
  const sqft = decimals * 435.6;
  const sqMeter = sqft / 10.7639;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">ভূমির পরিমাপ ও আঞ্চলিক একক রূপান্তর</h3>
              <p className="text-xs text-emerald-100">
                আপনার এলাকার ৩.৩০ শতকের কাঠা মান অনুযায়ী হিসাব
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Regional Katha Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              কাঠার মান নির্ধারণ (Regional Katha Setting):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleRateChange(3.30)}
                className={`p-2.5 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  Math.abs(activeKathaRate - 3.30) < 0.05
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>৩.৩০ শতক = ১ কাঠা</span>
                  {Math.abs(activeKathaRate - 3.30) < 0.05 && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] font-normal ${Math.abs(activeKathaRate - 3.30) < 0.05 ? 'text-emerald-100' : 'text-slate-500'}`}>
                  (আপনার স্থানীয় আঞ্চলিক মান)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRateChange(1.65)}
                className={`p-2.5 rounded-xl border font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  Math.abs(activeKathaRate - 1.65) < 0.05
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>১.৬৫ শতক = ১ কাঠা</span>
                  {Math.abs(activeKathaRate - 1.65) < 0.05 && <Check className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-[10px] font-normal ${Math.abs(activeKathaRate - 1.65) < 0.05 ? 'text-emerald-100' : 'text-slate-500'}`}>
                  (সরকারি আদর্শ মান)
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              জমির পরিমাণ লিখুন (শতক / শতাংশ / ডেসিমাল):
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={decimals}
                onChange={(e) => setDecimals(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-3 text-xs font-semibold text-slate-500">
                শতক
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <span className="text-[11px] text-slate-600 block">কাঠা (Katha)</span>
              <strong className="text-base text-emerald-950 block mt-0.5">
                {toBengaliNumber(katha, 3)} কাঠা
              </strong>
              <span className="text-[10px] text-emerald-700">১ কাঠা = {toBengaliNumber(activeKathaRate, 2)} শতক</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">বিঘা (Bigha)</span>
              <strong className="text-base text-slate-800 block mt-0.5">
                {toBengaliNumber(bigha, 3)} বিঘা
              </strong>
              <span className="text-[10px] text-slate-400">১ বিঘা = {toBengaliNumber(activeKathaRate * 20, 1)} শতক (২০ কাঠা)</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">একর (Acre)</span>
              <strong className="text-base text-slate-800 block mt-0.5">
                {toBengaliNumber(acre, 3)} একর
              </strong>
              <span className="text-[10px] text-slate-400">১ একর = ১০০ শতক</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">বর্গফুট (Sq. Feet)</span>
              <strong className="text-base text-slate-800 block mt-0.5">
                {toBengaliNumber(sqft, 1)} বর্গফুট
              </strong>
              <span className="text-[10px] text-slate-400">১ শতক = ৪৩৫.৬ বর্গফুট</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
            💡 <strong>জ্ঞাতব্য:</strong> উত্তরবঙ্গ ও পশ্চিমাঞ্চলসহ অনেক এলাকায় ঐতিহ্যগতভাবে <strong>৩.৩০ শতকে ১ কাঠা</strong> (এবং ২০ কাঠায় ১ বিঘা = ৬৬ শতক) গণ্য করা হয়। অ্যাপের সমস্ত বংশবৃক্ষ ও হিসাবে এটিই ডিফল্ট রাখা হয়েছে।
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, User, Scale, Bookmark, CheckCircle2, Plus } from 'lucide-react';
import { HeirTreeNode } from '../types';
import { toBengaliNumber, decimalToAnaGanda } from '../utils/faraizCalculator';

interface NodeDetailsModalProps {
  node: HeirTreeNode | null;
  onClose: () => void;
  onAddHeirs: (node: HeirTreeNode) => void;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
}

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  node,
  onClose,
  onAddHeirs,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
}) => {
  if (!node) return null;

  const isRoot = node.relationship === 'root';
  const katha = node.totalEstate / decimalsPerKatha;
  const bigha = node.totalEstate / (decimalsPerKatha * kathaPerBigha);
  const sqft = node.totalEstate * 435.6;
  const anaGanda = decimalToAnaGanda(node.sharePercentage / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-xl font-bold">
              {isRoot ? '👑' : node.gender === 'male' ? '👨' : '👩'}
            </div>
            <div>
              <h3 className="text-lg font-bold">{node.name}</h3>
              <p className="text-xs text-emerald-200">
                {node.relationshipBn} • প্রজন্ম {toBengaliNumber(node.generation, 0)}
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
          {/* Main Numbers Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 block">
                মোট প্রাপ্ত জমি (শতক / ডেসিমাল)
              </span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                {toBengaliNumber(node.totalEstate, 2)} শতক
              </span>
              {node.extraEstate > 0 && (
                <span className="text-[10px] text-emerald-700">
                  উত্তরাধিকার: {toBengaliNumber(node.inheritedEstate, 2)} + নিজস্ব: {toBengaliNumber(node.extraEstate, 2)}
                </span>
              )}
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-[11px] font-semibold text-amber-800 block">
                হিস্যা ভগ্নাংশ ও শতকরা
              </span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {node.shareFractionStr}
              </span>
              <span className="text-xs font-bold text-amber-800">
                ({toBengaliNumber(node.sharePercentage, 2)}%)
              </span>
            </div>
          </div>

          {/* Unit Conversions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              অন্যান্য এককে ভূমির পরিমাণ:
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">কাঠা</span>
                <strong className="text-slate-800">{toBengaliNumber(katha, 2)}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">বিঘা</span>
                <strong className="text-slate-800">{toBengaliNumber(bigha, 3)}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">বর্গফুট</span>
                <strong className="text-slate-800">{toBengaliNumber(sqft, 1)}</strong>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">ঐতিহ্যবাহী আনা-গণ্ডা হিসাব:</span>
              <strong className="text-emerald-800 font-semibold">{anaGanda}</strong>
            </div>
          </div>

          {/* Legal basis */}
          <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-teal-900 mb-1">
              <Scale className="w-4 h-4 text-teal-700" />
              <span>আইনি ও শরয়ী দলিল সূত্র:</span>
            </div>
            <p className="leading-relaxed text-slate-700">{node.legalReasonBn}</p>
          </div>

          {/* Children Summary */}
          {node.children && node.children.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-1">
                পরবর্তী প্রজন্মের উত্তরাধিকারী ({toBengaliNumber(node.children.length, 0)} জন):
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {node.children.map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] text-slate-700"
                  >
                    {c.name} ({toBengaliNumber(c.totalEstate, 2)} শতক)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            বন্ধ করুন
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddHeirs(node);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>উত্তরাধিকারী যোগ/সম্পাদনা করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

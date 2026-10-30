import React, { useState } from 'react';
import { X, Scale, Plus, ArrowRightLeft, ShoppingCart, Tag, CheckCircle2, FileText } from 'lucide-react';
import { HeirTreeNode, LandTransaction } from '../types';
import { toBengaliNumber, decimalToAnaGanda } from '../utils/faraizCalculator';

interface NodeDetailsModalProps {
  node: HeirTreeNode | null;
  onClose: () => void;
  onAddHeirs: (node: HeirTreeNode) => void;
  transactions?: LandTransaction[];
  onOpenTransactionForPerson?: (personId: string) => void;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
}

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  node,
  onClose,
  onAddHeirs,
  transactions = [],
  onOpenTransactionForPerson,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
}) => {
  if (!node) return null;

  const isRoot = node.relationship === 'root';
  const netLand = node.currentTotalLand !== undefined ? node.currentTotalLand : node.totalEstate;
  const boughtLand = node.landBought || 0;
  const soldLand = node.landSold || 0;
  const inheritedLand = node.inheritedEstate || 0;
  const extraPersonal = node.extraEstate || 0;

  const katha = netLand / decimalsPerKatha;
  const bigha = netLand / (decimalsPerKatha * kathaPerBigha);
  const sqft = netLand * 435.6;
  const anaGanda = decimalToAnaGanda(node.sharePercentage / 100);

  // Filter transactions related to this person
  const myTransactions = transactions.filter(
    (t) => t.sellerId === node.id || t.buyerId === node.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-2xl font-bold">
              {isRoot ? '👑' : node.gender === 'male' ? '👨' : '👩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{node.name}</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                  {node.relationshipBn}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                প্রজন্ম {toBengaliNumber(node.generation, 0)} • ব্যক্তিগত খতিয়ান ও জমি বিবরণ
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
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Main Net Land Highlights */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                বর্তমান সর্বমোট জমি (হিসাব সমন্বয় পরবর্তী):
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                {node.shareFractionStr} অংশ ({toBengaliNumber(node.sharePercentage, 2)}%)
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-950">
                {toBengaliNumber(netLand, 2)}
              </span>
              <span className="text-sm font-bold text-emerald-800">শতক / শতাংশ</span>
            </div>

            {/* Financial / Land Flow Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-200/60 text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">মূল প্রাপ্ত জমি</span>
                <strong className="text-slate-800 font-bold">{toBengaliNumber(inheritedLand, 2)} শতক</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">ক্রয়কৃত জমি (+)</span>
                <strong className="text-emerald-700 font-bold">+{toBengaliNumber(boughtLand, 2)} শতক</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">বিক্রিত জমি (-)</span>
                <strong className="text-rose-700 font-bold">-{toBengaliNumber(soldLand, 2)} শতক</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">নিজস্ব অন্যান্য জমি</span>
                <strong className="text-slate-800 font-bold">+{toBengaliNumber(extraPersonal, 2)} শতক</strong>
              </div>
            </div>
          </div>

          {/* Unit Conversions */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              আঞ্চলিক ও জাতীয় এককে জমির পরিমাপ:
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">কাঠা (৩.৩০ শতকে)</span>
                <strong className="text-slate-900 font-black text-sm">{toBengaliNumber(katha, 2)}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">বিঘা (২০ কাঠায়)</span>
                <strong className="text-slate-900 font-black text-sm">{toBengaliNumber(bigha, 3)}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block">বর্গফুট</span>
                <strong className="text-slate-900 font-black text-sm">{toBengaliNumber(sqft, 1)}</strong>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">ঐতিহ্যবাহী খতিয়ান আনা-গণ্ডা:</span>
              <strong className="text-emerald-900 font-bold">{anaGanda}</strong>
            </div>
          </div>

          {/* Land Transaction History / Ledger for this Person */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                <span>ব্যক্তিগত জমি ক্রয়-বিক্রয়ের রিপোর্ট ({toBengaliNumber(myTransactions.length, 0)} টি)</span>
              </h4>
              {onOpenTransactionForPerson && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTransactionForPerson(node.id);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>জমি ক্রয়/বিক্রয় করুন</span>
                </button>
              )}
            </div>

            {myTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {node.name}-এর কোনো জমি ক্রয় বা বিক্রয়ের রেকর্ড এখনো নেই।
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {myTransactions.map((tx) => {
                  const isSeller = tx.sellerId === node.id;
                  return (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-white rounded-lg border border-amber-200/60 text-xs flex items-center justify-between"
                    >
                      <div>
                        {isSeller ? (
                          <span className="font-bold text-rose-700">
                            [বিক্রয়] {tx.buyerName}-এর নিকট বিক্রয়
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-800">
                            [ক্রয়] {tx.sellerName}-এর কাছ থেকে ক্রয়
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500 block">
                          তারিখ: {tx.date} {tx.note && `• ${tx.note}`}
                        </span>
                      </div>
                      <span
                        className={`font-black text-sm ${
                          isSeller ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {isSeller ? '-' : '+'}
                        {toBengaliNumber(tx.amountDecimals, 2)} শতক
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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
                    {c.name} ({toBengaliNumber(c.currentTotalLand !== undefined ? c.currentTotalLand : c.totalEstate, 2)} শতক)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>পরবর্তী প্রজন্ম / ওয়ারিশ যোগ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ArrowRightLeft, Plus, Trash2, Check, User, ShoppingBag } from 'lucide-react';
import { HeirTreeNode, LandTransaction } from '../types';
import { getAllPersonsInTree } from '../utils/treeManager';
import { toBengaliNumber } from '../utils/faraizCalculator';
import { BengaliNumberInput } from './BengaliNumberInput';

interface LandTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rootNode: HeirTreeNode;
  transactions: LandTransaction[];
  onAddTransaction: (transaction: Omit<LandTransaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  defaultPersonId?: string;
}

export const LandTransactionModal: React.FC<LandTransactionModalProps> = ({
  isOpen,
  onClose,
  rootNode,
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  defaultPersonId,
}) => {
  if (!isOpen) return null;

  const allPersons = getAllPersonsInTree(rootNode);

  const [sellerId, setSellerId] = useState<string>(() => {
    // If a default person is passed, maybe they are selling or buying
    if (defaultPersonId && allPersons.some(p => p.id === defaultPersonId)) {
      return defaultPersonId;
    }
    return allPersons[0]?.id || '';
  });

  const [buyerId, setBuyerId] = useState<string>(() => {
    const candidate = allPersons.find(p => p.id !== sellerId);
    return candidate?.id || allPersons[0]?.id || '';
  });

  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const currentSeller = allPersons.find(p => p.id === sellerId);
  const currentBuyer = allPersons.find(p => p.id === buyerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId || !buyerId || sellerId === buyerId) {
      alert('অনুগ্রহ করে ভিন্ন বিক্রেতা ও ক্রেতা নির্বাচন করুন।');
      return;
    }
    if (amount <= 0) {
      alert('জমির পরিমাণ অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।');
      return;
    }
    if (currentSeller && amount > currentSeller.currentLand + 0.001) {
      if (!confirm(`সতর্কবার্তা: বিক্রেতা ${currentSeller.name}-এর বর্তমান জমি (${toBengaliNumber(currentSeller.currentLand, 2)} শতক) এর চেয়ে বিক্রির পরিমাণ বেশি। তবুও কি অব্যাহত রাখতে চান?`)) {
        return;
      }
    }

    onAddTransaction({
      sellerId,
      sellerName: currentSeller?.name || 'অজ্ঞাত বিক্রেতা',
      buyerId,
      buyerName: currentBuyer?.name || 'অজ্ঞাত ক্রেতা',
      amountDecimals: amount,
      date: new Date().toLocaleDateString('bn-BD'),
      note: note.trim() || undefined,
    });

    setAmount(0);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-200">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">উত্তরাধিকারীদের মধ্যে জমি ক্রয়-বিক্রয় ও হস্তান্তর</h3>
              <p className="text-xs text-emerald-200">
                এক অংশীদারের থেকে অন্য অংশীদারের নিকট জমি ক্রয় করলে স্বয়ংক্রিয়ভাবে হিসাব সমন্বয় হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* New Transaction Form */}
          <form onSubmit={handleSubmit} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-4">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>নতুন জমি হস্তান্তর / ক্রয়-বিক্রয় যুক্ত করুন</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Seller */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জমি বিক্রেতা অংশীদার (যার জমি কমবে):
                </label>
                <select
                  value={sellerId}
                  onChange={(e) => setSellerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.relationshipBn}) — জমি: {toBengaliNumber(p.currentLand, 2)} শতক
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জমি ক্রেতা অংশীদার (যার জমি বাড়বে):
                </label>
                <select
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {allPersons.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.id === sellerId}>
                      {p.name} ({p.relationshipBn}) — জমি: {toBengaliNumber(p.currentLand, 2)} শতক
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিক্রয়কৃত জমির পরিমাণ (শতক):
                </label>
                <BengaliNumberInput
                  value={amount}
                  onChange={setAmount}
                  placeholder="যেমন: ৫ বা ৫.২৫"
                  className="border-slate-300 text-emerald-950 font-bold"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মন্তব্য / দলিলের বিবরণ (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="যেমন: সাব-কবলা দলিল বা আপস রফা"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>হস্তান্তর সম্পন্ন ও সংরক্ষণ করুন</span>
              </button>
            </div>
          </form>

          {/* Transactions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>সম্পন্ন ক্রয়-বিক্রয়ের খতিয়ান ({toBengaliNumber(transactions.length, 0)} টি লেনদেন)</span>
            </h4>

            {transactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                এখনো কোনো অভ্যন্তরীণ জমি ক্রয়-বিক্রয় রেকর্ড করা হয়নি। উপরে ফর্ম থেকে যেকোনো ওয়ারিশের জমি ক্রয়-বিক্রয় যুক্ত করতে পারেন।
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-slate-400">#{toBengaliNumber(idx + 1, 0)}</span>
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          বিক্রেতা: {tx.sellerName} (-{toBengaliNumber(tx.amountDecimals, 2)} শতক)
                        </span>
                        <span className="text-slate-400">➔</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ক্রেতা: {tx.buyerName} (+{toBengaliNumber(tx.amountDecimals, 2)} শতক)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        পরিমাণ: <strong className="text-slate-800">{toBengaliNumber(tx.amountDecimals, 2)} শতক</strong> • তারিখ: {tx.date}
                        {tx.note && <span className="ml-2 italic text-slate-600">({tx.note})</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="এই লেনদেন বাতিল করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            সম্পন্ন হয়েছে
          </button>
        </div>
      </div>
    </div>
  );
};

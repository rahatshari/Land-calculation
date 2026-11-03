import React from 'react';
import { UserCheck, Plus, Minus, Users, Layers, ArrowRightLeft } from 'lucide-react';
import { Gender, HeirTreeNode } from '../types';
import { toBengaliNumber } from '../utils/faraizCalculator';
import { BengaliNumberInput } from './BengaliNumberInput';

interface RootOwnerCardProps {
  rootNode: HeirTreeNode;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
  onUpdateRoot: (name: string, gender: Gender, totalLand: number) => void;
  onOpenHeirModal: () => void;
  onOpenMultiGenModal?: () => void;
  onOpenTransactions?: () => void;
}

export const RootOwnerCard: React.FC<RootOwnerCardProps> = ({
  rootNode,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
  onUpdateRoot,
  onOpenHeirModal,
  onOpenMultiGenModal,
  onOpenTransactions,
}) => {
  const currentLand = rootNode.totalEstate;
  const currentName = rootNode.name;
  const currentGender = rootNode.gender;

  const handleLandChange = (newVal: number) => {
    const val = Math.max(0.01, newVal);
    onUpdateRoot(currentName, currentGender, val);
  };

  const handleNameChange = (newName: string) => {
    onUpdateRoot(newName, currentGender, currentLand);
  };

  const handleGenderToggle = (newGender: Gender) => {
    onUpdateRoot(currentName, newGender, currentLand);
  };

  const adjustLand = (delta: number) => {
    handleLandChange(Math.round((currentLand + delta) * 100) / 100);
  };

  const katha = currentLand / (decimalsPerKatha || 3.30);
  const bigha = currentLand / ((decimalsPerKatha || 3.30) * (kathaPerBigha || 20));
  const hasChildren = rootNode.children && rootNode.children.length > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
      {/* Top Header Row: Title and Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              মূল ভূম্যধিকারীর বিবরণ ও বণ্টনযোগ্য সম্পত্তি
            </h3>
            <p className="text-xs text-slate-500">
              ১ কাঠা = {toBengaliNumber(decimalsPerKatha, 2)} শতক • ১ম মালিক: {currentName}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {onOpenTransactions && (
            <button
              onClick={onOpenTransactions}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="ওয়ারিশদের মাঝে জমি ক্রয়-বিক্রয় ও হস্তান্তর"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>জমি ক্রয়-বিক্রয়</span>
            </button>
          )}

          {onOpenMultiGenModal && (
            <button
              onClick={onOpenMultiGenModal}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="এক সাথে একাধিক প্রজন্মের ওয়ারিশ বণ্টন"
            >
              <Layers className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">একাধিক প্রজন্ম</span>
            </button>
          )}

          <button
            onClick={onOpenHeirModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>{hasChildren ? '১ম প্রজন্মের ওয়ারিশ পরিবর্তন' : '+ ১ম প্রজন্মের ওয়ারিশ বণ্টন'}</span>
          </button>
        </div>
      </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              মূল মালিকের নাম:
            </label>
            <input
              type="text"
              value={currentName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="মালিকের নাম লিখুন"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Gender Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              লিঙ্গ (ফারায়েজ নিয়ম অনুযায়ী):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderToggle('male')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentGender === 'male'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👨 পুরুষ</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderToggle('female')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  currentGender === 'female'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>👩 মহিলা</span>
              </button>
            </div>
          </div>

          {/* Total Land Input with BengaliNumberInput (no sticky 0) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                মোট সম্পত্তি (শতক / ডেসিমাল):
              </label>
              <div className="text-right">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  {toBengaliNumber(katha, 2)} কাঠা | {toBengaliNumber(bigha, 3)} বিঘা
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  (১ কাঠা = {toBengaliNumber(decimalsPerKatha, 2)} শতক)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustLand(-1)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm cursor-pointer shrink-0 border border-slate-200"
                title="১ শতক কমান"
                aria-label="১ শতক কমান"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative flex-1">
                <BengaliNumberInput
                  value={currentLand}
                  onChange={handleLandChange}
                  placeholder="১০০"
                  className="text-center font-black text-emerald-950 border-emerald-400 bg-slate-50"
                />
              </div>

              <button
                type="button"
                onClick={() => adjustLand(1)}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center text-sm cursor-pointer shrink-0 shadow-xs"
                title="১ শতক বাড়ান"
                aria-label="১ শতক বাড়ান"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center justify-end gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">দ্রুত বাটন:</span>
              <button
                type="button"
                onClick={() => adjustLand(-10)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 cursor-pointer"
              >
                -১০
              </button>
              <button
                type="button"
                onClick={() => adjustLand(10)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 cursor-pointer"
              >
                +১০
              </button>
              <button
                type="button"
                onClick={() => adjustLand(50)}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 cursor-pointer"
              >
                +৫০
              </button>
              <button
                type="button"
                onClick={() => handleLandChange(100)}
                className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-[10px] font-bold text-emerald-800 cursor-pointer"
              >
                ১০০ শতক
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

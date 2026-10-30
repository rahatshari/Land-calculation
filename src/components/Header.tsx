import React from 'react';
import { 
  GitFork, 
  Table, 
  FileText, 
  Calculator, 
  Sparkles, 
  RotateCcw,
  ArrowRightLeft
} from 'lucide-react';
import { HeirTreeNode } from '../types';
import { toBengaliNumber } from '../utils/faraizCalculator';
import { countTotalHeirs, getMaxGeneration } from '../utils/treeManager';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  rootNode: HeirTreeNode;
  activeView: 'tree' | 'table';
  onToggleView: (view: 'tree' | 'table') => void;
  onOpenReport: () => void;
  onOpenConverter: () => void;
  onOpenTransactions: () => void;
  onLoadSample: () => void;
  onClearTree: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  rootNode,
  activeView,
  onToggleView,
  onOpenReport,
  onOpenConverter,
  onOpenTransactions,
  onLoadSample,
  onClearTree,
}) => {
  const totalHeirs = countTotalHeirs(rootNode);
  const maxGen = getMaxGeneration(rootNode);

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img
            src="./icon.svg"
            alt="ফারায়েজ ও উত্তরাধিকার লোগো"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shadow-md shadow-emerald-900/10 object-contain hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                উত্তরাধিকার ও জমির হিসাব বৃক্ষ
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                বাংলাদেশ ফারায়েজ আইন
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
              মুসলিম পারিবারিক আইন অধ্যাদেশ ১৯৬১ ও পবিত্র কুরআন অনুযায়ী বংশবৃক্ষ বণ্টন
            </p>
          </div>
        </div>

        {/* Center Quick Stats (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500">মালিক:</span>{' '}
            <strong className="text-emerald-800 font-bold">{rootNode.name}</strong>
          </div>

          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500">মোট জমি:</span>{' '}
            <strong className="text-emerald-800 font-black">
              {toBengaliNumber(rootNode.totalEstate, 2)} শতক
            </strong>
          </div>

          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500">ওয়ারিশ:</span>{' '}
            <strong className="text-slate-900 font-bold">
              {toBengaliNumber(totalHeirs, 0)} জন
            </strong>
          </div>

          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700">
            <span className="text-slate-500">প্রজন্ম:</span>{' '}
            <strong className="text-slate-900 font-bold">
              {toBengaliNumber(maxGen, 0)}
            </strong>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Land Transaction Buy/Sell Button */}
          <button
            onClick={onOpenTransactions}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            title="অংশীদারদের মধ্যে জমি ক্রয়-বিক্রয় ও হস্তান্তর হিসাব"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">জমি ক্রয়-বিক্রয়</span>
          </button>

          {/* Converter Button */}
          <button
            onClick={onOpenConverter}
            className="px-2.5 py-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200 text-xs font-semibold flex items-center gap-1.5"
            title="জমির একক রূপান্তর (শতক, কাঠা, বিঘা)"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">একক রূপান্তর</span>
          </button>

          {/* Sample Load button */}
          <button
            onClick={onLoadSample}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="নমুনা তথ্য লোড করে পরীক্ষা করুন"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">নমুনা পরীক্ষা</span>
          </button>

          {/* Clear / New Tree button */}
          <button
            onClick={onClearTree}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
            title="নতুন খালি হিসাব শুরু করুন"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Quick Stats strip */}
        <div className="flex md:hidden w-full items-center justify-between gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px]">
          <div className="truncate">
            <span className="text-slate-500">মালিক:</span> <strong className="text-emerald-900 font-bold">{rootNode.name}</strong>
          </div>
          <div className="shrink-0">
            <span className="text-slate-500">জমি:</span> <strong className="text-emerald-900 font-black">{toBengaliNumber(rootNode.totalEstate, 1)} শতক</strong>
          </div>
          <div className="shrink-0">
            <span className="text-slate-500">ওয়ারিশ:</span> <strong className="text-slate-900 font-bold">{toBengaliNumber(totalHeirs, 0)} জন</strong>
          </div>
        </div>
      </div>

      {/* Navigation & View Switcher Sub-bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => onToggleView('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'tree'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 rotate-90" />
            <span>বংশবৃক্ষ (Tree)</span>
          </button>
          <button
            onClick={() => onToggleView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'table'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>খতিয়ান (Table)</span>
          </button>
        </div>

        {/* Report / Download Button */}
        <button
          onClick={onOpenReport}
          className="px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>রিপোর্ট ও সনদ (PDF)</span>
        </button>
      </div>
    </header>
  );
};

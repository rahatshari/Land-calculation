import React, { useRef } from 'react';
import { X, Printer, Download, Award, Scale, CheckCircle, ShieldCheck } from 'lucide-react';
import { HeirTreeNode } from '../types';
import { exportToCSV, flattenTreeForReport } from '../utils/treeManager';
import { toBengaliNumber, decimalToAnaGanda } from '../utils/faraizCalculator';

interface ReportModalProps {
  rootNode: HeirTreeNode;
  onClose: () => void;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  rootNode,
  onClose,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
}) => {
  const allRows = flattenTreeForReport(rootNode, decimalsPerKatha, kathaPerBigha);
  const gen1Rows = allRows.filter((r) => r.generation === 1);
  const totalGen1Land = gen1Rows.reduce((acc, r) => acc + r.inheritedEstate, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(rootNode, decimalsPerKatha, kathaPerBigha);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `উত্তরাধিকার_বণ্টন_প্রতিবেদন_${rootNode.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">উত্তরাধিকার ফারায়েজ বণ্টন সনদ ও পূর্ণাঙ্গ রিপোর্ট</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV / Excel ডাউনলোড</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সেভ করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto print-container bg-white text-slate-900">
          {/* Official Document Seal & Header */}
          <div className="text-center border-b-2 border-emerald-900 pb-6 mb-6">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full border-2 border-emerald-800 flex items-center justify-center bg-emerald-50/50">
              <Scale className="w-9 h-9 text-emerald-800" />
            </div>
            <span className="text-xs uppercase tracking-widest text-emerald-900 font-bold block">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুসৃত নীতি
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 mt-1">
              মুসলিম পারিবারিক আইন অনুযায়ী উত্তরাধিকার বণ্টন ও ফারায়েজ খতিয়ান
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              (মুসলিম পারিবারিক আইন অধ্যাদেশ ১৯৬১ ও পবিত্র আল-কুরআনের সূরা নিসা-র উত্তরাধিকার বিধিমোতাবেক)
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">মূল স্বত্বাধিকারীর নাম:</span>
              <strong className="text-slate-900 text-sm">{rootNode.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">বণ্টনযোগ্য মোট সম্পত্তি:</span>
              <strong className="text-emerald-700 text-sm">
                {toBengaliNumber(rootNode.totalEstate, 2)} শতক
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">মোট উত্তরাধিকারীর সংখ্যা:</span>
              <strong className="text-slate-900 text-sm">
                {toBengaliNumber(allRows.length, 0)} জন
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">সনদ তৈরির তারিখ:</span>
              <strong className="text-slate-900 text-sm">
                {toBengaliNumber(new Date().toLocaleDateString('bn-BD'), 0)} খ্রি.
              </strong>
            </div>
          </div>

          {/* Section 1: Generation 1 Distribution (User's primary heirs) */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-emerald-900 uppercase border-b border-emerald-200 pb-1 mb-3 flex items-center justify-between">
              <span>১ম প্রজন্ম: মূল ওয়ারিশগণের হিস্যা ও বণ্টনের তফসিল</span>
              <span className="text-xs text-slate-600 font-normal">
                মোট অংশ: {toBengaliNumber(totalGen1Land, 2)} শতক (১৬ আনা)
              </span>
            </h3>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300 text-center w-10">ক্র.নং</th>
                  <th className="p-2 border-r border-slate-300">ওয়ারিশের নাম</th>
                  <th className="p-2 border-r border-slate-300">সম্পর্ক</th>
                  <th className="p-2 border-r border-slate-300 text-center">হিস্যা (ভগ্নাংশ)</th>
                  <th className="p-2 border-r border-slate-300 text-right">শতক (শতাংশ)</th>
                  <th className="p-2 border-r border-slate-300 text-right">কাঠা</th>
                  <th className="p-2 border-r border-slate-300 text-right">আনা-গণ্ডা</th>
                  <th className="p-2">আইনি সূত্র ও কোরআনিক বিধান</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gen1Rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="p-2 text-center border-r border-slate-200 font-medium">{toBengaliNumber(i + 1, 0)}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{r.name}</td>
                    <td className="p-2 border-r border-slate-200">{r.relationshipBn}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-800">{r.shareFractionStr}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-800">{toBengaliNumber(r.totalEstate, 2)} শতক</td>
                    <td className="p-2 border-r border-slate-200 text-right">{toBengaliNumber(r.landKatha, 2)} কাঠা</td>
                    <td className="p-2 border-r border-slate-200 text-right">{decimalToAnaGanda(r.sharePercentage / 100)}</td>
                    <td className="p-2 text-[11px] text-slate-600">{r.legalReasonBn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: Subsequent Generations (Multi-generational tree descendants) */}
          {allRows.some((r) => r.generation > 1) && (
            <div className="mb-6 break-inside-avoid">
              <h3 className="text-sm font-bold text-teal-900 uppercase border-b border-teal-200 pb-1 mb-3">
                পরবর্তী প্রজন্ম: ওয়ারিশগণের সন্তান-সন্ততিদের মধ্যে পুনর্বণ্টন তফসিল
              </h3>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead>
                  <tr className="bg-teal-50 text-teal-950 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 text-center w-10">ক্র.নং</th>
                    <th className="p-2 border-r border-slate-300">ওয়ারিশের নাম</th>
                    <th className="p-2 border-r border-slate-300">সম্পর্ক</th>
                    <th className="p-2 border-r border-slate-300">পিতা/মাতার নাম</th>
                    <th className="p-2 border-r border-slate-300 text-center">হিস্যা</th>
                    <th className="p-2 border-r border-slate-300 text-right">প্রাপ্ত জমি</th>
                    <th className="p-2 border-r border-slate-300 text-right">কাঠা</th>
                    <th className="p-2">আইনি ভিত্তি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allRows
                    .filter((r) => r.generation > 1)
                    .map((r, i) => (
                      <tr key={r.id}>
                        <td className="p-2 text-center border-r border-slate-200 font-medium">{toBengaliNumber(i + 1, 0)}</td>
                        <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{r.name}</td>
                        <td className="p-2 border-r border-slate-200">{r.relationshipBn}</td>
                        <td className="p-2 border-r border-slate-200 text-slate-700">{r.parentName}</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-amber-800">{r.shareFractionStr}</td>
                        <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-800">{toBengaliNumber(r.totalEstate, 2)} শতক</td>
                        <td className="p-2 border-r border-slate-200 text-right">{toBengaliNumber(r.landKatha, 2)} কাঠা</td>
                        <td className="p-2 text-[11px] text-slate-600">{r.legalReasonBn}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legal Certification Note */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs text-slate-700 mb-8 break-inside-avoid">
            <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>আইনি বৈধতা ও প্রত্যয়ন বিবরণ:</span>
            </h4>
            <p className="leading-relaxed">
              উক্ত ফারায়েয ও সম্পত্তির বণ্টন ইসলামিক শরীয়াহ মোতাবেক ও বাংলাদেশ সরকারের মুসলিম পারিবারিক আইন অধ্যাদেশ ১৯৬১ (Muslim Family Laws Ordinance, 1961) এর ধারা ৪ এবং উত্তরাধিকার আইন অনুসারে সঠিক গাণিতিক অনুপাতে নিরূপিত হয়েছে। সম্পত্তি বিভাজনে কোনো পক্ষ সংক্ষুব্ধ হলে স্থানীয় সহকারী কমিশনার (ভূমি) অথবা উপযুক্ত দেওয়ানি আদালতের শরণাপন্ন হতে পারবেন।
            </p>
          </div>

          {/* Official Signatures Row */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-300 text-center text-xs break-inside-avoid">
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1 h-10" />
              <strong className="block text-slate-900">আমিন / ভূমি সার্ভেয়ার</strong>
              <span className="text-[10px] text-slate-500">স্বাক্ষর ও তারিখ</span>
            </div>
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1 h-10" />
              <strong className="block text-slate-900">ওয়ারিশগণের প্রতিনিধি</strong>
              <span className="text-[10px] text-slate-500">সম্মতি স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-36 mx-auto border-b border-slate-400 mb-1 h-10" />
              <strong className="block text-slate-900">সনদ প্রদানকারী কর্মকর্তা / কাজী</strong>
              <span className="text-[10px] text-slate-500">সিলমোহর ও স্বাক্ষর</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

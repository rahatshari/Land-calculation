import React from 'react';
import { X, Printer, Download, Award, FileText, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { HeirTreeNode, LandTransaction } from '../types';
import { exportToCSV, flattenTreeForReport, FlatHeirRow } from '../utils/treeManager';
import { toBengaliNumber, decimalToAnaGanda } from '../utils/faraizCalculator';

interface ReportModalProps {
  rootNode: HeirTreeNode;
  transactions?: LandTransaction[];
  onClose: () => void;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  rootNode,
  transactions = [],
  onClose,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
}) => {
  const allRows = flattenTreeForReport(rootNode, decimalsPerKatha, kathaPerBigha);

  // Group rows by generation
  const generationsMap = new Map<number, FlatHeirRow[]>();
  for (const r of allRows) {
    const list = generationsMap.get(r.generation) || [];
    list.push(r);
    generationsMap.set(r.generation, list);
  }

  const generationNumbers = Array.from(generationsMap.keys()).sort((a, b) => a - b);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(rootNode, decimalsPerKatha, kathaPerBigha);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `উত্তরাধিকার_খতিয়ান_${rootNode.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 px-4 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">উত্তরাধিকার ও জমির হিসাব বণ্টন প্রতিবেদন (PDF)</h3>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                প্রতিটি প্রজন্মের জন্য আলাদা পৃষ্ঠায় সাজানো প্রিন্ট ও পিডিএফ ভিউ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV ডাউনলোড</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সংরক্ষণ করুন</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Multi-Page Document Body */}
        <div className="p-4 sm:p-10 overflow-y-auto bg-white text-slate-900 print-document space-y-8">
          {/* Print Styles for distinct page breaks per generation */}
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              .print-document {
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              .generation-page {
                page-break-after: always !important;
                break-after: page !important;
                min-height: 98vh;
                padding: 20px 0;
              }
              .generation-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
              table {
                font-size: 11px !important;
              }
            }
          `}</style>

          {generationNumbers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              এখনো কোনো উত্তরাধিকারী যুক্ত করা হয়নি। দয়া করে বৃক্ষে উত্তরাধিকারী যোগ করুন।
            </div>
          ) : (
            generationNumbers.map((genNum, pageIdx) => {
              const rows = generationsMap.get(genNum) || [];
              const genInherited = rows.reduce((acc, r) => acc + r.inheritedEstate, 0);
              const genBought = rows.reduce((acc, r) => acc + r.landBought, 0);
              const genSold = rows.reduce((acc, r) => acc + r.landSold, 0);
              const genNetTotal = rows.reduce((acc, r) => acc + r.currentTotalLand, 0);

              return (
                <div key={genNum} className="generation-page space-y-6">
                  {/* Document Header for each page */}
                  <div className="border-b-2 border-emerald-900 pb-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-widest text-emerald-900 font-bold">
                        পারিবারিক ফারায়েজ ও জমি বণ্টন খতিয়ান
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-emerald-950">
                      {genNum === 1
                        ? '১ম প্রজন্ম: মূল ওয়ারিশগণের ফারায়েজ ও জমি বণ্টন খতিয়ান'
                        : `${toBengaliNumber(genNum, 0)}য় প্রজন্ম: উত্তরাধিকারীগণের জমি বণ্টন ও পুনর্বণ্টন খতিয়ান`}
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      মূল স্বত্বাধিকারী: <strong className="text-slate-900">{rootNode.name}</strong> • আদি জোত: {toBengaliNumber(rootNode.totalEstate, 2)} শতক • পৃষ্ঠা: {toBengaliNumber(pageIdx + 1, 0)}/{toBengaliNumber(generationNumbers.length, 0)}
                    </p>
                  </div>

                  {/* Summary Metric Cards for this Generation */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">মোট উত্তরাধিকারী:</span>
                      <strong className="text-slate-900 text-sm">{toBengaliNumber(rows.length, 0)} জন</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">উত্তরাধিকার প্রাপ্ত জমি:</span>
                      <strong className="text-emerald-800 text-sm">{toBengaliNumber(genInherited, 2)} শতক</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ক্রয় / বিক্রয় সমন্বয়:</span>
                      <strong className="text-slate-800 text-sm">
                        +{toBengaliNumber(genBought, 2)} / -{toBengaliNumber(genSold, 2)} শতক
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">বর্তমান কার্যকর জমি:</span>
                      <strong className="text-emerald-900 font-black text-sm">{toBengaliNumber(genNetTotal, 2)} শতক</strong>
                    </div>
                  </div>

                  {/* Generation Table (Pure Land and Share Data, NO legal law citations) */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-300">
                      <thead>
                        <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-slate-300">
                          <th className="p-2.5 border-r border-slate-300 text-center w-10">ক্র.নং</th>
                          <th className="p-2.5 border-r border-slate-300">অংশীদারের নাম</th>
                          <th className="p-2.5 border-r border-slate-300">সম্পর্ক</th>
                          <th className="p-2.5 border-r border-slate-300 text-center">হিস্যা (অংশ)</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">মূল প্রাপ্ত জমি (শতক)</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">ক্রয় (+)</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">বিক্রয় (-)</th>
                          <th className="p-2.5 border-r border-slate-300 text-right bg-emerald-100/60 font-black">
                            বর্তমান মোট জমি (শতক)
                          </th>
                          <th className="p-2.5 border-r border-slate-300 text-right">কাঠা (৩.৩০ শতকে)</th>
                          <th className="p-2.5 border-r border-slate-300 text-right">বিঘা (২০ কাঠায়)</th>
                          <th className="p-2.5 text-right">আনা-গণ্ডা</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {rows.map((row, idx) => {
                          const anaGanda = decimalToAnaGanda(row.sharePercentage / 100);
                          return (
                            <tr
                              key={row.id}
                              className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                            >
                              <td className="p-2 border-r border-slate-300 text-center font-bold text-slate-500">
                                {toBengaliNumber(idx + 1, 0)}
                              </td>
                              <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                                {row.name}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-slate-700">
                                {row.relationshipBn}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-center font-bold text-amber-900">
                                {row.shareFractionStr} ({toBengaliNumber(row.sharePercentage, 2)}%)
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right text-slate-800">
                                {toBengaliNumber(row.inheritedEstate, 2)}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right text-emerald-700 font-semibold">
                                {row.landBought > 0 ? `+${toBengaliNumber(row.landBought, 2)}` : '—'}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right text-rose-700 font-semibold">
                                {row.landSold > 0 ? `-${toBengaliNumber(row.landSold, 2)}` : '—'}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right bg-emerald-50 font-black text-emerald-950">
                                {toBengaliNumber(row.currentTotalLand, 2)}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right font-medium text-slate-700">
                                {toBengaliNumber(row.landKatha, 2)}
                              </td>
                              <td className="p-2 border-r border-slate-300 text-right font-medium text-slate-700">
                                {toBengaliNumber(row.landBigha, 3)}
                              </td>
                              <td className="p-2 text-right text-slate-600 font-semibold text-[11px]">
                                {anaGanda}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={4} className="p-2.5 border-r border-slate-300 text-right">
                            মোট যোগফল:
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right">
                            {toBengaliNumber(genInherited, 2)} শতক
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right text-emerald-800">
                            +{toBengaliNumber(genBought, 2)}
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right text-rose-800">
                            -{toBengaliNumber(genSold, 2)}
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right bg-emerald-200/60 text-emerald-950 font-black">
                            {toBengaliNumber(genNetTotal, 2)} শতক
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right">
                            {toBengaliNumber(genNetTotal / decimalsPerKatha, 2)}
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right">
                            {toBengaliNumber(genNetTotal / (decimalsPerKatha * kathaPerBigha), 3)}
                          </td>
                          <td className="p-2.5 text-right">১৬ আনা</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Generation Land Transactions / Buy-Sell notes if any occurred among these members */}
                  {transactions.length > 0 && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1.5">
                      <span className="font-bold text-amber-950 uppercase tracking-wide block flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                        <span>অভ্যন্তরীণ জমি ক্রয়-বিক্রয় ও হস্তান্তর বিবরণী:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                        {transactions
                          .filter(
                            (t) =>
                              rows.some((r) => r.id === t.sellerId) ||
                              rows.some((r) => r.id === t.buyerId)
                          )
                          .map((t) => (
                            <div key={t.id} className="p-2 bg-white rounded border border-amber-200/80">
                              • <strong>{t.sellerName}</strong> বিক্রয় করেছেন <strong>{t.buyerName}</strong>-এর নিকট: <strong className="text-emerald-800">{toBengaliNumber(t.amountDecimals, 2)} শতক</strong> {t.note && `(${t.note})`}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Signatures & Certification block at bottom of generation page */}
                  <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
                    <div className="border-t border-slate-400 pt-2">
                      <span>হিসাব প্রস্তুতকারীর স্বাক্ষর</span>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <span>অংশীদারগণের সম্মতি ও স্বাক্ষর</span>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <span>পারিবারিক প্রধান / আমিনের স্বাক্ষর</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            নোট: প্রিন্ট বাটনে চাপ দিলে ব্রাউজারে ‘Save as PDF’ সিলেক্ট করে ফুল কোয়ালিটি পিডিএফ ফাইল সংরক্ষণ করতে পারবেন।
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

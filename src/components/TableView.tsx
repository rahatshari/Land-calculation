import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, FileText, ArrowUpDown, Layers, Plus } from 'lucide-react';
import { HeirTreeNode } from '../types';
import { flattenTreeForReport, FlatHeirRow } from '../utils/treeManager';
import { toBengaliNumber, decimalToAnaGanda } from '../utils/faraizCalculator';

interface TableViewProps {
  rootNode: HeirTreeNode;
  decimalsPerKatha?: number;
  onSelectNodeForHeirs: (node: HeirTreeNode) => void;
  onOpenReport: () => void;
}

export const TableView: React.FC<TableViewProps> = ({
  rootNode,
  decimalsPerKatha = 3.30,
  onSelectNodeForHeirs,
  onOpenReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<number | 'all'>('all');

  const allRows = useMemo(() => flattenTreeForReport(rootNode, decimalsPerKatha, 20), [rootNode, decimalsPerKatha]);

  // Unique generations
  const generations = useMemo(() => {
    const gens = new Set<number>();
    allRows.forEach((r) => gens.add(r.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [allRows]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      const matchSearch =
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.relationshipBn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGen =
        selectedGeneration === 'all' || row.generation === selectedGeneration;
      return matchSearch && matchGen;
    });
  }, [allRows, searchTerm, selectedGeneration]);

  // Aggregate stats
  const totalLandAllocated = useMemo(() => {
    // Gen 1 sum represents full property of root
    const gen1Rows = allRows.filter((r) => r.generation === 1);
    return gen1Rows.reduce((acc, r) => acc + r.inheritedEstate, 0);
  }, [allRows]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              খতিয়ান ও উত্তরাধিকারী তালিকা বিবরণী
            </h3>
            <p className="text-xs text-slate-500">
              সর্বমোট ওয়ারিশ সংখ্যা: {toBengaliNumber(allRows.length, 0)} জন | মূল বণ্টনকৃত জমি: {toBengaliNumber(totalLandAllocated, 2)} শতক
            </p>
          </div>
        </div>

        {/* Search & Filter & Report */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম বা সম্পর্ক খুঁজুন..."
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
            />
          </div>

          {/* Generation filter */}
          <select
            value={selectedGeneration}
            onChange={(e) =>
              setSelectedGeneration(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">সকল প্রজন্ম (All)</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                প্রজন্ম {toBengaliNumber(g, 0)}
              </option>
            ))}
          </select>

          {/* Report Button */}
          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>সনদ ও রিপোর্ট দেখুন</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <th className="px-4 py-3 text-center w-12">ক্র.নং</th>
              <th className="px-4 py-3">ওয়ারিশের নাম</th>
              <th className="px-4 py-3">সম্পর্ক</th>
              <th className="px-4 py-3">প্রজন্ম</th>
              <th className="px-4 py-3">পিতা/মাতা</th>
              <th className="px-4 py-3">হিস্যা (ভগ্নাংশ)</th>
              <th className="px-4 py-3">প্রাপ্ত জমি (শতক)</th>
              <th className="px-4 py-3">কাঠা ও বিঘা</th>
              <th className="px-4 py-3">আনা-গণ্ডা-কড়া</th>
              <th className="px-4 py-3">আইনি বিধান ও দলিল সূত্র</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  কোনো ওয়ারিশের তথ্য পাওয়া যায়নি।
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center font-bold text-slate-500">
                    {toBengaliNumber(row.sl, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {row.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {row.relationshipBn}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-600">
                    প্রজন্ম {toBengaliNumber(row.generation, 0)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.parentName}</td>
                  <td className="px-4 py-3 font-bold text-amber-700">
                    {row.shareFractionStr}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({toBengaliNumber(row.sharePercentage, 1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-3 font-extrabold text-emerald-700 text-sm">
                    {toBengaliNumber(row.totalEstate, 2)} শতক
                    {row.extraEstate > 0 && (
                      <span className="block text-[10px] text-slate-500 font-normal">
                        (উত্তরাধিকার {toBengaliNumber(row.inheritedEstate, 2)} + নিজস্ব {toBengaliNumber(row.extraEstate, 2)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div>{toBengaliNumber(row.landKatha, 2)} কাঠা</div>
                    <div className="text-[10px] text-slate-500">
                      {toBengaliNumber(row.landBigha, 3)} বিঘা
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-700 font-medium">
                    {decimalToAnaGanda(row.sharePercentage / 100)}
                  </td>
                  <td
                    className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate"
                    title={row.legalReasonBn}
                  >
                    {row.legalReasonBn}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

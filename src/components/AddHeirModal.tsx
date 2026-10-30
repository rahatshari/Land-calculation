import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, UserPlus, Check, Sparkles, Scale, Info, PlusCircle, Trash2 } from 'lucide-react';
import { HeirCountInput, HeirTreeNode, IndividualHeirConfig, RelationshipType } from '../types';
import { calculateFaraizDistribution, toBengaliNumber } from '../utils/faraizCalculator';

interface AddHeirModalProps {
  targetNode: HeirTreeNode | null;
  onClose: () => void;
  onSaveHeirs: (
    nodeId: string,
    inputConfig: HeirCountInput,
    namedHeirs: IndividualHeirConfig[],
    extraLand: number
  ) => void;
}

export const AddHeirModal: React.FC<AddHeirModalProps> = ({
  targetNode,
  onClose,
  onSaveHeirs,
}) => {
  if (!targetNode) return null;

  const isMale = targetNode.gender === 'male';
  const initialConfig = targetNode.inputConfig || {
    husband: 0,
    wives: isMale ? 1 : 0,
    sons: 1,
    daughters: 1,
    father: false,
    mother: false,
    grandfather: false,
    grandmother: false,
    brothers: 0,
    sisters: 0,
  };

  const [inputConfig, setInputConfig] = useState<HeirCountInput>(initialConfig);
  const [extraLand, setExtraLand] = useState<number>(targetNode.extraEstate || 0);
  const [showExtended, setShowExtended] = useState(false);
  const [namedHeirs, setNamedHeirs] = useState<IndividualHeirConfig[]>(
    targetNode.namedHeirs || []
  );

  // Sync named heirs list whenever counts change
  useEffect(() => {
    const updated: IndividualHeirConfig[] = [];

    // Spouse
    if (isMale) {
      for (let i = 0; i < inputConfig.wives; i++) {
        const id = `${targetNode.id}-wife-${i + 1}`;
        const existing = namedHeirs.find((h) => h.id === id);
        updated.push(
          existing || {
            id,
            name: inputConfig.wives > 1 ? `স্ত্রী ${toBengaliNumber(i + 1, 0)}` : 'স্ত্রী',
            relationship: 'wife',
            relationshipBn: 'স্ত্রী',
            gender: 'female',
          }
        );
      }
    } else {
      if (inputConfig.husband > 0) {
        const id = `${targetNode.id}-husband-1`;
        const existing = namedHeirs.find((h) => h.id === id || h.relationship === 'husband');
        updated.push(
          existing || {
            id,
            name: 'স্বামী',
            relationship: 'husband',
            relationshipBn: 'স্বামী',
            gender: 'male',
          }
        );
      }
    }

    // Sons
    for (let i = 0; i < inputConfig.sons; i++) {
      const id = `${targetNode.id}-son-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `ছেলে ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'son',
          relationshipBn: 'পুত্র',
          gender: 'male',
        }
      );
    }

    // Daughters
    for (let i = 0; i < inputConfig.daughters; i++) {
      const id = `${targetNode.id}-daughter-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `মেয়ে ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'daughter',
          relationshipBn: 'কন্যা',
          gender: 'female',
        }
      );
    }

    // Parents
    if (inputConfig.father) {
      const id = `${targetNode.id}-father-1`;
      const existing = namedHeirs.find((h) => h.id === id || h.relationship === 'father');
      updated.push(
        existing || {
          id,
          name: 'পিতা',
          relationship: 'father',
          relationshipBn: 'পিতা',
          gender: 'male',
        }
      );
    }
    if (inputConfig.mother) {
      const id = `${targetNode.id}-mother-1`;
      const existing = namedHeirs.find((h) => h.id === id || h.relationship === 'mother');
      updated.push(
        existing || {
          id,
          name: 'মাতা',
          relationship: 'mother',
          relationshipBn: 'মাতা',
          gender: 'female',
        }
      );
    }

    setNamedHeirs(updated);
  }, [
    inputConfig.wives,
    inputConfig.husband,
    inputConfig.sons,
    inputConfig.daughters,
    inputConfig.father,
    inputConfig.mother,
    isMale,
  ]);

  // Total estate available to distribute
  const currentTotalEstate = (targetNode.inheritedEstate || 0) + (extraLand || 0);

  // Live preview calculation
  const previewShares = useMemo(() => {
    return calculateFaraizDistribution(
      targetNode.gender,
      currentTotalEstate,
      inputConfig,
      namedHeirs
    );
  }, [targetNode.gender, currentTotalEstate, inputConfig, namedHeirs]);

  const handleNameChange = (id: string, newName: string) => {
    setNamedHeirs((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: newName } : h))
    );
  };

  const handleSave = () => {
    onSaveHeirs(targetNode.id, inputConfig, namedHeirs, extraLand);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                ওয়ারিশ ও উত্তরাধিকারী বণ্টন বিন্যাস
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100">
                স্বত্বাধিকারী: <strong className="text-white">{targetNode.name}</strong> ({targetNode.relationshipBn}) | মোট জমি: <strong className="text-amber-300">{toBengaliNumber(currentTotalEstate, 2)} শতক</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4 sm:space-y-6">
          {/* Section: Extra Land Added */}
          {targetNode.relationship !== 'root' && (
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-emerald-950 block">
                  উত্তরাধিকার প্রাপ্ত জমি: {toBengaliNumber(targetNode.inheritedEstate, 2)} শতক
                </label>
                <span className="text-[11px] text-emerald-700">
                  উক্ত ব্যক্তির নিজের কেনা/অর্জিত অতিরিক্ত জমি থাকলে এখানে যোগ করতে পারেন:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">+ নিজস্ব জমি:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraLand}
                  onChange={(e) => setExtraLand(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">শতক</span>
              </div>
            </div>
          )}

          {/* Section: Primary Heirs Count */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>ওয়ারিশদের সংখ্যা নির্ধারণ করুন (বাংলাদেশ ফারায়েজ আইনানুসারে)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Spouse */}
              {isMale ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">স্ত্রী (Wife)</label>
                    <span className="text-[10px] text-slate-500">সন্তান থাকলে ১/৮ অংশ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputConfig({ ...inputConfig, wives: Math.max(0, inputConfig.wives - 1) })}
                      className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-slate-800 text-sm">
                      {toBengaliNumber(inputConfig.wives, 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputConfig({ ...inputConfig, wives: Math.min(4, inputConfig.wives + 1) })}
                      className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">স্বামী (Husband)</label>
                    <span className="text-[10px] text-slate-500">সন্তান থাকলে ১/৪ অংশ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInputConfig({ ...inputConfig, husband: 0 })}
                      className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        inputConfig.husband === 0 ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      না
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputConfig({ ...inputConfig, husband: 1 })}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        inputConfig.husband === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      হ্যাঁ
                    </button>
                  </div>
                </div>
              )}

              {/* Sons */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">ছেলে / পুত্র সন্তান</label>
                  <span className="text-[10px] text-slate-500">আছাবা (২ অংশ পাবে)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, sons: Math.max(0, inputConfig.sons - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">
                    {toBengaliNumber(inputConfig.sons, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, sons: inputConfig.sons + 1 })}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Daughters */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">মেয়ে / কন্যা সন্তান</label>
                  <span className="text-[10px] text-slate-500">পুত্রের অর্ধেক (১ অংশ পাবে)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, daughters: Math.max(0, inputConfig.daughters - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">
                    {toBengaliNumber(inputConfig.daughters, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, daughters: inputConfig.daughters + 1 })}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Father */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">পিতা (জীবিত?)</label>
                  <span className="text-[10px] text-slate-500">সন্তান থাকলে ১/৬ অংশ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, father: false })}
                    className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      !inputConfig.father ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    না
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, father: true })}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      inputConfig.father ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    হ্যাঁ
                  </button>
                </div>
              </div>

              {/* Mother */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">মাতা (জীবিত?)</label>
                  <span className="text-[10px] text-slate-500">সন্তান থাকলে ১/৬ অংশ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, mother: false })}
                    className={`px-2 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      !inputConfig.mother ? 'bg-slate-300 text-slate-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    না
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputConfig({ ...inputConfig, mother: true })}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      inputConfig.mother ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    হ্যাঁ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Custom Names for Heirs */}
          {namedHeirs.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ওয়ারিশদের সুনির্দিষ্ট নাম লিখুন (ঐচ্ছিক):
                </h4>
                <span className="text-[11px] text-slate-500">বংশবৃক্ষে এই নামগুলো প্রদর্শিত হবে</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {namedHeirs.map((heir) => (
                  <div key={heir.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                      {heir.relationshipBn}:
                    </span>
                    <input
                      type="text"
                      value={heir.name}
                      onChange={(e) => handleNameChange(heir.id, e.target.value)}
                      placeholder={heir.name}
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Live Preview of Shares */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>ফারায়েজ বণ্টন ফলাফল তাৎক্ষণিক প্রিভিউ (Live Preview):</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">ওয়ারিশের নাম ও সম্পর্ক</th>
                    <th className="px-3 py-2">অংশ (ভগ্নাংশ)</th>
                    <th className="px-3 py-2">শতক (শতাংশ)</th>
                    <th className="px-3 py-2">কাঠা</th>
                    <th className="px-3 py-2">আইনি ভিত্তি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {previewShares.map((share, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {share.name}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({share.relationshipBn})
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-amber-600">
                        {share.shareFractionStr}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({toBengaliNumber(share.sharePercentage, 1)}%)
                        </span>
                      </td>
                      <td className="px-3 py-2 font-bold text-emerald-700">
                        {toBengaliNumber(share.landDecimals, 2)} শতক
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {toBengaliNumber(share.landKatha, 2)} কাঠা
                      </td>
                      <td className="px-3 py-2 text-[10px] text-slate-500 max-w-[200px] truncate" title={share.legalReasonBn}>
                        {share.legalReasonBn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer text-center"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>সংরক্ষণ করুন ও বংশবৃক্ষে যোগ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

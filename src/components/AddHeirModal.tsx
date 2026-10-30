import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, UserPlus, Check, Sparkles, Scale, Info, PlusCircle, Trash2, HeartHandshake } from 'lucide-react';
import { HeirCountInput, HeirTreeNode, IndividualHeirConfig, RelationshipType } from '../types';
import { calculateFaraizDistribution, toBengaliNumber } from '../utils/faraizCalculator';
import { BengaliNumberInput } from './BengaliNumberInput';

interface AddHeirModalProps {
  targetNode: HeirTreeNode | null;
  onClose: () => void;
  onSaveHeirs: (
    nodeId: string,
    inputConfig: HeirCountInput,
    namedHeirs: IndividualHeirConfig[],
    extraLand: number
  ) => void;
  decimalsPerKatha?: number;
  kathaPerBigha?: number;
}

export const AddHeirModal: React.FC<AddHeirModalProps> = ({
  targetNode,
  onClose,
  onSaveHeirs,
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20,
}) => {
  if (!targetNode) return null;

  const isMale = targetNode.gender === 'male';

  const defaultEmptyConfig: HeirCountInput = {
    husband: 0,
    wives: 0,
    sons: 0,
    daughters: 0,
    father: false,
    mother: false,
    grandfather: false,
    grandmother: false,
    brothers: 0,
    sisters: 0,
    consanguineBrothers: 0,
    consanguineSisters: 0,
    uterineBrothers: 0,
    uterineSisters: 0,
    sonSons: 0,
    sonDaughters: 0,
    nephews: 0,
    paternalUncles: 0,
    paternalCousins: 0,
  };

  const [inputConfig, setInputConfig] = useState<HeirCountInput>(() => {
    if (targetNode.inputConfig) {
      return { ...defaultEmptyConfig, ...targetNode.inputConfig };
    }
    return {
      ...defaultEmptyConfig,
      // By default clean without forced values
      wives: isMale ? 1 : 0,
      sons: 0,
      daughters: 0,
    };
  });

  const [extraLand, setExtraLand] = useState<number>(targetNode.extraEstate || 0);
  const [activeTab, setActiveTab] = useState<'primary' | 'siblings' | 'extended'>('primary');
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
          name: inputConfig.sons > 1 ? `ছেলে ${toBengaliNumber(i + 1, 0)}` : 'ছেলে',
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
          name: inputConfig.daughters > 1 ? `মেয়ে ${toBengaliNumber(i + 1, 0)}` : 'মেয়ে',
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

    // Grandparents
    if (inputConfig.grandfather) {
      const id = `${targetNode.id}-grandfather-1`;
      const existing = namedHeirs.find((h) => h.id === id || h.relationship === 'paternal_grandfather');
      updated.push(
        existing || {
          id,
          name: 'দাদা',
          relationship: 'paternal_grandfather',
          relationshipBn: 'দাদা',
          gender: 'male',
        }
      );
    }
    if (inputConfig.grandmother) {
      const id = `${targetNode.id}-grandmother-1`;
      const existing = namedHeirs.find((h) => h.id === id || h.relationship === 'paternal_grandmother');
      updated.push(
        existing || {
          id,
          name: 'দাদী/নানী',
          relationship: 'paternal_grandmother',
          relationshipBn: 'দাদী/নানী',
          gender: 'female',
        }
      );
    }

    // Siblings
    for (let i = 0; i < (inputConfig.brothers || 0); i++) {
      const id = `${targetNode.id}-brother-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: (inputConfig.brothers || 0) > 1 ? `সহোদর ভাই ${toBengaliNumber(i + 1, 0)}` : 'সহোদর ভাই',
          relationship: 'brother',
          relationshipBn: 'সহোদর ভাই',
          gender: 'male',
        }
      );
    }
    for (let i = 0; i < (inputConfig.sisters || 0); i++) {
      const id = `${targetNode.id}-sister-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: (inputConfig.sisters || 0) > 1 ? `সহোদর বোন ${toBengaliNumber(i + 1, 0)}` : 'সহোদর বোন',
          relationship: 'sister',
          relationshipBn: 'সহোদর বোন',
          gender: 'female',
        }
      );
    }

    // Uterine Siblings
    for (let i = 0; i < (inputConfig.uterineBrothers || 0); i++) {
      const id = `${targetNode.id}-uterine-brother-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `বৈপিত্রীয় ভাই ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'uterine_brother',
          relationshipBn: 'বৈপিত্রীয় ভাই',
          gender: 'male',
        }
      );
    }
    for (let i = 0; i < (inputConfig.uterineSisters || 0); i++) {
      const id = `${targetNode.id}-uterine-sister-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `বৈপিত্রীয় বোন ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'uterine_sister',
          relationshipBn: 'বৈপিত্রীয় বোন',
          gender: 'female',
        }
      );
    }

    // Nephews, Uncles, Cousins
    for (let i = 0; i < (inputConfig.nephews || 0); i++) {
      const id = `${targetNode.id}-nephew-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `ভাতিজা ${toBengaliNumber(i + 1, 0)} (ভাইয়ের ছেলে)`,
          relationship: 'nephew',
          relationshipBn: 'ভাতিজা',
          gender: 'male',
        }
      );
    }
    for (let i = 0; i < (inputConfig.paternalUncles || 0); i++) {
      const id = `${targetNode.id}-uncle-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `আপন চাচা ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'paternal_uncle',
          relationshipBn: 'আপন চাচা',
          gender: 'male',
        }
      );
    }
    for (let i = 0; i < (inputConfig.paternalCousins || 0); i++) {
      const id = `${targetNode.id}-cousin-${i + 1}`;
      const existing = namedHeirs.find((h) => h.id === id);
      updated.push(
        existing || {
          id,
          name: `চাচাতো ভাই ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'paternal_cousin',
          relationshipBn: 'চাচাতো ভাই',
          gender: 'male',
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
    inputConfig.grandfather,
    inputConfig.grandmother,
    inputConfig.brothers,
    inputConfig.sisters,
    inputConfig.uterineBrothers,
    inputConfig.uterineSisters,
    inputConfig.nephews,
    inputConfig.paternalUncles,
    inputConfig.paternalCousins,
    targetNode.id,
    isMale,
  ]);

  // Live preview distribution
  const liveShares = useMemo(() => {
    const totalDistributable = (targetNode.inheritedEstate || targetNode.totalEstate) + extraLand;
    return calculateFaraizDistribution(
      targetNode.gender,
      totalDistributable,
      inputConfig,
      namedHeirs,
      targetNode.id,
      decimalsPerKatha,
      kathaPerBigha
    );
  }, [targetNode, inputConfig, namedHeirs, extraLand, decimalsPerKatha, kathaPerBigha]);

  const handleNameChange = (id: string, newName: string) => {
    setNamedHeirs((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: newName } : h))
    );
  };

  const handleSave = () => {
    onSaveHeirs(targetNode.id, inputConfig, namedHeirs, extraLand);
    onClose();
  };

  const totalDistributable = (targetNode.inheritedEstate || targetNode.totalEstate) + extraLand;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-emerald-200">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  {targetNode.name}-এর উত্তরাধিকারী বণ্টন ও ফারায়েজ তথ্য
                </h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  প্রজন্ম {toBengaliNumber(targetNode.generation, 0)}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                বণ্টনযোগ্য মোট জমি:{' '}
                <strong className="text-white font-black">
                  {toBengaliNumber(totalDistributable, 2)} শতক
                </strong>
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: All Islamic Heirs Picker */}
          <div className="lg:col-span-7 space-y-4">
            {/* Category Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-bold gap-2 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('primary')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'primary'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                ১. সন্তান ও পিতামাতা
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('siblings')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'siblings'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                ২. ভাই-বোন (নিঃসন্তান অবস্থা)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('extended')}
                className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'extended'
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                ৩. অন্যান্য ওয়ারিশ ও নিজস্ব জমি
              </button>
            </div>

            {/* TAB 1: Primary Heirs */}
            {activeTab === 'primary' && (
              <div className="space-y-4">
                {/* Spouse Selection */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    {isMale ? 'স্ত্রী সংখ্যা:' : 'স্বামী (বেঁচে আছেন কিনা):'}
                  </span>
                  {isMale ? (
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setInputConfig({ ...inputConfig, wives: cnt })}
                          className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            inputConfig.wives === cnt
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cnt === 0 ? 'নেই' : `${toBengaliNumber(cnt, 0)} জন`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInputConfig({ ...inputConfig, husband: 1 })}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          inputConfig.husband > 0
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        স্বামী বেঁচে আছেন
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputConfig({ ...inputConfig, husband: 0 })}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          inputConfig.husband === 0
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        স্বামী মৃত / নেই
                      </button>
                    </div>
                  )}
                </div>

                {/* Sons and Daughters with BengaliNumberInput (no sticky 0) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      পুত্র সংখ্যা (ছেলে):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.sons}
                      onChange={(v) => setInputConfig({ ...inputConfig, sons: Math.round(v) })}
                      placeholder="যেমন: ২"
                      min={0}
                      className="border-slate-300 font-bold text-slate-800"
                    />
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      কন্যা সংখ্যা (মেয়ে):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.daughters}
                      onChange={(v) => setInputConfig({ ...inputConfig, daughters: Math.round(v) })}
                      placeholder="যেমন: ৩"
                      min={0}
                      className="border-slate-300 font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Parents (পিতা ও মাতা) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-800">
                    পিতা ও মাতা (বর্তমানে জীবিত আছেন কিনা):
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={inputConfig.father}
                        onChange={(e) => setInputConfig({ ...inputConfig, father: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">পিতা জীবিত আছেন</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={inputConfig.mother}
                        onChange={(e) => setInputConfig({ ...inputConfig, mother: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">মাতা জীবিত আছেন</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Siblings (Brother/Sister for Childless / Kalala cases) */}
            {activeTab === 'siblings' && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>নিঃসন্তান বা পিতার অবর্তমানে ভাই-বোন ফারায়েজ:</strong> পবিত্র কুরআনের সূরা নিসা-র ১৭৬ ও ১২ নম্বর আয়াত অনুযায়ী সন্তান বা পিতা না থাকলে সহোদর বা বৈপিত্রীয় ভাই-বোনেরা সম্পত্তির বৈধ অংশীদার হন।
                </div>

                {/* Full Siblings (সহোদর ভাই ও বোন) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      সহোদর ভাই সংখ্যা (আপন ভাই):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.brothers}
                      onChange={(v) => setInputConfig({ ...inputConfig, brothers: Math.round(v) })}
                      placeholder="যেমন: ১"
                      min={0}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      সহোদর বোন সংখ্যা (আপন বোন):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.sisters}
                      onChange={(v) => setInputConfig({ ...inputConfig, sisters: Math.round(v) })}
                      placeholder="যেমন: ১"
                      min={0}
                    />
                  </div>
                </div>

                {/* Uterine Siblings (বৈপিত্রীয় ভাই ও বোন - মায়ের দিকের ভাইবোন) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      বৈপিত্রীয় ভাই (মায়ের পেটের ভাই):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.uterineBrothers}
                      onChange={(v) => setInputConfig({ ...inputConfig, uterineBrothers: Math.round(v) })}
                      placeholder="যেমন: ০"
                      min={0}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      বৈপিত্রীয় বোন (মায়ের পেটের বোন):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.uterineSisters}
                      onChange={(v) => setInputConfig({ ...inputConfig, uterineSisters: Math.round(v) })}
                      placeholder="যেমন: ০"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Extended Heirs & Personal Land */}
            {activeTab === 'extended' && (
              <div className="space-y-4">
                {/* Grandparents */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="block text-xs font-bold text-slate-800">
                    দাদা ও দাদী/নানী (পিতা/মাতা মৃত হলে):
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={inputConfig.grandfather}
                        onChange={(e) => setInputConfig({ ...inputConfig, grandfather: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">দাদা জীবিত</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={inputConfig.grandmother}
                        onChange={(e) => setInputConfig({ ...inputConfig, grandmother: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">দাদী / নানী জীবিত</span>
                    </label>
                  </div>
                </div>

                {/* Nephews / Uncles / Cousins (আছাবা হিসেবে) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      ভাতিজা (ভাইয়ের ছেলে):
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.nephews}
                      onChange={(v) => setInputConfig({ ...inputConfig, nephews: Math.round(v) })}
                      placeholder="০"
                      min={0}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      আপন চাচা:
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.paternalUncles}
                      onChange={(v) => setInputConfig({ ...inputConfig, paternalUncles: Math.round(v) })}
                      placeholder="০"
                      min={0}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      চাচাতো ভাই:
                    </label>
                    <BengaliNumberInput
                      value={inputConfig.paternalCousins}
                      onChange={(v) => setInputConfig({ ...inputConfig, paternalCousins: Math.round(v) })}
                      placeholder="০"
                      min={0}
                    />
                  </div>
                </div>

                {/* Extra Personal Land */}
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    {targetNode.name}-এর নিজস্ব অতিরিক্ত সম্পত্তি (শতক):
                  </label>
                  <BengaliNumberInput
                    value={extraLand}
                    onChange={setExtraLand}
                    placeholder="যেমন: ৫ বা ১০"
                    min={0}
                    className="border-emerald-300 text-emerald-950 font-bold"
                  />
                  <span className="text-[11px] text-emerald-700 mt-1 block">
                    উত্তরাধিকার সূত্রে প্রাপ্ত সম্পত্তি ছাড়াও যদি কোনো স্ব-অর্জিত বা ক্রয়কৃত জমি থাকে যা তিনি সন্তানদের দিয়ে যেতে চান।
                  </span>
                </div>
              </div>
            )}

            {/* Custom Individual Heir Names */}
            {namedHeirs.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">
                  ওয়ারিশদের সুনির্দিষ্ট নাম নির্ধারণ (ঐচ্ছিক):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {namedHeirs.map((heir) => (
                    <div key={heir.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-500 min-w-16">
                        {heir.relationshipBn}:
                      </span>
                      <input
                        type="text"
                        value={heir.name}
                        onChange={(e) => handleNameChange(heir.id, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Distribution Preview */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  <span>তাৎক্ষণিক বণ্টন ফলাফল ({toBengaliNumber(liveShares.length, 0)} জন)</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  মোট: {toBengaliNumber(totalDistributable, 2)} শতক
                </span>
              </div>

              {liveShares.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  কোনো ওয়ারিশ নির্বাচিত হয়নি। বাম পাশের মেনু থেকে জীবিত ওয়ারিশ নির্বাচন করুন।
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {liveShares.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900 font-bold block">{s.name}</strong>
                        <span className="text-[11px] text-slate-500">
                          {s.relationshipBn} • {s.shareFractionStr} অংশ ({toBengaliNumber(s.sharePercentage, 2)}%)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-800 block">
                          {toBengaliNumber(s.landDecimals, 2)} শতক
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {toBengaliNumber(s.landKatha, 2)} কাঠা
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>সংরক্ষণ ও বৃক্ষে প্রয়োগ করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

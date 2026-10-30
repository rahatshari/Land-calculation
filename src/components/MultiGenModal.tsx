import React, { useState, useMemo } from 'react';
import { X, Layers, Plus, Minus, Check, Users, Sparkles, ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { HeirCountInput, HeirTreeNode, IndividualHeirConfig, Gender } from '../types';
import { calculateFaraizDistribution, toBengaliNumber } from '../utils/faraizCalculator';
import { recalculateEntireTree } from '../utils/treeManager';

interface MultiGenModalProps {
  rootNode: HeirTreeNode;
  onClose: () => void;
  onSaveEntireTree: (newRoot: HeirTreeNode) => void;
}

interface Gen2ChildConfig {
  id: string;
  name: string;
  gender: Gender;
  enabled: boolean;
  inputConfig: HeirCountInput;
  namedHeirs?: IndividualHeirConfig[];
}

export const MultiGenModal: React.FC<MultiGenModalProps> = ({
  rootNode,
  onClose,
  onSaveEntireTree,
}) => {
  // Generation 1 Config
  const [gen1Wives, setGen1Wives] = useState<number>(rootNode.inputConfig?.wives ?? 0);
  const [gen1Sons, setGen1Sons] = useState<number>(rootNode.inputConfig?.sons ?? 2);
  const [gen1Daughters, setGen1Daughters] = useState<number>(rootNode.inputConfig?.daughters ?? 3);

  // Generation 2 Config for each Gen 1 child
  const [gen2Configs, setGen2Configs] = useState<Record<string, Gen2ChildConfig>>({});
  const [expandedGen1Id, setExpandedGen1Id] = useState<string | null>(null);

  // Step 1: Calculate Gen 1 shares based on root land
  const gen1Shares = useMemo(() => {
    const input: HeirCountInput = {
      husband: 0,
      wives: gen1Wives,
      sons: gen1Sons,
      daughters: gen1Daughters,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 0,
    };

    return calculateFaraizDistribution(
      rootNode.gender,
      rootNode.totalEstate,
      input,
      undefined,
      'root'
    );
  }, [rootNode.gender, rootNode.totalEstate, gen1Wives, gen1Sons, gen1Daughters]);

  // Ensure default Gen 2 configs exist for all Gen 1 children
  const activeGen2List = useMemo(() => {
    return gen1Shares.map((share, idx) => {
      const existing = gen2Configs[share.id];
      const defaultConfig: Gen2ChildConfig = {
        id: share.id,
        name: share.name,
        gender: share.gender,
        enabled: existing?.enabled ?? (idx === 0), // Enable first child by default as a helpful start
        inputConfig: existing?.inputConfig ?? {
          husband: 0,
          wives: share.gender === 'male' ? 1 : 0,
          sons: 1,
          daughters: 1,
          father: false,
          mother: false,
          grandfather: false,
          grandmother: false,
          brothers: 0,
          sisters: 0,
        },
      };
      return existing || defaultConfig;
    });
  }, [gen1Shares, gen2Configs]);

  const updateGen2Config = (childId: string, updater: (prev: Gen2ChildConfig) => Gen2ChildConfig) => {
    setGen2Configs((prev) => {
      const current = prev[childId] || activeGen2List.find((c) => c.id === childId)!;
      return {
        ...prev,
        [childId]: updater(current),
      };
    });
  };

  // Preview full multi-generational hierarchy
  const multiGenPreview = useMemo(() => {
    return gen1Shares.map((g1Share) => {
      const config = gen2Configs[g1Share.id] || activeGen2List.find((c) => c.id === g1Share.id);
      let g2Children: { name: string; shareStr: string; decimals: number }[] = [];

      if (config && config.enabled && (config.inputConfig.sons > 0 || config.inputConfig.daughters > 0 || config.inputConfig.wives > 0 || config.inputConfig.husband > 0)) {
        const subShares = calculateFaraizDistribution(
          config.gender,
          g1Share.landDecimals,
          config.inputConfig,
          config.namedHeirs,
          g1Share.id
        );
        g2Children = subShares.map((s) => ({
          name: `${s.name} (${s.relationshipBn})`,
          shareStr: s.shareFractionStr,
          decimals: s.landDecimals,
        }));
      }

      return {
        ...g1Share,
        children: g2Children,
      };
    });
  }, [gen1Shares, gen2Configs, activeGen2List]);

  // Construct and save the whole multi-generation tree
  const handleSaveAll = () => {
    const rootInput: HeirCountInput = {
      husband: 0,
      wives: gen1Wives,
      sons: gen1Sons,
      daughters: gen1Daughters,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 0,
    };

    const gen1Nodes: HeirTreeNode[] = gen1Shares.map((g1Share) => {
      const config = gen2Configs[g1Share.id] || activeGen2List.find((c) => c.id === g1Share.id);
      let gen2Nodes: HeirTreeNode[] = [];

      if (config && config.enabled) {
        const subShares = calculateFaraizDistribution(
          config.gender,
          g1Share.landDecimals,
          config.inputConfig,
          config.namedHeirs,
          g1Share.id
        );

        gen2Nodes = subShares.map((s) => ({
          id: s.id,
          name: s.name,
          gender: s.gender,
          relationship: s.relationship,
          relationshipBn: s.relationshipBn,
          generation: 2,
          totalEstate: s.landDecimals,
          inheritedEstate: s.landDecimals,
          extraEstate: 0,
          shareFractionStr: s.shareFractionStr,
          sharePercentage: s.sharePercentage,
          legalReasonBn: s.legalReasonBn,
          children: [],
        }));
      }

      return {
        id: g1Share.id,
        name: g1Share.name,
        gender: g1Share.gender,
        relationship: g1Share.relationship,
        relationshipBn: g1Share.relationshipBn,
        generation: 1,
        totalEstate: g1Share.landDecimals,
        inheritedEstate: g1Share.landDecimals,
        extraEstate: 0,
        shareFractionStr: g1Share.shareFractionStr,
        sharePercentage: g1Share.sharePercentage,
        legalReasonBn: g1Share.legalReasonBn,
        inputConfig: config && config.enabled ? config.inputConfig : undefined,
        children: gen2Nodes,
      };
    });

    const newRoot: HeirTreeNode = {
      ...rootNode,
      inputConfig: rootInput,
      children: gen1Nodes,
    };

    onSaveEntireTree(newRoot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-6 py-3 sm:py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg leading-tight">
                এক সাথে একাধিক প্রজন্মের বণ্টন নির্মাতা
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-100">
                মালিক: <strong>{rootNode.name}</strong> ({toBengaliNumber(rootNode.totalEstate, 2)} শতক) • ১ম ও ২য় প্রজন্ম
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

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* STEP 1: Generation 1 (১ম প্রজন্ম) */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  ১
                </span>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  ১ম প্রজন্ম: মূল মালিকের উত্তরাধিকারী (স্ত্রী, ছেলে ও মেয়ে)
                </h4>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                মোট জমি: {toBengaliNumber(rootNode.totalEstate, 2)} শতক
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Wives */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">স্ত্রী (Wife)</span>
                  <span className="text-[10px] text-slate-500">সন্তান থাকলে ১/৮ অংশ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGen1Wives(Math.max(0, gen1Wives - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">
                    {toBengaliNumber(gen1Wives, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGen1Wives(Math.min(4, gen1Wives + 1))}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Sons */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">ছেলে / পুত্র সন্তান</span>
                  <span className="text-[10px] text-slate-500">আছাবা (২ অংশ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGen1Sons(Math.max(0, gen1Sons - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">
                    {toBengaliNumber(gen1Sons, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGen1Sons(gen1Sons + 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Daughters */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">মেয়ে / কন্যা সন্তান</span>
                  <span className="text-[10px] text-slate-500">পুত্রের অর্ধেক (১ অংশ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGen1Daughters(Math.max(0, gen1Daughters - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-slate-800 text-sm">
                    {toBengaliNumber(gen1Daughters, 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGen1Daughters(gen1Daughters + 1)}
                    className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Generation 2 (২য় প্রজন্ম - সন্তানদের সন্তানাদি / নাতি-নাতনি) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  ২
                </span>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  ২য় প্রজন্ম: ১ম প্রজন্মের সন্তানদের ওয়ারিশ (নাতি-নাতনি) নির্ধারণ করুন
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                যেকোনো সন্তানের বক্সে টিক দিয়ে ওয়ারিশ সংখ্যা দিন
              </span>
            </div>

            <div className="space-y-3">
              {gen1Shares.map((g1) => {
                const cfg = gen2Configs[g1.id] || activeGen2List.find((c) => c.id === g1.id);
                const isEnabled = cfg?.enabled ?? false;
                const isMale = g1.gender === 'male';

                return (
                  <div
                    key={g1.id}
                    className={`rounded-2xl border transition-all ${
                      isEnabled
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                        : 'bg-white border-slate-200 opacity-90'
                    }`}
                  >
                    {/* Collapsible Row Header */}
                    <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) =>
                            updateGen2Config(g1.id, (prev) => ({
                              ...prev,
                              enabled: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-slate-900">{g1.name}</strong>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                              {g1.relationshipBn}
                            </span>
                            <span className="text-xs font-bold text-emerald-800">
                              {toBengaliNumber(g1.landDecimals, 2)} শতক ({g1.shareFractionStr})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {isEnabled
                              ? 'উক্ত সন্তানের ওয়ারিশদের মধ্যে বণ্টন সক্রিয় রয়েছে'
                              : 'সন্তানাদি থাকলে টিক দিন'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEnabled && (
                          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold">
                            সক্রিয়
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Gen 2 Steppers (Shown if enabled) */}
                    {isEnabled && (
                      <div className="px-4 pb-4 pt-1 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/60 rounded-b-2xl">
                        {/* Spouse for this child */}
                        {isMale ? (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">স্ত্রী:</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateGen2Config(g1.id, (prev) => ({
                                    ...prev,
                                    inputConfig: {
                                      ...prev.inputConfig,
                                      wives: Math.max(0, prev.inputConfig.wives - 1),
                                    },
                                  }))
                                }
                                className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-bold text-xs">
                                {toBengaliNumber(cfg?.inputConfig.wives ?? 1, 0)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateGen2Config(g1.id, (prev) => ({
                                    ...prev,
                                    inputConfig: {
                                      ...prev.inputConfig,
                                      wives: Math.min(4, (prev.inputConfig.wives || 0) + 1),
                                    },
                                  }))
                                }
                                className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-700">স্বামী:</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateGen2Config(g1.id, (prev) => ({
                                    ...prev,
                                    inputConfig: { ...prev.inputConfig, husband: 0 },
                                  }))
                                }
                                className={`px-2 py-0.5 text-xs rounded ${
                                  cfg?.inputConfig.husband === 0 ? 'bg-slate-300 font-bold' : 'bg-slate-100'
                                }`}
                              >
                                না
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateGen2Config(g1.id, (prev) => ({
                                    ...prev,
                                    inputConfig: { ...prev.inputConfig, husband: 1 },
                                  }))
                                }
                                className={`px-2 py-0.5 text-xs rounded ${
                                  cfg?.inputConfig.husband === 1 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100'
                                }`}
                              >
                                হ্যাঁ
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Sons for this child */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">পুত্র সন্তান (নাতি):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateGen2Config(g1.id, (prev) => ({
                                  ...prev,
                                  inputConfig: {
                                    ...prev.inputConfig,
                                    sons: Math.max(0, prev.inputConfig.sons - 1),
                                  },
                                }))
                              }
                              className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-xs">
                              {toBengaliNumber(cfg?.inputConfig.sons ?? 1, 0)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateGen2Config(g1.id, (prev) => ({
                                  ...prev,
                                  inputConfig: {
                                    ...prev.inputConfig,
                                    sons: (prev.inputConfig.sons || 0) + 1,
                                  },
                                }))
                              }
                              className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Daughters for this child */}
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">কন্যা সন্তান (নাতনি):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateGen2Config(g1.id, (prev) => ({
                                  ...prev,
                                  inputConfig: {
                                    ...prev.inputConfig,
                                    daughters: Math.max(0, prev.inputConfig.daughters - 1),
                                  },
                                }))
                              }
                              className="w-6 h-6 rounded bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-xs">
                              {toBengaliNumber(cfg?.inputConfig.daughters ?? 1, 0)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateGen2Config(g1.id, (prev) => ({
                                  ...prev,
                                  inputConfig: {
                                    ...prev.inputConfig,
                                    daughters: (prev.inputConfig.daughters || 0) + 1,
                                  },
                                }))
                              }
                              className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Multi-Generation Live Preview */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>বহু-প্রজন্মের বণ্টন সারসংক্ষেপ প্রিভিউ:</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              {multiGenPreview.map((g1) => (
                <div key={g1.id} className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>
                      {g1.name} ({g1.relationshipBn})
                    </span>
                    <span className="text-emerald-800">
                      {toBengaliNumber(g1.landDecimals, 2)} শতক ({g1.shareFractionStr})
                    </span>
                  </div>
                  {g1.children.length > 0 ? (
                    <div className="pl-4 pt-1.5 space-y-1 text-slate-600 border-l-2 border-emerald-300 ml-2 mt-1">
                      {g1.children.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px]">
                          <span>↳ {c.name}</span>
                          <span className="font-semibold text-emerald-700">
                            {toBengaliNumber(c.decimals, 2)} শতক ({c.shareStr})
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (পরবর্তী প্রজন্মের কোনো ওয়ারিশ নেই)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer text-center"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>এক সাথে সকল প্রজন্ম সংরক্ষণ ও বৃক্ষ তৈরি করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};

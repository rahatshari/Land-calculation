import React, { useState } from 'react';
import { X, UserCheck, Check } from 'lucide-react';
import { Gender } from '../types';
import { BengaliNumberInput } from './BengaliNumberInput';

interface RootOwnerModalProps {
  isOpen: boolean;
  currentName: string;
  currentGender: Gender;
  currentLand: number;
  onClose: () => void;
  onSave: (name: string, gender: Gender, totalLand: number) => void;
}

export const RootOwnerModal: React.FC<RootOwnerModalProps> = ({
  isOpen,
  currentName,
  currentGender,
  currentLand,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(currentName);
  const [gender, setGender] = useState<Gender>(currentGender);
  const [land, setLand] = useState(currentLand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || land <= 0) return;
    onSave(name.trim(), gender, land);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">মূল ভূম্যধিকারীর তথ্য ও জমির পরিমাণ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মূল মালিকের নাম:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: রাহাত"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              লিঙ্গ (Gender):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  gender === 'male'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                👨 পুরুষ (Male)
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  gender === 'female'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                👩 মহিলা (Female)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মোট বণ্টনযোগ্য সম্পত্তির পরিমাণ (শতক / শতাংশ):
            </label>
            <BengaliNumberInput
              value={land}
              onChange={setLand}
              placeholder="যেমন: ১০০ বা ৫০.৭৫"
              className="border-slate-300 text-emerald-950 font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer transition"
            >
              <Check className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

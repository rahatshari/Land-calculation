import React, { useState } from 'react';
import { X, Lock, Shield, KeyRound, Check, AlertTriangle, Download, Upload, Clock } from 'lucide-react';
import { SecurityMeta } from '../utils/cryptoAuth';

interface SecuritySettingsModalProps {
  securityMeta: SecurityMeta | null;
  onClose: () => void;
  onUpdatePassword: (oldPass: string, newPass: string, newHint: string) => Promise<boolean>;
  onUpdateAutoLock: (minutes: number) => void;
  onLockNow: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  securityMeta,
  onClose,
  onUpdatePassword,
  onUpdateAutoLock,
  onLockNow,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState(securityMeta?.hint || '');
  const [autoLock, setAutoLock] = useState<number>(securityMeta?.autoLockMinutes ?? 15);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setStatusMessage({ text: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'উভয় পাসওয়ার্ড মেলেনি!', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const ok = await onUpdatePassword(oldPassword, newPassword, hint);
      if (ok) {
        setStatusMessage({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setStatusMessage({ text: 'বর্তমান পুরাতন পাসওয়ার্ড সঠিক নয়!', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'পাসওয়ার্ড পরিবর্তনে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mins = Number(e.target.value);
    setAutoLock(mins);
    onUpdateAutoLock(mins);
    setStatusMessage({ text: 'অটো-লক সময় আপডেট করা হয়েছে!', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">নিরাপত্তা ও পাসওয়ার্ড সেটিংস</h3>
              <p className="text-xs text-slate-400">তথ্য গোপন ও সুরক্ষিত রাখতে পাসওয়ার্ড পরিবর্তন করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Auto Lock Setting */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-600" />
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  স্বয়ংক্রিয় লক (Auto-Lock Timeout)
                </label>
                <span className="text-[11px] text-slate-500">
                  নিষ্ক্রিয় থাকলে নির্দিষ্ট সময় পর অ্যাপ স্বয়ংক্রিয়ভাবে লক হয়ে যাবে
                </span>
              </div>
            </div>
            <select
              value={autoLock}
              onChange={handleAutoLockChange}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={5}>৫ মিনিট পর</option>
              <option value={15}>১৫ মিনিট পর</option>
              <option value={30}>৩০ মিনিট পর</option>
              <option value={0}>কখনোই নয় (Never)</option>
            </select>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>পাসওয়ার্ড বা পিন পরিবর্তন করুন:</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                বর্তমান পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="বর্তমান পাসওয়ার্ড দিন"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                নতুন পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                পাসওয়ার্ড স্মরণিকা (Hint - ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="যেমন: মোবাইল নম্বরের শেষ ৪ সংখ্যা"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন'}
            </button>
          </form>

          {/* Quick Lock Now Action */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLockNow();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>এখনই স্ক্রিন লক করুন (Lock Immediately)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

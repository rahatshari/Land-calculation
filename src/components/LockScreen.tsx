import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SecurityMeta } from '../utils/cryptoAuth';

interface LockScreenProps {
  securityMeta: SecurityMeta | null;
  onUnlock: (password: string) => Promise<boolean>;
  onSetupPassword: (password: string, hint: string) => Promise<boolean>;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  securityMeta,
  onUnlock,
  onSetupPassword,
}) => {
  const isFirstTime = !securityMeta || !securityMeta.hasPasswordSet;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('অনুগ্রহ করে আপনার পাসওয়ার্ড বা পিন লিখুন');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const success = await onUnlock(password);
      if (!success) {
        setError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
      }
    } catch {
      setError('পাসওয়ার্ড যাচাইকরণে ত্রুটি হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের বা সংখ্যার হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড মেলেনি! পুনরায় লিখুন।');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onSetupPassword(password, hint);
    } catch {
      setError('পাসওয়ার্ড সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 px-6 py-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
            {isFirstTime ? (
              <ShieldCheck className="w-8 h-8 text-emerald-300" />
            ) : (
              <Lock className="w-8 h-8 text-emerald-300" />
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {isFirstTime ? 'নিরাপত্তা পাসওয়ার্ড নির্ধারণ করুন' : 'উত্তরাধিকার সংরক্ষিত ভল্ট'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {isFirstTime
              ? 'পারিবারিক জমির তথ্য ও বংশবৃক্ষ সুরক্ষিত রাখতে একটি গোপন পাসওয়ার্ড দিন'
              : 'তথ্য দেখার জন্য আপনার গোপন পাসওয়ার্ড বা পিন প্রবেশ করান'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {isFirstTime ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড বা পিন (কমপক্ষে ৪ সংখ্যা/অক্ষর)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন (যেমন: 1234)"
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাসওয়ার্ড স্মারক সংকেত (Password Hint - ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="যেমন: আমার প্রিয় সাল বা মোবাইল পিন"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                <KeyRound className="w-4 h-4" />
                {isLoading ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড সেট করুন ও প্রবেশ করুন'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  আপনার নিরাপত্তা পাসওয়ার্ড বা পিন
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন"
                    autoFocus
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {securityMeta?.hint && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    {showHint ? 'হিন্ট লুকান' : 'পাসওয়ার্ড মনে নেই? হিন্ট দেখুন'}
                  </button>
                  {showHint && (
                    <div className="mt-1 text-left p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <strong>স্মারক সংকেত (Hint):</strong> {securityMeta.hint}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isLoading ? 'যাচাই হচ্ছে...' : 'লক খুলুন (Unlock App)'}
              </button>

              <div className="pt-2 text-center text-xs text-slate-400">
                তথ্য এনক্রিপ্টেড ও সম্পূর্ণ গোপনীয়ভাবে ব্রাউজারে সংরক্ষিত।
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

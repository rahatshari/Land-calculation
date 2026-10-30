import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'banner' | 'card' }> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already opened as standalone installed app, don't show
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Guide for Chrome / Android if prompt hasn't fired yet
      alert('আপনার ক্রোম ব্রাউজারের উপরের ৩-ডট (menu) বাটনে ট্যাপ করে "Add to Home screen" বা "Install App" অপশনটিতে ক্লিক করুন।');
    }
  };

  if (variant === 'banner') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <Smartphone className="w-4 h-4" />
          <span>ফোনে অ্যাপ ইনস্টল করুন</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-900">iPhone / iPad এ ইনস্টল করার নিয়ম</h3>
                <button onClick={() => setShowIOSGuide(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed space-y-2">
                ১. Safari ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।<br />
                ২. নিচের দিকে স্ক্রল করে <strong>‘Add to Home Screen’ (হোম স্ক্রিনে যোগ করুন)</strong> সিলেক্ট করুন।<br />
                ৩. উপরে <strong>‘Add’</strong> এ ক্লিক করলেই আপনার ফোনে লোগোসহ অ্যাপ হিসেবে সেভ হয়ে যাবে।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                বুঝেছি
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
        title="স্মার্টফোনে বা কম্পিউটারে অ্যাপ ইনস্টল করুন"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">অ্যাপ ইনস্টল</span>
        <span className="sm:hidden">ইনস্টল</span>
      </button>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">iPhone / iPad এ ইনস্টল করার নিয়ম</h3>
              <button onClick={() => setShowIOSGuide(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed space-y-2">
              ১. Safari ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।<br />
              ২. স্ক্রল করে <strong>‘Add to Home Screen’</strong> সিলেক্ট করুন।<br />
              ৩. <strong>‘Add’</strong> এ ক্লিক করলেই অ্যাপ ইনস্টল হয়ে যাবে।
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
};

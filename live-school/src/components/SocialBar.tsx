import React from 'react';
import { Facebook, Youtube, Send, MessageSquare, Globe, Share2 } from 'lucide-react';
import { SocialLinks } from '../types';

interface SocialBarProps {
  socialLinks: SocialLinks;
  variant?: 'compact' | 'full' | 'footer';
}

export const SocialBar: React.FC<SocialBarProps> = ({ socialLinks, variant = 'compact' }) => {
  const { facebookPage, youtubeVideo, telegramGroup, whatsappNumber, websiteUrl } = socialLinks;

  const hasAnyLink = facebookPage || youtubeVideo || telegramGroup || whatsappNumber || websiteUrl;

  if (!hasAnyLink) return null;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        {facebookPage && (
          <a
            href={facebookPage}
            target="_blank"
            rel="noopener noreferrer"
            title="ফেসবুক পেজ"
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Facebook className="w-4 h-4" />
          </a>
        )}
        {youtubeVideo && (
          <a
            href={youtubeVideo}
            target="_blank"
            rel="noopener noreferrer"
            title="ইউটিউব ভিডিও/চ্যানেল"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Youtube className="w-4 h-4" />
          </a>
        )}
        {telegramGroup && (
          <a
            href={telegramGroup}
            target="_blank"
            rel="noopener noreferrer"
            title="টেলিগ্রাম চ্যানেল"
            className="p-1.5 rounded-lg text-sky-500 hover:bg-sky-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </a>
        )}
        {whatsappNumber && (
          <a
            href={whatsappNumber.startsWith('http') ? whatsappNumber : `https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            title="হোয়াটসঅ্যাপ গ্রুপ"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
        )}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="ওয়েবসাইট"
            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>আমাদের সোশ্যাল মিডিয়া চ্যানেলসমূহ:</span>
        </h3>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          নিয়মিত স্টাডি ম্যাটেরিয়াল ও ক্লাসের জন্য যুক্ত থাকুন
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {facebookPage && (
          <a
            href={facebookPage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Facebook className="w-4 h-4" />
            <span>ফেসবুক পেজ</span>
          </a>
        )}
        {youtubeVideo && (
          <a
            href={youtubeVideo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Youtube className="w-4 h-4" />
            <span>ইউটিউব চ্যানেল/ভিডিও</span>
          </a>
        )}
        {telegramGroup && (
          <a
            href={telegramGroup}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>টেলিগ্রাম চ্যানেল</span>
          </a>
        )}
        {whatsappNumber && (
          <a
            href={whatsappNumber.startsWith('http') ? whatsappNumber : `https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপ</span>
          </a>
        )}
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>ওয়েবসাইট</span>
          </a>
        )}
      </div>
    </div>
  );
};

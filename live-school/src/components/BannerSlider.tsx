import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { BannerSlide } from '../types';

interface BannerSliderProps {
  banners: BannerSlide[];
  onNavigateTo?: (target: 'live_exams' | 'written_exams' | 'english_exams' | string) => void;
  className?: string;
  compact?: boolean;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({ banners = [], onNavigateTo, className = '', compact = false }) => {
  const activeBanners = banners.filter((b) => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeBanners.length, isHovered]);

  if (!activeBanners || activeBanners.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const getThemeGradient = (theme?: string) => {
    switch (theme) {
      case 'rose':
        return 'from-rose-600 via-rose-700 to-pink-800 text-white';
      case 'indigo':
        return 'from-indigo-600 via-indigo-700 to-blue-800 text-white';
      case 'amber':
        return 'from-amber-500 via-amber-600 to-orange-700 text-white';
      case 'emerald':
        return 'from-emerald-600 via-emerald-700 to-teal-800 text-white';
      case 'purple':
        return 'from-purple-600 via-purple-700 to-indigo-900 text-white';
      case 'teal':
      default:
        return 'from-teal-600 via-teal-700 to-emerald-800 text-white';
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-700/50 group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Banner OR Gradient Text Banner */}
      {currentBanner.imageUrl ? (
        <div className={`relative w-full bg-slate-900 overflow-hidden ${compact ? 'h-44 sm:h-52 md:h-56' : 'h-44 sm:h-56 md:h-64'}`}>
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              // Fallback if image breaks
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-transparent p-5 sm:p-8 flex flex-col justify-end">
            {currentBanner.badgeText && (
              <span className="self-start px-2.5 py-1 bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black rounded-lg mb-2 shadow-sm">
                {currentBanner.badgeText}
              </span>
            )}
            <h2 className="text-lg sm:text-2xl font-extrabold text-white drop-shadow-sm">
              {currentBanner.title}
            </h2>
            {currentBanner.subtitle && (
              <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2 max-w-2xl font-medium">
                {currentBanner.subtitle}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`w-full min-h-[160px] sm:min-h-[190px] p-6 sm:p-8 bg-gradient-to-r ${getThemeGradient(
            currentBanner.themeColor
          )} flex flex-col justify-between relative overflow-hidden`}
        >
          {/* Subtle Decorative Pattern */}
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-40 h-40 bg-black/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            {currentBanner.badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] sm:text-xs font-black uppercase tracking-wide border border-white/25">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{currentBanner.badgeText}</span>
              </div>
            )}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
              {currentBanner.title}
            </h2>
            {currentBanner.subtitle && (
              <p className="text-xs sm:text-sm text-white/90 font-medium max-w-2xl leading-relaxed">
                {currentBanner.subtitle}
              </p>
            )}
          </div>

          {currentBanner.linkUrl && (
            <div className="relative z-10 pt-3">
              <a
                href={currentBanner.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>বিস্তারিত দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-3 right-4 sm:right-6 z-20 flex items-center gap-1.5 bg-slate-950/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

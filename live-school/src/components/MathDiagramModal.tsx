import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, Upload, Link as LinkIcon, 
  Check, RefreshCw, Triangle, Circle, Square, Compass
} from 'lucide-react';

interface MathDiagramModalProps {
  isOpen: boolean;
  currentImageUrl?: string;
  targetFieldTitle?: string;
  onSave: (imageUrl: string) => void;
  onClose: () => void;
}

export type ShapeType = 
  | 'right_triangle' 
  | 'equilateral_triangle' 
  | 'isosceles_triangle' 
  | 'scalene_triangle' 
  | 'circle' 
  | 'rectangle' 
  | 'parallelogram' 
  | 'angle_ray';

export const MathDiagramModal: React.FC<MathDiagramModalProps> = ({
  isOpen,
  currentImageUrl = '',
  targetFieldTitle = 'প্রশ্ন',
  onSave,
  onClose,
}) => {
  const [tab, setTab] = useState<'generator' | 'upload' | 'url'>('generator');
  
  // URL Tab State
  const [urlInput, setUrlInput] = useState(currentImageUrl || '');
  
  // Upload Tab State
  const [uploadPreview, setUploadPreview] = useState<string>(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Diagram Generator State
  const [shapeType, setShapeType] = useState<ShapeType>('right_triangle');
  const [vertexA, setVertexA] = useState('A');
  const [vertexB, setVertexB] = useState('B');
  const [vertexC, setVertexC] = useState('C');
  const [vertexD, setVertexD] = useState('D');
  const [vertexO, setVertexO] = useState('O');
  
  const [sideABLabel, setSideABLabel] = useState('৩ সেমি');
  const [sideBCLabel, setSideBCLabel] = useState('৪ সেমি');
  const [sideACLabel, setSideACLabel] = useState('৫ সেমি');
  
  const [angleLabel, setAngleLabel] = useState('θ');
  const [radiusLabel, setRadiusLabel] = useState('r = ৫ সেমি');
  const [heightLabel, setHeightLabel] = useState('h = ৪ সেমি');
  const [customCaption, setCustomCaption] = useState('চিত্রে △ABC একটি সমকোণী ত্রিভুজ');
  const [showRightAngleBox, setShowRightAngleBox] = useState(true);
  const [showAltitude, setShowAltitude] = useState(true);
  const [diagramColor, setDiagramColor] = useState('#0f766e'); // teal-700
  const [bgColor, setBgColor] = useState('#f8fafc'); // slate-50

  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!isOpen) return null;

  // Handle File Upload with Auto-Resizing & Compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setUploadPreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Convert rendered SVG into Data URI
  const generateSvgDataUrl = (): string => {
    if (!svgRef.current) return '';
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const encoded = encodeURIComponent(source);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  };

  const handleSaveDiagram = () => {
    if (tab === 'generator') {
      const dataUri = generateSvgDataUrl();
      if (dataUri) {
        onSave(dataUri);
        onClose();
      }
    } else if (tab === 'upload') {
      if (uploadPreview) {
        onSave(uploadPreview);
        onClose();
      } else {
        alert('অনুগ্রহ করে প্রথমে একটি ছবি নির্বাচন করুন।');
      }
    } else if (tab === 'url') {
      if (urlInput.trim()) {
        onSave(urlInput.trim());
        onClose();
      } else {
        alert('অনুগ্রহ করে একটি বৈধ ইমেজ লিংক প্রদান করুন।');
      }
    }
  };

  const handleRemoveImage = () => {
    onSave('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {targetFieldTitle} এর চিত্র
            </span>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2 mt-0.5">
              <span>📐</span>
              <span>গণিত চিত্র, ত্রিভুজ ও ডায়াগ্রাম স্টুডিও</span>
            </h3>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1.5 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => setTab('generator')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'generator'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Compass className="w-4 h-4 text-teal-600" />
            <span>জ্যামিতিক চিত্র ও ত্রিভুজ তৈরি</span>
          </button>
          
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'upload'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Upload className="w-4 h-4 text-teal-600" />
            <span>ছবি আপলোড (ক্যামেরা/ফাইল)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'url'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <LinkIcon className="w-4 h-4 text-teal-600" />
            <span>অনলাইন লিংক (URL)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: GENERATOR */}
          {tab === 'generator' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left Controls */}
              <div className="md:col-span-5 space-y-3.5 text-xs">
                
                {/* Shape Selection */}
                <div>
                  <label className="font-bold text-slate-700 mb-1.5 block">১. আকৃতি নির্বাচন করুন:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('right_triangle');
                        setCustomCaption('চিত্রে △ABC একটি সমকোণী ত্রিভুজ');
                        setSideABLabel('৩ সেমি');
                        setSideBCLabel('৪ সেমি');
                        setSideACLabel('৫ সেমি');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'right_triangle'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      📐 সমকোণী ত্রিভুজ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('equilateral_triangle');
                        setCustomCaption('চিত্রে △ABC একটি সমবাহু ত্রিভুজ');
                        setSideABLabel('৬ সেমি');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'equilateral_triangle'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🔺 সমবাহু ত্রিভুজ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('isosceles_triangle');
                        setCustomCaption('চিত্রে △ABC একটি সমদ্বিবাহু ত্রিভুজ (AB = AC)');
                        setSideABLabel('৫ সেমি');
                        setSideBCLabel('৬ সেমি');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'isosceles_triangle'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ▲ সমদ্বিবাহু ত্রিভুজ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('circle');
                        setCustomCaption('চিত্রে O কেন্দ্রবিশিষ্ট একটি বৃত্ত');
                        setRadiusLabel('r = ৭ সেমি');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'circle'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ⭕ বৃত্ত ও ব্যাসার্ধ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('rectangle');
                        setCustomCaption('চিত্রে ABCD একটি আয়তক্ষেত্র');
                        setSideABLabel('৮ সেমি');
                        setSideBCLabel('৫ সেমি');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'rectangle'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🟩 আয়তক্ষেত্র / বর্গ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShapeType('angle_ray');
                        setCustomCaption('চিত্রে ∠AOB একটি কোণ');
                        setAngleLabel('৬০°');
                      }}
                      className={`p-2 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                        shapeType === 'angle_ray'
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-1 ring-teal-500'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ∠ কোণ ও রশ্মি
                    </button>
                  </div>
                </div>

                {/* Vertex Names */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">২. শীর্ষবিন্দু ও লেবেল:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 font-bold block">বিন্দু ১</span>
                      <input
                        type="text"
                        value={vertexA}
                        onChange={(e) => setVertexA(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 font-bold block">বিন্দু ২</span>
                      <input
                        type="text"
                        value={vertexB}
                        onChange={(e) => setVertexB(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500 font-bold block">বিন্দু ৩</span>
                      <input
                        type="text"
                        value={vertexC}
                        onChange={(e) => setVertexC(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-slate-800"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Dimensions / Measurements */}
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block">৩. বাহুর দৈর্ঘ্য ও মান:</label>
                  
                  {shapeType === 'right_triangle' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">লম্ব ({vertexA}{vertexB}):</span>
                        <input
                          type="text"
                          value={sideABLabel}
                          onChange={(e) => setSideABLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="৩ সেমি"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">ভূমি ({vertexB}{vertexC}):</span>
                        <input
                          type="text"
                          value={sideBCLabel}
                          onChange={(e) => setSideBCLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="৪ সেমি"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">অতিভুজ ({vertexA}{vertexC}):</span>
                        <input
                          type="text"
                          value={sideACLabel}
                          onChange={(e) => setSideACLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="৫ সেমি"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">কোণ C:</span>
                        <input
                          type="text"
                          value={angleLabel}
                          onChange={(e) => setAngleLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="θ বা ৩০°"
                        />
                      </div>
                    </div>
                  )}

                  {shapeType === 'equilateral_triangle' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">প্রতি বাহুর মান (a):</span>
                        <input
                          type="text"
                          value={sideABLabel}
                          onChange={(e) => setSideABLabel(e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="৬ সেমি"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">উচ্চতা (h):</span>
                        <input
                          type="text"
                          value={heightLabel}
                          onChange={(e) => setHeightLabel(e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="h = ?"
                        />
                      </div>
                    </div>
                  )}

                  {shapeType === 'circle' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">ব্যাসার্ধ (r):</span>
                        <input
                          type="text"
                          value={radiusLabel}
                          onChange={(e) => setRadiusLabel(e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="r = ৭ সেমি"
                        />
                      </div>
                    </div>
                  )}

                  {shapeType === 'rectangle' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">দৈর্ঘ্য ({vertexA}{vertexB}):</span>
                        <input
                          type="text"
                          value={sideABLabel}
                          onChange={(e) => setSideABLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">প্রস্থ ({vertexB}{vertexC}):</span>
                        <input
                          type="text"
                          value={sideBCLabel}
                          onChange={(e) => setSideBCLabel(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {shapeType === 'angle_ray' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-600 font-semibold">কোণের মান:</span>
                        <input
                          type="text"
                          value={angleLabel}
                          onChange={(e) => setAngleLabel(e.target.value)}
                          className="w-28 px-2 py-1 rounded border border-slate-300 text-right font-medium"
                          placeholder="৬০° বা θ"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Caption / Note */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">৪. ক্যাপশন বা বিবরণ:</label>
                  <input
                    type="text"
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 font-medium"
                    placeholder="যেমন: চিত্রে △ABC একটি সমকোণী ত্রিভুজ"
                  />
                </div>
              </div>

              {/* Right Live SVG Canvas Preview */}
              <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-100/70 p-4 rounded-2xl border border-slate-200 min-h-[300px]">
                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal-600" />
                  <span>লাইভ ভেক্টর চিত্র প্রিভিউ (Auto-rendered Vector SVG)</span>
                </div>

                {/* SVG Render Container */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 w-full flex items-center justify-center overflow-hidden">
                  <svg
                    ref={svgRef}
                    viewBox="0 0 400 320"
                    width="100%"
                    height="260"
                    className="max-h-[260px] select-none"
                    style={{ backgroundColor: bgColor }}
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={diagramColor} />
                      </marker>
                    </defs>

                    {/* RIGHT TRIANGLE */}
                    {shapeType === 'right_triangle' && (
                      <g>
                        {/* Triangle ABC */}
                        {/* A=(90, 50), B=(90, 230), C=(310, 230) */}
                        <polygon
                          points="90,50 90,230 310,230"
                          fill="rgba(15, 118, 110, 0.06)"
                          stroke={diagramColor}
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                        {/* Right Angle Symbol at B */}
                        {showRightAngleBox && (
                          <path
                            d="M 90 205 L 115 205 L 115 230"
                            fill="none"
                            stroke={diagramColor}
                            strokeWidth="2.5"
                          />
                        )}
                        {/* Angle Arc at C */}
                        {angleLabel && (
                          <path
                            d="M 270 230 A 40 40 0 0 0 282 202"
                            fill="none"
                            stroke="#d97706"
                            strokeWidth="2"
                          />
                        )}
                        {angleLabel && (
                          <text x="245" y="218" fontSize="14" fontWeight="bold" fill="#b45309">
                            {angleLabel}
                          </text>
                        )}
                        {/* Vertex Labels */}
                        <text x="80" y="42" fontSize="18" fontWeight="bold" fill="#0f172a">
                          {vertexA}
                        </text>
                        <text x="65" y="245" fontSize="18" fontWeight="bold" fill="#0f172a">
                          {vertexB}
                        </text>
                        <text x="320" y="245" fontSize="18" fontWeight="bold" fill="#0f172a">
                          {vertexC}
                        </text>

                        {/* Side Labels */}
                        {sideABLabel && (
                          <text x="30" y="145" fontSize="14" fontWeight="bold" fill="#0f766e">
                            {sideABLabel}
                          </text>
                        )}
                        {sideBCLabel && (
                          <text x="180" y="255" fontSize="14" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                            {sideBCLabel}
                          </text>
                        )}
                        {sideACLabel && (
                          <text x="215" y="130" fontSize="14" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                            {sideACLabel}
                          </text>
                        )}
                      </g>
                    )}

                    {/* EQUILATERAL / ISOSCELES TRIANGLE */}
                    {(shapeType === 'equilateral_triangle' || shapeType === 'isosceles_triangle') && (
                      <g>
                        {/* A=(200, 50), B=(80, 240), C=(320, 240) */}
                        <polygon
                          points="200,50 80,240 320,240"
                          fill="rgba(15, 118, 110, 0.06)"
                          stroke={diagramColor}
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                        {/* Altitude Line */}
                        {showAltitude && (
                          <line
                            x1="200"
                            y1="50"
                            x2="200"
                            y2="240"
                            stroke="#64748b"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                          />
                        )}
                        {showAltitude && (
                          <path
                            d="M 200 225 L 215 225 L 215 240"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="1.5"
                          />
                        )}
                        {/* Height label */}
                        {heightLabel && (
                          <text x="210" y="150" fontSize="13" fontWeight="bold" fill="#475569">
                            {heightLabel}
                          </text>
                        )}
                        {/* Ticks on sides */}
                        <line x1="130" y1="140" x2="145" y2="150" stroke={diagramColor} strokeWidth="2" />
                        <line x1="270" y1="140" x2="255" y2="150" stroke={diagramColor} strokeWidth="2" />

                        {/* Vertices */}
                        <text x="195" y="38" fontSize="18" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                          {vertexA}
                        </text>
                        <text x="60" y="255" fontSize="18" fontWeight="bold" fill="#0f172a">
                          {vertexB}
                        </text>
                        <text x="330" y="255" fontSize="18" fontWeight="bold" fill="#0f172a">
                          {vertexC}
                        </text>

                        {/* Side labels */}
                        {sideABLabel && (
                          <text x="115" y="130" fontSize="14" fontWeight="bold" fill="#0f766e">
                            {sideABLabel}
                          </text>
                        )}
                        {sideBCLabel && (
                          <text x="200" y="265" fontSize="14" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                            {sideBCLabel}
                          </text>
                        )}
                      </g>
                    )}

                    {/* CIRCLE */}
                    {shapeType === 'circle' && (
                      <g>
                        {/* Circle at (200, 145), r=90 */}
                        <circle
                          cx="200"
                          cy="145"
                          r="85"
                          fill="rgba(15, 118, 110, 0.05)"
                          stroke={diagramColor}
                          strokeWidth="3"
                        />
                        {/* Center dot */}
                        <circle cx="200" cy="145" r="4" fill="#0f172a" />
                        <text x="185" y="140" fontSize="16" fontWeight="bold" fill="#0f172a">
                          {vertexO}
                        </text>

                        {/* Radius line */}
                        <line
                          x1="200"
                          y1="145"
                          x2="285"
                          y2="145"
                          stroke={diagramColor}
                          strokeWidth="2.5"
                        />
                        <circle cx="285" cy="145" r="3" fill="#0f766e" />
                        <text x="295" y="150" fontSize="16" fontWeight="bold" fill="#0f172a">
                          {vertexA}
                        </text>
                        {radiusLabel && (
                          <text x="240" y="135" fontSize="14" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                            {radiusLabel}
                          </text>
                        )}
                      </g>
                    )}

                    {/* RECTANGLE */}
                    {shapeType === 'rectangle' && (
                      <g>
                        <rect
                          x="80"
                          y="70"
                          width="240"
                          height="150"
                          fill="rgba(15, 118, 110, 0.05)"
                          stroke={diagramColor}
                          strokeWidth="3"
                          rx="2"
                        />
                        {/* Diagonal line */}
                        <line x1="80" y1="220" x2="320" y2="70" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />

                        {/* Vertices */}
                        <text x="65" y="65" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexA}</text>
                        <text x="330" y="65" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexB}</text>
                        <text x="330" y="235" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexC}</text>
                        <text x="65" y="235" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexD}</text>

                        {sideABLabel && (
                          <text x="200" y="55" fontSize="14" fontWeight="bold" fill="#0f766e" textAnchor="middle">
                            {sideABLabel}
                          </text>
                        )}
                        {sideBCLabel && (
                          <text x="345" y="150" fontSize="14" fontWeight="bold" fill="#0f766e">
                            {sideBCLabel}
                          </text>
                        )}
                      </g>
                    )}

                    {/* ANGLE RAY */}
                    {shapeType === 'angle_ray' && (
                      <g>
                        {/* Rays from (90, 220) to (310, 220) and (250, 70) */}
                        <line x1="90" y1="220" x2="310" y2="220" stroke={diagramColor} strokeWidth="3" markerEnd="url(#arrow)" />
                        <line x1="90" y1="220" x2="250" y2="70" stroke={diagramColor} strokeWidth="3" markerEnd="url(#arrow)" />

                        {/* Angle Arc */}
                        <path d="M 160 220 A 70 70 0 0 0 145 165" fill="none" stroke="#d97706" strokeWidth="2.5" />

                        {angleLabel && (
                          <text x="175" y="195" fontSize="16" fontWeight="bold" fill="#b45309">
                            {angleLabel}
                          </text>
                        )}

                        <text x="70" y="235" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexO}</text>
                        <text x="320" y="235" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexB}</text>
                        <text x="260" y="65" fontSize="18" fontWeight="bold" fill="#0f172a">{vertexA}</text>
                      </g>
                    )}

                    {/* Bottom Caption Banner */}
                    {customCaption && (
                      <text
                        x="200"
                        y="300"
                        fontSize="13"
                        fontWeight="bold"
                        fill="#334155"
                        textAnchor="middle"
                      >
                        {customCaption}
                      </text>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4 text-center py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/40 p-8 rounded-3xl transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">
                    গণিত প্রশ্ন/চিত্র বা হাতে আঁকা ছবি আপলোড করুন
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    মোবাইল ক্যামেরা দিয়ে ছবি তুলে বা গ্যালারি/কম্পিউটার ফাইল থেকে সিলেক্ট করুন (PNG, JPG, WebP)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  ফাইল পছন্দ করুন
                </button>
              </div>

              {uploadPreview && (
                <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">আপলোড করা ছবির প্রিভিউ:</span>
                  <div className="flex justify-center max-h-[220px] overflow-hidden rounded-xl bg-slate-100 p-2">
                    <img src={uploadPreview} alt="Uploaded preview" className="max-h-[200px] object-contain rounded-lg shadow-2xs" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: URL */}
          {tab === 'url' && (
            <div className="space-y-4 py-2">
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1.5">
                  অনলাইন চিত্রের ডিরেক্ট লিংক (Image URL):
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/math-triangle.png"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {urlInput && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">চিত্র প্রিভিউ:</span>
                  <div className="flex justify-center max-h-[220px] overflow-hidden rounded-xl bg-white p-2 border border-slate-200">
                    <img
                      src={urlInput}
                      alt="URL Preview"
                      className="max-h-[190px] object-contain rounded-lg"
                      onError={() => alert('চিত্রটি লোড করা সম্ভব হয়নি। লিংকটি সঠিক কিনা যাচাই করুন।')}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          {currentImageUrl ? (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              চিত্রটি মুছে ফেলুন 🗑️
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleSaveDiagram}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>চিত্র হিসেবে যুক্ত করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

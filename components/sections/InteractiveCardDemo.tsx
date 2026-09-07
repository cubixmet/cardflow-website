"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { CreditCard, Award, QrCode, Sparkles, ShieldCheck, RotateCw, UserRound } from "lucide-react";

type TemplateId = "corporate" | "academic" | "premium";

interface TemplateStyle {
  bg: string;
  accent: string;
  text: string;
  logoColor: string;
  border: string;
}

const TEMPLATES: Record<TemplateId, TemplateStyle> = {
  corporate: {
    bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accent: "#3b82f6", // Blue
    text: "#f8fafc",
    logoColor: "#60a5fa",
    border: "rgba(59, 130, 246, 0.3)",
  },
  academic: {
    bg: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    accent: "#14b8a6", // Teal
    text: "#f0fdfa",
    logoColor: "#2dd4bf",
    border: "rgba(20, 184, 166, 0.3)",
  },
  premium: {
    bg: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    accent: "#f59e0b", // Gold
    text: "#fffbeb",
    logoColor: "#fbbf24",
    border: "rgba(245, 158, 11, 0.3)",
  },
};

export default function InteractiveCardDemo() {
  const [template, setTemplate] = useState<TemplateId>("corporate");
  const [name, setName] = useState("Robert");
  const [title, setTitle] = useState("Admin Officer");
  const [idNum, setIdNum] = useState("Z-CF-892410");
  const [isFlipped, setIsFlipped] = useState(false);

  const style = TEMPLATES[template];
  const previewRef = useRef<HTMLDivElement>(null);

  const scrollToPreview = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto py-10 px-4 sm:px-6">
      {/* Visual Canvas (ID Card Display with 3D Flip) */}
      <div ref={previewRef} className="lg:col-span-6 flex flex-col items-center justify-center">
        <div 
          className="relative w-80 h-120 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ perspective: 1200 }}
        >
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative"
          >
            {/* ================= FRONT SIDE ================= */}
            <div 
              className="absolute inset-0 rounded-2xl shadow-2xl border flex flex-col p-6 overflow-hidden backface-hidden"
              style={{ 
                background: style.bg,
                borderColor: style.border,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
            >
              {/* Glowing Accents */}
              <div
                className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-40 transition-all duration-500"
                style={{ backgroundColor: style.accent }}
              />
              <div
                className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full blur-3xl opacity-30 transition-all duration-500"
                style={{ backgroundColor: style.accent }}
              />

              {/* Card Content */}
              <div className="relative flex-1 flex flex-col justify-between text-white z-10">
                {/* Top Bar / Brand */}
                <div className="flex items-center justify-between border-b pb-3" style={{ borderBottomColor: `rgba(255, 255, 255, 0.1)` }}>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-5 h-5" style={{ color: style.logoColor }} />
                    <span className="font-sans font-extrabold text-[10px] uppercase tracking-widest opacity-95">
                      {template === "corporate" ? "Zamirzac Inc" : template === "academic" ? "Zamirzac Academy" : "Z Cards Premium"}
                    </span>
                  </div>
                  <ShieldCheck className="w-5 h-5 opacity-80" style={{ color: style.accent }} />
                </div>

                {/* Profile Section */}
                <div className="flex flex-col items-center my-6">
                  <div className="relative w-28 h-28 rounded-full p-1 border-2 mb-3 shadow-md transition-all duration-500" style={{ borderColor: style.accent }}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 border border-black/20 flex items-center justify-center">
                      <UserRound className="w-14 h-14 text-zinc-400" strokeWidth={1.5} />
                    </div>
                    <div
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full text-white text-[10px] shadow"
                      style={{ backgroundColor: style.accent }}
                    >
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Text Info */}
                  <h3 className="font-bold text-lg text-center tracking-wide line-clamp-1 text-white">
                    {name || "Your Name"}
                  </h3>
                  <p className="text-xs opacity-85 font-semibold tracking-wide mt-1.5 uppercase" style={{ color: style.accent }}>
                    {title || "Job Title / Department"}
                  </p>
                </div>

                {/* Bottom Bar: Employee details */}
                <div className="flex items-end justify-between border-t pt-4" style={{ borderTopColor: `rgba(255, 255, 255, 0.1)` }}>
                  <div className="text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/50 block font-bold">
                      Member ID
                    </span>
                    <span className="font-mono text-xs font-semibold tracking-wide">
                      {idNum || "Z-CF-000000"}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* ================= BACK SIDE ================= */}
            <div 
              className="absolute inset-0 rounded-2xl shadow-2xl border flex flex-col p-6 overflow-hidden backface-hidden"
              style={{ 
                background: style.bg,
                borderColor: style.border,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              {/* Back Background Blobs */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: style.accent }}
              />

              <div className="relative flex-1 flex flex-col justify-between text-white z-10 text-center">
                {/* Header */}
                <div className="border-b pb-3" style={{ borderBottomColor: `rgba(255, 255, 255, 0.1)` }}>
                  <span className="text-[9px] uppercase tracking-widest opacity-60 font-bold block">
                    Identity Verification Card
                  </span>
                </div>

                {/* QR Code & Barcode Section */}
                <div className="my-auto space-y-4 flex flex-col items-center">
                  <div className="bg-white p-2 rounded-xl shadow-md inline-block">
                    <QrCode className="w-16 h-16 text-slate-900" />
                  </div>

                  {/* Simulated barcode */}
                  <div className="flex gap-[1.5px] items-center justify-center bg-white/95 py-2 px-4 rounded-lg shadow-sm border border-white/10">
                    <div className="w-[2px] h-7 bg-slate-900"></div>
                    <div className="w-[1px] h-7 bg-slate-900"></div>
                    <div className="w-[3px] h-7 bg-slate-900"></div>
                    <div className="w-[1px] h-7 bg-slate-900"></div>
                    <div className="w-[2px] h-7 bg-slate-900"></div>
                    <div className="w-[4px] h-7 bg-slate-900"></div>
                    <div className="w-[1px] h-7 bg-slate-900"></div>
                    <div className="w-[3px] h-7 bg-slate-900"></div>
                    <div className="w-[1px] h-7 bg-slate-900"></div>
                    <div className="w-[2px] h-7 bg-slate-900"></div>
                    <div className="w-[1px] h-7 bg-slate-900"></div>
                    <div className="w-[3px] h-7 bg-slate-900"></div>
                  </div>
                </div>

                {/* Terms and Signature */}
                <div className="space-y-4">
                  {/* Signature */}
                  <div className="flex flex-col items-center">
                    <span 
                      style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }} 
                      className="text-2xl text-white/90 border-b border-white/20 px-8 pb-1 tracking-wide"
                    >
                      {name || "Robert"}
                    </span>
                    <span className="text-[7px] uppercase tracking-widest text-white/40 block mt-1 font-bold">
                      Authorized Signature
                    </span>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[8px] opacity-40 leading-normal max-w-xs mx-auto">
                    This card is non-transferable and remains the property of the issuing organization. If found, please return to the administration department immediately.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Flip Hint */}
        <button 
          onClick={() => setIsFlipped(!isFlipped)} 
          className="mt-6 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full shadow-sm transition-all duration-200 hover:scale-105 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 animate-spin-slow" /> Click Card to Flip
        </button>

        {/* Physical Dimension Badge */}
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          <span>Standard CR80 Size:</span>
          <span className="font-mono text-slate-650 dark:text-slate-350">85.60 × 53.98 mm</span>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="lg:col-span-6 space-y-6 text-left">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Live Sandbox Preview
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Customize in Real-Time
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            See how the Z Cards printing engine handles dynamic variables. Modify the name, role, ID, and select different styles to verify the vector front and back templates immediately.
          </p>
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Card Template Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["corporate", "academic", "premium"] as TemplateId[]).map((tId) => (
              <button
                key={tId}
                onClick={() => {
                  setTemplate(tId);
                  scrollToPreview();
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                  template === tId
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tId === "corporate" ? "Corporate" : tId === "academic" ? "Academy" : "Premium Gold"}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 text-slate-900 dark:text-white transition-colors"
              maxLength={24}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500">Role / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 text-slate-900 dark:text-white transition-colors"
              maxLength={30}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500">Card ID Code</label>
            <input
              type="text"
              value={idNum}
              onChange={(e) => setIdNum(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 text-slate-900 dark:text-white transition-colors"
              maxLength={15}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

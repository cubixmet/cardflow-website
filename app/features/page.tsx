"use client";

import React, { useState } from "react";
import {
  Layers,
  Database,
  Printer,
  Grid,
  ShieldCheck,
  Settings,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface CardLayer {
  id: string;
  name: string;
  visible: boolean;
  x: number; // 0 to 100
  y: number; // 0 to 100
  align: "left" | "center" | "right";
  fontSize: "sm" | "md" | "lg";
}

export default function Features() {
  // Simulated Card Studio state
  const [layers, setLayers] = useState<CardLayer[]>([
    { id: "photo", name: "Profile Photo", visible: true, x: 50, y: 35, align: "center", fontSize: "md" },
    { id: "name", name: "Cardholder Name", visible: true, x: 50, y: 65, align: "center", fontSize: "lg" },
    { id: "role", name: "Designation Label", visible: true, x: 50, y: 74, align: "center", fontSize: "sm" },
    { id: "barcode", name: "Security Barcode", visible: true, x: 50, y: 88, align: "center", fontSize: "md" },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("name");

  const updateLayer = (id: string, updates: Partial<CardLayer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer))
    );
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const featureGrid = [
    {
      icon: Grid,
      title: "Variable Data Fields",
      desc: "Link placeholders to client sheets. If a cell is empty for a cardholder, Z Cards auto-compacts layout lines dynamically.",
    },
    {
      icon: Database,
      title: "Intelligent CSV Mapper",
      desc: "Upload complex Excel and mapping variables. Matches 'Cardholder Name' to columns like 'First Name' + 'Last Name' instantly.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Barcode Formats",
      desc: "Support Code 128, EAN-13, QR codes, and PDF417 format. Encode encryption hashes or custom ID links on generation.",
    },
    {
      icon: Printer,
      title: "Unified Print Calibration",
      desc: "Save custom margins, bleed margins, and crop marks for CR80 card sheets (85.60 × 53.98 mm), preventing printing misalignments.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
      {/* HEADER HERO */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <Layers className="w-3.5 h-3.5" /> High-Performance Card Design
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          SaaS Editor for Precision Printing
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          Skip complex desktop tools. Z Cards brings full vector layout editors, custom barcode renders, and automated data mapping directly into the cloud.
        </p>
      </section>

      {/* SIMULATED LAYOUT CANVAS */}
      <section className="p-8 rounded-2xl border border-card-border bg-card-bg/30">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Z Cards Studio Simulator</h2>
          <p className="text-xs text-muted leading-relaxed">
            Drag the positioning sliders or toggle layers below to simulate our cloud-based card layout compiler.
          </p>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-card-border shadow-xs">
            Standard Card Size: 85.60 × 53.98 mm
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Canvas Panel (col-span-7) */}
          <div className="lg:col-span-7 rounded-xl bg-zinc-900/10 dark:bg-zinc-950/60 border border-card-border p-6 flex items-center justify-center min-h-[480px]">
            {/* The Visual Badge Container */}
            <div className="relative w-72 h-108 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden select-none">
              {/* Card top banner decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary" />

              {/* Header organization bar */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                  Z Cards DEV STUDIO
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              {/* Dynamic rendering of layers */}
              {layers.map((layer) => {
                if (!layer.visible) return null;

                const isSelected = selectedLayerId === layer.id;

                // Position styling based on layer sliders (mapping 0-100% boundary)
                const layerStyle: React.CSSProperties = {
                  top: `${layer.y}%`,
                  left: `${layer.x}%`,
                  transform: `translate(-50%, -50%)`,
                  textAlign: layer.align,
                };

                return (
                  <div
                    key={layer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                    }}
                    style={layerStyle}
                    className={`absolute px-2 py-1.5 rounded cursor-pointer transition-shadow hover:ring-1 hover:ring-primary/40 ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5 dark:bg-primary/10 select-none z-30"
                        : "z-20"
                    }`}
                  >
                    {layer.id === "photo" && (
                      <div className="relative w-20 h-20 rounded-full border-2 border-primary/20 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-inner flex items-center justify-center">
                        <UserRound className="w-10 h-10 text-zinc-400 dark:text-zinc-500 pointer-events-none" strokeWidth={1.5} />
                      </div>
                    )}

                    {layer.id === "name" && (
                      <h4
                        className={`font-bold tracking-tight text-foreground leading-none pointer-events-none ${
                          layer.fontSize === "sm"
                            ? "text-xs"
                            : layer.fontSize === "md"
                            ? "text-sm"
                            : "text-base"
                        }`}
                      >
                        Name
                      </h4>
                    )}

                    {layer.id === "role" && (
                      <p
                        className={`text-muted font-medium pointer-events-none leading-none ${
                          layer.fontSize === "sm"
                            ? "text-[9px]"
                            : layer.fontSize === "md"
                            ? "text-xs"
                            : "text-sm"
                        }`}
                      >
                        Lead HR Manager
                      </p>
                    )}

                    {layer.id === "barcode" && (
                      <div className="flex flex-col items-center gap-0.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-card-border shadow-xs pointer-events-none">
                        <div className="h-6 w-24 flex items-center gap-[2px]">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <span
                              key={i}
                              style={{ width: i % 3 === 0 ? "3px" : "1px" }}
                              className="h-full bg-zinc-800 dark:bg-zinc-300"
                            />
                          ))}
                        </div>
                        <span className="text-[7px] font-mono text-muted tracking-widest leading-none">
                          HR-928104
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Card ID branding */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[8px] text-zinc-400 font-semibold border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span>VERIFIED PERSONNEL</span>
                <span className="font-mono">SECURE CHIP V2</span>
              </div>
            </div>
          </div>

          {/* Controls Sidebar (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-xl bg-card-bg/60 border border-card-border/80 text-left">
            <div className="space-y-6">
              {/* Layers List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Layers className="w-4.5 h-4.5 text-primary" /> Visual Layers
                </h3>
                <div className="space-y-1.5">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm cursor-pointer transition-all ${
                        selectedLayerId === layer.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-card-border hover:border-foreground/30 text-foreground"
                      }`}
                    >
                      <span className="font-medium">{layer.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateLayer(layer.id, { visible: !layer.visible });
                        }}
                        className="p-1 text-muted hover:text-foreground hover:bg-muted-bg rounded cursor-pointer"
                        title={layer.visible ? "Hide Layer" : "Show Layer"}
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjust selected layer properties */}
              {selectedLayer && (
                <div className="space-y-4 pt-4 border-t border-card-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Properties: {selectedLayer.name}
                  </h4>

                  {/* Position controls (Sliders) */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted">
                        <span>X Offset (Horizontal)</span>
                        <span>{selectedLayer.x}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        value={selectedLayer.x}
                        onChange={(e) => updateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                        className="w-full h-1.5 bg-muted-bg rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted">
                        <span>Y Offset (Vertical)</span>
                        <span>{selectedLayer.y}%</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="85"
                        value={selectedLayer.y}
                        onChange={(e) => updateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                        className="w-full h-1.5 bg-muted-bg rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  {/* Text Size / Alignment (only for text layers) */}
                  {["name", "role"].includes(selectedLayer.id) && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Font Size */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-muted uppercase">Size</span>
                        <div className="flex gap-1">
                          {(["sm", "md", "lg"] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => updateLayer(selectedLayer.id, { fontSize: sz })}
                              className={`flex-1 py-1 text-2xs font-bold uppercase rounded border cursor-pointer ${
                                selectedLayer.fontSize === sz
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-card-border hover:bg-muted-bg"
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Align */}
                      <div className="space-y-1.5">
                        <span className="block text-[10px] font-bold text-muted uppercase">Align</span>
                        <div className="flex gap-1">
                          {(["left", "center", "right"] as const).map((al) => (
                            <button
                              key={al}
                              onClick={() => updateLayer(selectedLayer.id, { align: al })}
                              className={`flex-1 py-1 flex items-center justify-center rounded border cursor-pointer ${
                                selectedLayer.align === al
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-card-border hover:bg-muted-bg"
                              }`}
                            >
                              {al === "left" ? (
                                <AlignLeft className="w-3.5 h-3.5" />
                              ) : al === "center" ? (
                                <AlignCenter className="w-3.5 h-3.5" />
                              ) : (
                                <AlignRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-card-border mt-4 flex items-center justify-between">
              <span className="text-xs text-muted font-medium flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 animate-spin" /> Live engine sync active
              </span>
              <Button size="sm" onClick={() => setSelectedLayerId("name")}>
                Reset Selection
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SPECIFICATIONS GRID */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {featureGrid.map((feat, idx) => (
          <div key={idx} className="p-6 rounded-xl border border-card-border bg-card-bg/25 text-left">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              <feat.icon className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-bold text-base text-foreground mb-2">{feat.title}</h3>
            <p className="text-xs text-muted leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>

      {/* HIGH RESOLUTION PRINT DETAILS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-left space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Print Engine Calibrated for Thermal and Dye-Sub Printers
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            Z Cards does not just generate simple images. We produce high-resolution vector PDF blocks that render beautifully at 300 DPI, preventing blurry text, scan issues on barcode readers, or pixelated photos.
          </p>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Direct double-sided printing support
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Dynamic bleed margins and card borders alignment
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> CMYK color profile exports ready for print shops
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-card-border bg-zinc-900/5 p-8 flex items-center justify-center">
          <div className="relative w-full max-w-sm rounded-lg bg-background border border-card-border p-4 shadow-md space-y-4">
            <div className="flex items-center justify-between text-xs text-muted font-bold border-b pb-2">
              <span>PDF COMPILER OUTPUT</span>
              <Maximize className="w-4 h-4 text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[1/1.5] rounded border border-card-border bg-muted-bg/50 flex flex-col p-1.5 justify-between">
                  <div className="w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-zinc-300 dark:bg-zinc-700" />
                    <div className="h-1 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                  <div className="h-2 w-full bg-zinc-300 dark:bg-zinc-700 rounded-xs" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-center text-muted font-mono uppercase tracking-wider">
              Ready-to-Print Sheet Matrix Grid (300 DPI Export)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import TrenUI from "./TrenUI";
import ReflejosUI from "./ReflejosUI";
import CortarPanUI from "./CortarPanUI";
import CronometroCiegoUI from "./CronometroCiegoUI";
import MayorMenorUI from "./MayorMenorUI";
import DilemaPrisioneroUI from "./DilemaPrisioneroUI";

export type OrderMinigameType = "tren" | "reflejos" | "pan" | "crono" | "cartas" | "dilema";

interface OrderMinigameOverlayProps {
  minigameType: OrderMinigameType;
  onAction: (result: { score: number }) => void;
  onClose: () => void;
}

export default function OrderMinigameOverlay({
  minigameType,
  onAction,
}: OrderMinigameOverlayProps) {
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const renderMinigame = () => {
    switch (minigameType) {
      case "tren":
        return <TrenUI onAction={onAction} />;
      case "reflejos":
        return <ReflejosUI onAction={onAction} />;
      case "pan":
        return <CortarPanUI onAction={onAction} />;
      case "crono":
        return <CronometroCiegoUI onAction={onAction} />;
      case "cartas":
        return <MayorMenorUI onAction={onAction} />;
      case "dilema":
        return <DilemaPrisioneroUI onAction={onAction} />;
      default:
        return null;
    }
  };

  const titles: Record<OrderMinigameType, string> = {
    tren: "¡CUENTA LOS PASAJEROS!",
    reflejos: "¡REACCIONA RÁPIDO!",
    pan: "¡CORTA EL PAN!",
    crono: "¡PARA EL CRONO!",
    cartas: "¡ELIGE UNA CARTA!",
    dilema: "DILEMA DEL PRISIONERO",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent backdrop-blur-none animate-in fade-in duration-300 pointer-events-none">
      <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden pointer-events-auto">
        
        {/* Header con título pixel art (visible solo el primer segundo) */}
        {showInstructions && (
          <div className="absolute top-0 left-0 right-0 p-12 flex justify-center items-center z-[110] bg-black/40 backdrop-blur-sm border-b-4 border-amber-500/50 animate-out fade-out slide-out-to-top duration-500 fill-mode-forwards" style={{ animationDelay: '800ms' }}>
            <h2 className="text-4xl md:text-6xl text-white font-pixel tracking-[0.2em] drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center uppercase">
              {titles[minigameType]}
            </h2>
          </div>
        )}

        {/* Área del Minijuego - Ocupa todo el espacio */}
        <div className="w-full h-full flex items-center justify-center relative">
          {renderMinigame()}
        </div>

        {/* Footer Informativo (visible solo el primer segundo) */}
        {showInstructions && (
          <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none z-50 animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '800ms' }}>
            <p className="text-amber-500/80 font-pixel text-sm md:text-lg uppercase tracking-[0.4em] drop-shadow-md">
              Snow Party • Preparando Desafío
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

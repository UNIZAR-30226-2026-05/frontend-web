"use client";

import React from "react";
import TrenUI from "./TrenUI";
import ReflejosUI from "./ReflejosUI";
import CortarPanUI from "./CortarPanUI";
import CronometroCiegoUI from "./CronometroCiegoUI";
import MayorMenorUI from "./MayorMenorUI";
import PixelButton from "@/components/UI/PixelButton";

export type OrderMinigameType = "tren" | "reflejos" | "pan" | "crono" | "cartas";

interface OrderMinigameOverlayProps {
  minigameType: OrderMinigameType;
  onAction: (result: any) => void;
  onClose: () => void;
}

export default function OrderMinigameOverlay({
  minigameType,
  onAction,
  onClose,
}: OrderMinigameOverlayProps) {
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
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center border-4 border-white/20 bg-slate-900 overflow-hidden rounded-lg">
        {/* Header con título pixel art */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-slate-800/50 border-b-4 border-white/10">
          <h2 className="text-2xl md:text-4xl text-white font-pixel tracking-wider drop-shadow-md">
            {titles[minigameType]}
          </h2>
          <PixelButton 
            variant="red" 
            onClick={onClose}
            className="text-xs px-4 py-2 scale-75 md:scale-100"
          >
            SALIR
          </PixelButton>
        </div>

        {/* Área del Minijuego */}
        <div className="flex-1 w-full flex items-center justify-center p-4">
          {renderMinigame()}
        </div>

        {/* Footer Informativo */}
        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
          <p className="text-white/40 font-pixel text-[10px] uppercase tracking-[0.2em]">
            Minijuegos de Orden • Snow Party
          </p>
        </div>
      </div>
    </div>
  );
}

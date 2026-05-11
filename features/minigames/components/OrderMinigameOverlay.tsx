"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import TrenUI from "./TrenUI";
import ReflejosUI from "./ReflejosUI";
import CortarPanUI from "./CortarPanUI";
import CronometroCiegoUI from "./CronometroCiegoUI";
import MayorMenorUI from "./MayorMenorUI";
import DilemaPrisioneroUI from "./DilemaPrisioneroUI";

export type OrderMinigameType = "tren" | "reflejos" | "pan" | "crono" | "cartas" | "dilema";

export interface MinigameResultEntry {
  username: string;
  score: number;
  posicion: number;
  character: string;
}

interface OrderMinigameOverlayProps {
  minigameType: OrderMinigameType;
  /** Nombre del minijuego recibido del backend (p.ej. "Tren", "Reflejos") */
  minigameName: string;
  /** Descripción enviada por el backend junto con ini_minijuego */
  description?: string;
  onAction: (result: { score: number | string; objetivo?: number }) => void;
  /** Llamado automáticamente 5 s después de mostrar los resultados */
  onResultsClosed: () => void;
  backendCardIndexes?: number[];
  assignedCardSlot?: number;
  /** Tiempo objetivo en segundos para el Cronómetro Ciego */
  objetivo?: number;
  /** true mientras el jugador espera los resultados del resto */
  waitingForResults?: boolean;
  /** Resultados clasificados para mostrar el podio inline */
  results?: MinigameResultEntry[];
}

type Phase = "countdown" | "playing" | "waiting" | "results";

const CHARACTER_IMAGES: Record<string, string> = {
  banquero: "/personajes_profile/banquero_profile.png",
  videojugador: "/personajes_profile/videojugador_profile.png",
  escapista: "/personajes_profile/escapista_profile.png",
  vidente: "/personajes_profile/vidente_profile.png",
};

const MEDALS = ["🥇", "🥈", "🥉", ""];

export default function OrderMinigameOverlay({
  minigameType,
  minigameName,
  description,
  onAction,
  onResultsClosed,
  backendCardIndexes,
  assignedCardSlot,
  objetivo,
  waitingForResults,
  results,
}: OrderMinigameOverlayProps) {
  const [phase, setPhase] = useState<Phase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const scoreSubmittedRef = useRef(false);

  // ── Cuenta atrás ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      if (countdown <= 1) {
        setPhase("playing");
      } else {
        setCountdown((c) => c - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // ── Transición a "waiting" cuando el backend confirma el envío ────
  useEffect(() => {
    if (waitingForResults && phase === "playing") {
      const t = setTimeout(() => setPhase("waiting"), 0);
      return () => clearTimeout(t);
    }
  }, [waitingForResults, phase]);

  // ── Transición a "results" cuando llegan los datos ─────────────────
  useEffect(() => {
    if (results && results.length > 0 && phase !== "results") {
      const t = setTimeout(() => setPhase("results"), 0);
      return () => clearTimeout(t);
    }
  }, [results, phase]);

  // ── Cierre automático 5 s después de mostrar resultados ───────────
  useEffect(() => {
    if (phase !== "results") return;
    const t = setTimeout(() => onResultsClosed(), 5000);
    return () => clearTimeout(t);
  }, [phase, onResultsClosed]);

  // ── Wrapper del callback que impide reenvíos ───────────────────────
  const handleAction = (result: { score: number | string; objetivo?: number }) => {
    if (scoreSubmittedRef.current) return;
    scoreSubmittedRef.current = true;
    setPhase("waiting");
    onAction(result);
  };

  // ── Minijuego activo ──────────────────────────────────────────────
  const renderMinigame = () => {
    switch (minigameType) {
      case "tren":
        return <TrenUI onAction={handleAction} />;
      case "reflejos":
        return <ReflejosUI onAction={handleAction} objetivo={objetivo} />;
      case "pan":
        return <CortarPanUI onAction={handleAction} />;
      case "crono":
        return <CronometroCiegoUI onAction={handleAction} objetivo={objetivo} />;
      case "cartas":
        return (
          <MayorMenorUI
            onAction={handleAction}
            backendCardIndexes={backendCardIndexes}
            assignedCardSlot={assignedCardSlot}
          />
        );
      case "dilema":
        return <DilemaPrisioneroUI onAction={handleAction} />;
      default:
        return null;
    }
  };

  const sortedResults = results ? [...results].sort((a, b) => a.posicion - b.posicion) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 animate-in fade-in duration-300">

      {/* ── Header: nombre y descripción (solo durante la cuenta atrás) ── */}
      {phase === "countdown" && (
        <div className="absolute top-0 left-0 right-0 p-8 flex flex-col items-center gap-3 z-[110] pointer-events-none">
          <h2 className="text-4xl md:text-5xl text-amber-400 font-pixel tracking-[0.15em] drop-shadow-[0_0_20px_rgba(255,200,0,0.5)] text-center uppercase">
            {minigameName.toUpperCase()}
          </h2>
          {description && (
            <p className="text-white/80 font-pixel text-xs md:text-sm text-center max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}

      {/* ── Fase 1: Cuenta atrás ── */}
      {phase === "countdown" && (
        <div className="flex flex-col items-center gap-8">
          <p className="text-white/70 font-pixel text-lg tracking-[0.2em] uppercase">
            PREPÁRATE...
          </p>
          <span
            key={countdown}
            className="text-[10rem] font-pixel text-white leading-none drop-shadow-[0_0_30px_rgba(255,200,0,0.5)] animate-in zoom-in duration-300"
          >
            {countdown === 0 ? "¡YA!" : countdown}
          </span>
        </div>
      )}

      {/* ── Fase 2: Minijuego ── */}
      {phase === "playing" && (
        <div className="absolute inset-0 w-full h-full">
          {renderMinigame()}
        </div>
      )}

      {/* ── Fase 3: Esperando resultados ── */}
      {phase === "waiting" && (
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-amber-400 font-pixel text-3xl uppercase tracking-widest">
            {minigameName.toUpperCase()}
          </h2>
          <div className="w-14 h-14 border-4 border-white/20 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-white/60 font-pixel text-xs uppercase tracking-[0.2em] animate-pulse">
            Esperando resultados...
          </p>
        </div>
      )}

      {/* ── Fase 4: Resultados inline ── */}
      {phase === "results" && sortedResults.length > 0 && (
        <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4">
          <h1 className="text-4xl md:text-5xl font-pixel text-amber-400 uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] text-center">
            {minigameName.toUpperCase()}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <h2 className="text-amber-400 font-pixel text-2xl uppercase tracking-tighter">
              Resultados
            </h2>
          </div>
          <div className="bg-black/60 border-2 border-white/20 rounded-2xl p-6 w-full space-y-4">
            {sortedResults.map((r, i) => (
              <div key={r.username} className="flex items-center gap-4">
                <span className="text-xl w-8 text-center">{MEDALS[Math.min(i, 3)]}</span>
                <div
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center bg-black/40 p-1 ${
                    i === 0 ? "border-amber-400/50 shadow-[0_0_10px_rgba(255,200,0,0.2)]" : "border-white/10"
                  }`}
                >
                  <Image
                    src={
                      CHARACTER_IMAGES[r.character.toLowerCase()] ??
                      "/personajes_profile/vidente_profile.png"
                    }
                    alt={r.character}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span
                  className={`font-pixel text-lg uppercase tracking-wide flex-1 ${
                    i === 0 ? "text-amber-400" : "text-white"
                  }`}
                >
                  {r.username}
                </span>
                <span className="font-pixel text-white/70 text-base">{r.score}</span>
              </div>
            ))}
          </div>
          <p className="text-white/40 font-pixel text-xs">Volviendo al tablero...</p>
          <div className="w-5 h-5 border-2 border-white/20 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";
import type { PokerCard } from "@/features/board/context/GameContext";

// -------------------------------------------------------------------
// Tipos locales (solo visuales)
// -------------------------------------------------------------------
type CharacterRole = "banquero" | "escapista" | "vidente" | "videojugador";

interface Rival {
  name: string;
  role: CharacterRole;
  balance: number;
  folded: boolean;
  position: "left" | "top" | "right";
}

interface PokerUIProps {
  onClose: () => void;
}

// -------------------------------------------------------------------
// Componente principal
// -------------------------------------------------------------------
export default function PokerUI({ onClose }: PokerUIProps) {
  const { state, myPlayer, playerOrder, sendPokerAction } = useGameContext();
  const { pokerState } = state;

  // Mi rol (para seleccionar fondo de mesa)
  const myRole = (myPlayer?.character as CharacterRole) || "videojugador";

  // ---------------------------------------------------------------
  // Rivales reconstruidos desde playerOrder + jugadoresActivos
  // ---------------------------------------------------------------
  const rivals = useMemo(() => {
    const positions: ("left" | "top" | "right")[] = ["left", "top", "right"];
    const myIdx = playerOrder.findIndex(p => p.username === state.myUsername);
    const result: Rival[] = [];
    let idx = 0;
    for (let i = 1; i < playerOrder.length && idx < 3; i++) {
      const p = playerOrder[(myIdx + i) % playerOrder.length];
      if (p.username !== state.myUsername) {
        result.push({
          name: p.username,
          role: (p.character as CharacterRole) || "videojugador",
          balance: p.balance,
          folded: !pokerState.jugadoresActivos.includes(p.username),
          position: positions[idx],
        });
        idx++;
      }
    }
    return result;
  }, [playerOrder, state.myUsername, pokerState.jugadoresActivos]);

  // ---------------------------------------------------------------
  // Cartas & bote
  // ---------------------------------------------------------------
  const myCards = pokerState.misCartas;
  const communityCards = pokerState.mesaVisible;
  const pot = pokerState.bote;

  // ---------------------------------------------------------------
  // Control de acciones
  // ---------------------------------------------------------------
  const amIActive = state.myUsername !== null
    && pokerState.jugadoresActivos.includes(state.myUsername);

  const canAct = !pokerState.hasActedThisPhase
    && amIActive
    && pokerState.turnoDe === state.myUsername
    && pokerState.fase !== 'Resultados'
    && pokerState.fase !== '';

  const minActiveBalance = useMemo(() => {
    if (pokerState.jugadoresActivos.length === 0) return myPlayer?.balance ?? 1;
    const balances = pokerState.jugadoresActivos.map(username => state.players[username]?.balance ?? 0);
    return Math.min(...balances);
  }, [pokerState.jugadoresActivos, state.players, myPlayer?.balance]);

  // Slider de apuesta (máximo = balance mínimo entre jugadores activos)
  const maxBet = minActiveBalance;
  const [raiseAmount, setRaiseAmount] = useState(1);

  const handleFold = () => sendPokerAction('retirarse', 0);
  const handleCall = () => {
    if (pokerState.apuestaObjetivo === 0) {
      sendPokerAction('pasar', 0);
    } else {
      sendPokerAction('apostar', pokerState.apuestaObjetivo);
    }
  };
  const handleRaise = () => sendPokerAction('apostar', pokerState.apuestaObjetivo + raiseAmount);

  // ---------------------------------------------------------------
  // Resultados
  // ---------------------------------------------------------------
  const resultados = pokerState.resultados;
  const winner = useMemo(() => {
    if (!resultados || resultados.idGanadores.length === 0) return null;
    const winnerUsername = resultados.idGanadores[0];
    const winnerPlayer = playerOrder.find(p => p.username === winnerUsername);
    return {
      name: winnerUsername,
      role: (winnerPlayer?.character as CharacterRole) || "videojugador",
      isMe: winnerUsername === state.myUsername,
    };
  }, [resultados, playerOrder, state.myUsername]);

  // ---------------------------------------------------------------
  // Helpers visuales
  // ---------------------------------------------------------------
  const getRivalContainerStyle = (pos: "left" | "top" | "right") => {
    switch (pos) {
      case "left": return "left-16 top-1/2 -translate-y-1/2";
      case "top": return "top-12 left-1/2 -translate-x-1/2";
      case "right": return "right-16 top-1/2 -translate-y-1/2";
    }
  };

  const cardSrc = (card: PokerCard) =>
    `/minijuegos/carta_alta/cards/card_${card.suit}_${card.rank}.png`;

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden font-pixel bg-black flex flex-col items-center justify-center">

      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src={`/minijuegos/carta_alta/mesa_${myRole}.png`}
          alt={`Mesa de ${myRole}`}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* --- FASE INDICATOR --- */}
      {pokerState.fase && pokerState.fase !== 'Resultados' && (
        <div className="absolute top-6 right-6 z-30 bg-black/80 border border-purple-500/50 px-4 py-2 rounded-lg">
          <span className="text-purple-400 text-[10px] font-pixel tracking-widest mr-2">FASE</span>
          <span className="text-white text-sm font-pixel">{pokerState.fase}</span>
        </div>
      )}

      {/* --- CENTER: BOTE & COMMUNITY CARDS --- */}
      <div className="relative z-10 flex flex-col items-center gap-6 mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="bg-black/80 border-2 border-amber-500 px-8 py-3 rounded-lg flex flex-col items-center shadow-2xl relative">
            <span className="text-amber-500 text-xs font-pixel tracking-widest mb-1 opacity-80">BOTE TOTAL</span>
            <span className="text-white text-4xl tracking-tighter font-pixel select-none">{pot}¢</span>
          </div>
        </div>

        <div className="flex flex-row gap-3">
          {communityCards.map((card, i) => (
            <div key={i} className="relative w-24 h-36 perspective-1000 group">
              <div className="relative w-full h-full transition-transform duration-700 preserve-3d rotate-y-180">
                <div className="absolute inset-0 backface-hidden rounded-lg overflow-hidden border border-white/5 bg-black/40">
                  <Image
                    src="/minijuegos/carta_alta/reverso_carta.png"
                    alt="Card back"
                    className="w-full h-full object-contain pixelated"
                    width={96}
                    height={144}
                  />
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src={cardSrc(card)}
                    alt="Card front"
                    className="w-full h-full object-contain pixelated"
                    width={96}
                    height={144}
                  />
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
          {/* Relleno hasta 3 slots */}
          {Array.from({ length: Math.max(0, 3 - communityCards.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="w-24 h-36 border-2 border-white/5 rounded-lg bg-black/10 backdrop-blur-[2px]" />
          ))}
        </div>
      </div>

      {/* --- RIVALS --- */}
      {rivals.map((rival, rIdx) => (
        <div
          key={rIdx}
          className={`absolute z-20 flex flex-col items-center group transition-all duration-700 ${getRivalContainerStyle(rival.position)} ${rival.folded ? "opacity-30 grayscale scale-90" : "opacity-100"}`}
        >
          {/* Reverso de cartas del rival (siempre 2 dorsos) */}
          <div className="flex flex-row -space-x-8 mb-4">
            {[0, 1].map(i => (
              <div key={i} className={`relative w-14 h-20 rotate-[${i === 0 ? '-12deg' : '12deg'}] shadow-lg`}>
                <Image
                  src="/minijuegos/carta_alta/reverso_carta.png"
                  alt="Card back"
                  className="w-full h-full object-contain pixelated"
                  width={96}
                  height={144}
                />
              </div>
            ))}
          </div>

          <div className="relative">
            <div className={`w-20 h-20 border-2 rounded-full overflow-hidden bg-slate-900 shadow-2xl relative transition-colors border-white/20`}>
              <Image
                src={`/personajes_profile/${rival.role}_profile.png`}
                alt={rival.name}
                fill
                className="object-cover"
              />
            </div>
            {rival.folded && (
              <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center rounded-full">
                <span className="text-[10px] font-bold text-white tracking-widest outline-black">RETIRADO</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-slate-950 border border-white/20 text-white text-[10px] px-2 py-0.5 rounded leading-tight shadow-xl font-mono">
              {rival.balance}¢
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center">
            <span className="text-[12px] uppercase tracking-[0.2em] drop-shadow-lg text-gray-300">{rival.name}</span>
          </div>
        </div>
      ))}

      {/* --- BOTTOM: LOCAL PLAYER --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pb-8 pt-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity ${resultados !== null ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>

        <div className="flex flex-row items-end gap-12 w-full max-w-7xl justify-between px-20">

          {/* Player Identity + Cards */}
          <div className="flex items-center gap-10">
            <div className="flex flex-row -space-x-14">
              {myCards.map((card, i) => (
                <div key={i} className={`w-32 h-44 rotate-[${i === 0 ? '-12deg' : '12deg'}] shadow-2xl transition-transform hover:-translate-y-6 hover:scale-105 group relative`}>
                  <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover:opacity-100 rounded-lg blur-md transition-opacity" />
                  <Image
                    src={cardSrc(card)}
                    alt="Your card"
                    className="w-full h-full object-contain pixelated relative z-10"
                    height={176}
                    width={128}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-3 relative">
              {canAct && (
                <div className="absolute -top-12 left-0 bg-amber-500 text-slate-950 text-[10px] px-3 py-1 rounded-sm font-bold animate-pulse shadow-lg">ES TU TURNO</div>
              )}
              <div className="flex items-center gap-5">
                <div className={`relative w-24 h-24 border-4 rounded-full overflow-hidden bg-slate-900 shadow-2xl transition-all ${canAct ? 'border-amber-400 scale-105 shadow-amber-500/20' : 'border-white/10 opacity-70'}`}>
                  <Image src={`/personajes_profile/${myRole}_profile.png`} alt="Tú" fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-amber-500 text-[10px] uppercase font-pixel tracking-widest opacity-80">TU</span>
                  <span className="text-white text-4xl tracking-tighter tabular-nums font-pixel">{myPlayer?.balance ?? 0}¢</span>
                </div>
              </div>
            </div>
          </div>

          {/* Betting Interface */}
          <div className="flex flex-col items-center gap-6">
            {/* Apuesta objetivo actual */}
            {pokerState.apuestaObjetivo > 0 && (
              <div className="bg-blue-600 border-2 border-blue-400 px-5 py-2 rounded-sm shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] text-blue-100 font-pixel opacity-70">APUESTA ACTUAL</span>
                <span className="text-white text-2xl font-bold tabular-nums">{pokerState.apuestaObjetivo}¢</span>
              </div>
            )}

            {!amIActive && pokerState.fase !== 'Resultados' && pokerState.fase !== '' && (
              <div className="bg-red-900/60 border border-red-500/30 px-6 py-3 rounded-lg">
                <span className="text-red-300 text-sm font-pixel tracking-widest">TE HAS RETIRADO</span>
              </div>
            )}

            <div className="flex flex-row gap-5 items-center">
              <PixelButton
                variant="red"
                className="w-44 py-6 text-sm"
                onClick={handleFold}
                disabled={!canAct}
              >
                RETIRARSE
              </PixelButton>

              <PixelButton
                variant={pokerState.apuestaObjetivo > 0 ? "purple" : "green"}
                className="w-56 py-6 text-sm"
                onClick={handleCall}
                disabled={!canAct}
              >
                {pokerState.apuestaObjetivo > 0 ? `IGUALAR ${pokerState.apuestaObjetivo}¢` : "PASAR"}
              </PixelButton>

              <div className="flex flex-col gap-4 p-4 bg-slate-900/60 border border-purple-500/30 rounded-lg backdrop-blur-md w-64 shadow-2xl group">
                <div className="flex justify-between items-center opacity-80">
                  <span className="text-purple-400 text-[9px] font-pixel tracking-widest">SUBIR APUESTA</span>
                  <span className="text-white text-sm font-bold font-mono">+{raiseAmount}¢</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(1, maxBet - pokerState.apuestaObjetivo)}
                  step="1"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  disabled={!canAct}
                />
                <PixelButton
                  variant="purple"
                  className="w-full py-5 text-sm"
                  disabled={!canAct || maxBet < pokerState.apuestaObjetivo + 1}
                  onClick={handleRaise}
                >
                  SUBIR
                </PixelButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- WINNER OVERLAY --- */}
      {resultados !== null && winner && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-700">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 animate-pulse" />
              <div className="w-48 h-48 border-8 border-amber-500 rounded-full overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.4)] relative">
                <Image src={`/personajes_profile/${winner.role}_profile.png`} alt="Winner" fill className="object-cover scale-110" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 px-6 py-2 rounded shadow-2xl">
                <span className="text-slate-950 font-pixel text-xl tracking-widest">GANADOR</span>
              </div>
            </div>

            <h2 className="text-white text-4xl mb-2 font-pixel tracking-tighter text-center uppercase drop-shadow-lg">
              {winner.isMe ? "¡TÚ GANAS!" : winner.name}
            </h2>
            <p className="text-amber-500 text-lg mb-10 font-mono tracking-widest opacity-80 text-center">SE LLEVA EL BOTE</p>

            <div className="bg-white/5 border border-amber-500/20 px-12 py-6 rounded-xl flex flex-col items-center transition-transform hover:scale-105">
              <span className="text-white/40 text-[10px] mb-2 font-pixel">TOTAL PREMIO</span>
              <span className="text-white text-6xl font-pixel tracking-tighter text-amber-500">{resultados.boteGanado}¢</span>
            </div>

            <PixelButton
              variant="green"
              className="mt-12 w-64 text-sm"
              onClick={onClose}
            >
              CONTINUAR
            </PixelButton>
          </div>
        </div>
      )}

      {/* --- WAITING MESSAGE (no cards yet) --- */}
      {pokerState.fase === '' && (
        <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center">
          <div className="bg-black/90 border-2 border-purple-500/50 px-12 py-8 rounded-xl flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-pixel text-lg tracking-widest">ESPERANDO CARTAS...</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .pixelated { image-rendering: pixelated; }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-pulse-slow { animation: pulse-slow 4s infinite; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

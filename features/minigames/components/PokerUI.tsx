"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import PixelButton from "@/components/UI/PixelButton";

interface Card {
  suit: string;
  rank: number;
}

type CharacterRole = "banquero" | "escapista" | "vidente" | "videojugador";

interface Rival {
  id: number; // 1: Left, 2: Top, 3: Right
  name: string;
  role: CharacterRole;
  balance: number;
  currentBet: number;
  folded: boolean;
  position: "left" | "top" | "right";
  cards: Card[];
}

interface PokerUIProps {
  onAction: (result: { type: "fold"; phase: GamePhase }) => void;
  character?: CharacterRole;
}

type GamePhase = "Pre-Flop" | "Flop" | "Turn" | "River";

// Rotation mapping to match static backgrounds (mesa_*.png)
const RIVAL_POSITIONS: Record<CharacterRole, { left: CharacterRole, top: CharacterRole, right: CharacterRole }> = {
  banquero: { left: "escapista", top: "vidente", right: "videojugador" },
  videojugador: { left: "banquero", top: "escapista", right: "vidente" },
  vidente: { left: "videojugador", top: "banquero", right: "escapista" },
  escapista: { left: "vidente", top: "videojugador", right: "banquero" },
};

const DEFAULT_BALANCE = 10;

interface PokerSetup {
  myCards: Card[];
  communityCards: Card[];
  rivals: Rival[];
  myBalance: number;
  myCurrentBet: number;
  pot: number;
  gamePhase: GamePhase;
  currentTurnId: number;
  winnerId: number | null;
  raiseAmountSlider: number;
}

function createRivals(role: CharacterRole, balance: number): Rival[] {
  const roles = RIVAL_POSITIONS[role];

  return [
    { id: 1, name: roles.left.charAt(0).toUpperCase() + roles.left.slice(1), role: roles.left, balance, currentBet: 0, folded: false, position: "left", cards: [] },
    { id: 2, name: roles.top.charAt(0).toUpperCase() + roles.top.slice(1), role: roles.top, balance, currentBet: 0, folded: false, position: "top", cards: [] },
    { id: 3, name: roles.right.charAt(0).toUpperCase() + roles.right.slice(1), role: roles.right, balance, currentBet: 0, folded: false, position: "right", cards: [] },
  ];
}

function createGameSetup(role: CharacterRole, balance: number): PokerSetup {
  const suits = ["hearts", "diamonds", "spades", "clubs"];
  const fullDeck: Card[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      fullDeck.push({ suit, rank });
    }
  }

  const shuffled = [...fullDeck].sort(() => Math.random() - 0.5);
  const rivals = createRivals(role, balance).map((rival, index) => ({
    ...rival,
    cards: shuffled.slice(7 + index * 2, 9 + index * 2),
  }));

  return {
    myCards: shuffled.slice(0, 2),
    communityCards: shuffled.slice(2, 7),
    rivals,
    myBalance: balance,
    myCurrentBet: 0,
    pot: 0,
    gamePhase: "Pre-Flop",
    currentTurnId: 0,
    winnerId: null,
    raiseAmountSlider: 10,
  };
}

export default function PokerUI({ onAction, character }: PokerUIProps) {
  const initialRole = character || "videojugador";
  const initialSetup = useMemo(() => createGameSetup(initialRole, DEFAULT_BALANCE), [initialRole]);
  // --- Debug States ---
  const [isDebug, setIsDebug] = useState(true);
  const [isDebugShowCards, setIsDebugShowCards] = useState(false);
  const [myRole, setMyRole] = useState<CharacterRole>(initialRole);
  const [gamePhase, setGamePhase] = useState<GamePhase>(initialSetup.gamePhase);
  const [flopCardsCount, setFlopCardsCount] = useState(3);
  const [currentTurnId, setCurrentTurnId] = useState<number>(initialSetup.currentTurnId); // 0: Me, 1: Left, 2: Top, 3: Right
  const [winnerId, setWinnerId] = useState<number | null>(initialSetup.winnerId);

  // --- Game Data ---
  const [myCards, setMyCards] = useState<Card[]>(initialSetup.myCards);
  const [communityCards, setCommunityCards] = useState<Card[]>(initialSetup.communityCards);
  const [myCurrentBet, setMyCurrentBet] = useState(initialSetup.myCurrentBet);
  const [myBalance, setMyBalance] = useState(initialSetup.myBalance);
  const [pot, setPot] = useState(initialSetup.pot);
  
  // Rivals state depends on myRole
  const [rivals, setRivals] = useState<Rival[]>(initialSetup.rivals);
  
  // Betting state
  const [raiseAmountSlider, setRaiseAmountSlider] = useState(initialSetup.raiseAmountSlider);

  // Derived: highest bet on the table
  const highestBet = useMemo(() => {
    return Math.max(myCurrentBet, ...rivals.map(r => r.currentBet));
  }, [myCurrentBet, rivals]);

  const initGame = useCallback((role: CharacterRole = myRole, balance: number = DEFAULT_BALANCE) => {
    const nextSetup = createGameSetup(role, balance);

    setMyCards(nextSetup.myCards);
    setCommunityCards(nextSetup.communityCards);
    setRivals(nextSetup.rivals);
    setMyBalance(nextSetup.myBalance);
    setMyCurrentBet(nextSetup.myCurrentBet);
    setPot(nextSetup.pot);
    setGamePhase(nextSetup.gamePhase);
    setWinnerId(nextSetup.winnerId);
    setCurrentTurnId(nextSetup.currentTurnId);
    setRaiseAmountSlider(nextSetup.raiseAmountSlider);
    setIsDebugShowCards(false);
  }, [myRole]);

  const visibleCommunityCount = useMemo(() => {
    switch (gamePhase) {
      case "Pre-Flop": return 0;
      case "Flop": return flopCardsCount;
      case "Turn": return 4;
      case "River": return 5;
      default: return 0;
    }
  }, [gamePhase, flopCardsCount]);

  const handleActionClick = (type: string) => {
    if (type === "fold") {
      onAction({ type: "fold", phase: gamePhase });
    } else if (type === "call") {
      const callAmount = Math.min(myBalance, highestBet - myCurrentBet);
      setMyBalance(prev => prev - callAmount);
      setMyCurrentBet(prev => prev + callAmount);
      setPot(prev => prev + callAmount);
      setCurrentTurnId(1); // Pass turn
    } else if (type === "raise") {
      const totalToCommit = (highestBet - myCurrentBet) + raiseAmountSlider;
      const actualCommited = Math.min(myBalance, totalToCommit);
      setMyBalance(prev => prev - actualCommited);
      setMyCurrentBet(prev => prev + actualCommited);
      setPot(prev => prev + actualCommited);
      setCurrentTurnId(1);
    }
  };

  const updateRivalAction = (id: number, action: "fold" | "call" | "raise") => {
    setRivals(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (action === "fold") return { ...r, folded: true };
      if (action === "call") {
        const callAmount = Math.min(r.balance, highestBet - r.currentBet);
        setPot(p => p + callAmount);
        return { ...r, balance: r.balance - callAmount, currentBet: Math.max(r.currentBet + callAmount, highestBet) };
      }
      if (action === "raise") {
        const raiseVal = 20; // Fixed mock raise for debug
        const totalToCommit = (highestBet - r.currentBet) + raiseVal;
        const actualCommited = Math.min(r.balance, totalToCommit);
        setPot(p => p + actualCommited);
        return { ...r, balance: r.balance - actualCommited, currentBet: r.currentBet + actualCommited };
      }
      return r;
    }));
  };

  //const nextTurn = () => setCurrentTurnId(prev => (prev + 1) % 4);

  const getRivalContainerStyle = (pos: "left" | "top" | "right") => {
    switch (pos) {
      case "left": return "left-16 top-1/2 -translate-y-1/2";
      case "top": return "top-12 left-1/2 -translate-x-1/2";
      case "right": return "right-16 top-1/2 -translate-y-1/2";
    }
  };

  // Winner calculation (simple mock: highest rank in cards)
  const revealWinner = (id: number | null) => {
    setWinnerId(id);
    if (id !== null) {
        // Show for 3 seconds then reset winner but keep state or reset game
        setTimeout(() => {
            // Option to close overlay
        }, 3000);
    }
  };

  const currentWinner = useMemo(() => {
    if (winnerId === null) return null;
    if (winnerId === 0) return { name: "TÚ", role: myRole };
    const rival = rivals.find(r => r.id === winnerId);
    return rival ? { name: rival.name, role: rival.role } : null;
  }, [winnerId, rivals, myRole]);

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden font-pixel bg-black flex flex-col items-center justify-center">
      
      {/* --- DEBUG PANEL --- */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-[200] bg-black/95 p-4 border-2 border-purple-500 text-[10px] text-white flex flex-col gap-3 rounded-lg backdrop-blur-md w-72 shadow-2xl">
          <div className="font-bold text-purple-400 mb-1 flex justify-between items-center border-b border-purple-500/30 pb-2">
            <span>POKER REFINED DEBUGGER</span>
            <button onClick={() => setIsDebug(false)} className="text-red-500 hover:text-red-400">✕</button>
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-gray-400">MI PERSONAJE (Afecta posiciones)</label>
              <select 
                value={myRole} 
                onChange={(e) => {
                  const nextRole = e.target.value as CharacterRole;
                  setMyRole(nextRole);
                  initGame(nextRole);
                }}
                className="bg-slate-800 border border-purple-500/50 rounded px-2 py-1 outline-none text-xs"
              >
                <option value="banquero">Banquero</option>
                <option value="videojugador">Videojugador</option>
                <option value="escapista">Escapista</option>
                <option value="vidente">Vidente</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-gray-400">FASE & CARTAS</label>
              <div className="flex gap-2">
                  <select 
                    value={gamePhase} 
                    onChange={(e) => setGamePhase(e.target.value as GamePhase)}
                    className="flex-1 bg-slate-800 border border-purple-500/50 rounded px-2 py-1 outline-none"
                  >
                    <option value="Pre-Flop">Pre-Flop</option>
                    <option value="Flop">Flop</option>
                    <option value="Turn">Turn</option>
                    <option value="River">River</option>
                  </select>
                  <input 
                    type="number" min="0" max="5" value={flopCardsCount} 
                    onChange={(e) => setFlopCardsCount(parseInt(e.target.value))}
                    className="w-12 bg-slate-800 border border-purple-500/50 rounded text-center"
                    placeholder="Cards"
                  />
              </div>
            </div>

            <div className="border-t border-purple-500/20 pt-2 flex flex-col gap-2">
                <label className="text-purple-400 font-bold">SALDOS INDIVIDUALES</label>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px]">TÚ:</span>
                        <input 
                            type="number" value={myBalance} 
                            onChange={(e) => setMyBalance(parseInt(e.target.value) || 0)}
                            className="bg-slate-800 border border-purple-500/50 rounded px-2 py-0.5 w-20 text-right"
                        />
                    </div>
                    {rivals.map(r => (
                        <div key={r.id} className="flex items-center justify-between">
                            <span className="text-[10px]">{r.name.toUpperCase()}:</span>
                            <input 
                                type="number" value={r.balance} 
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setRivals(prev => prev.map(riv => riv.id === r.id ? { ...riv, balance: val } : riv));
                                }}
                                className="bg-slate-800 border border-purple-500/50 rounded px-2 py-0.5 w-20 text-right"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-purple-500/20 pt-2">
                <label className="block text-purple-400 mb-1 font-bold">ACCIONES RIVALES</label>
                {rivals.map(r => (
                    <div key={r.id} className="flex items-center justify-between mb-1 bg-white/5 p-1 rounded">
                        <span className="text-[9px] truncate w-16">{r.name}:</span>
                        <div className="flex gap-1">
                            <button onClick={() => updateRivalAction(r.id, "fold")} className="bg-red-500/20 hover:bg-red-500/40 px-1.5 rounded">FOLD</button>
                            <button onClick={() => updateRivalAction(r.id, "call")} className="bg-green-500/20 hover:bg-green-500/40 px-1.5 rounded">CALL</button>
                            <button onClick={() => updateRivalAction(r.id, "raise")} className="bg-purple-500/20 hover:bg-purple-500/40 px-1.5 rounded">RAISE</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-purple-500/20 pt-2">
                <label className="block text-amber-500 mb-1 font-bold italic">FORZAR GANADOR</label>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => revealWinner(0)} className="bg-amber-600/20 hover:bg-amber-600/40 py-1 rounded">TÚ GANAS</button>
                    <button onClick={() => revealWinner(Math.floor(Math.random() * 3) + 1)} className="bg-amber-600/20 hover:bg-amber-600/40 py-1 rounded">RIVAL GANA</button>
                </div>
            </div>

            <button 
                onClick={() => setIsDebugShowCards(!isDebugShowCards)}
                className={`w-full py-1.5 rounded font-bold transition-all border ${isDebugShowCards ? 'bg-amber-500 text-black border-amber-300' : 'bg-slate-700 text-white border-white/10'}`}
            >
                {isDebugShowCards ? 'ESCONDER CARTAS' : 'MOSTRAR CARTAS'}
            </button>

            <button onClick={() => initGame(myRole)} className="w-full bg-red-600/80 hover:bg-red-500 py-1.5 rounded mt-1 font-bold uppercase tracking-widest text-[9px]">REINICIAR MESA</button>
          </div>
        </div>
      )}

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
          {communityCards.map((card, i) => {
            const isVisible = i < visibleCommunityCount;
            return (
              <div key={i} className="relative w-24 h-36 perspective-1000 group">
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isVisible ? "rotate-y-180" : ""}`}>
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
                    src={`/minijuegos/carta_alta/cards/card_${card.suit}_${card.rank}.png`} 
                    alt="Card front" 
                    className="w-full h-full object-contain pixelated" 
                    width={96} 
                    height={144} />
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            );
          })}
          {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
             <div key={`empty-${i}`} className="w-24 h-36 border-2 border-white/5 rounded-lg bg-black/10 backdrop-blur-[2px]" />
          ))}
        </div>
      </div>

      {/* --- RIVALS --- */}
      {rivals.map((rival) => {
        const isTurn = currentTurnId === rival.id;
        const isRevealed = isDebugShowCards && !rival.folded;
        
        // Dynamic translate values for the "Showdown" effect
        let showdownTransform = "";
        if (isRevealed) {
          switch (rival.position) {
            case "left": showdownTransform = "translate(180px, 0) scale(1.6)"; break;
            case "top": showdownTransform = "translate(0, 150px) scale(1.6)"; break;
            case "right": showdownTransform = "translate(-180px, 0) scale(1.6)"; break;
          }
        }

        return (
            <div 
            key={rival.id}
            className={`absolute z-20 flex flex-col items-center group transition-all duration-700 ${getRivalContainerStyle(rival.position)} ${rival.folded ? "opacity-30 grayscale scale-90" : "opacity-100"}`}
            >
            <div 
                className={`flex flex-row -space-x-8 mb-4 transition-all duration-700 ease-out ${isTurn && !isRevealed ? 'scale-110 -translate-y-2' : ''}`}
                style={{ transform: showdownTransform, zIndex: isRevealed ? 50 : 1 }}
            >
                {rival.cards.map((card, i) => (
                    <div key={i} className={`relative w-14 h-20 rotate-[${i === 0 ? '-12deg' : '12deg'}] shadow-lg group perspective-1000`}>
                        <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
                            <div className="absolute inset-0 backface-hidden">
                                <Image 
                                src="/minijuegos/carta_alta/reverso_carta.png" 
                                alt="Card back" 
                                className="w-full h-full object-contain pixelated"
                                width={96} 
                                height={144} />
                            </div>
                            <div className="absolute inset-0 backface-hidden rotate-y-180">
                                <Image 
                                src={`/minijuegos/carta_alta/cards/card_${card.suit}_${card.rank}.png`} 
                                alt="Card front" 
                                className="w-full h-full object-contain pixelated" 
                                width={96} 
                                height={144} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="relative">
                {/* Turn Aura */}
                {isTurn && (
                    <div className="absolute -inset-4 bg-blue-500/40 blur-2xl rounded-full animate-pulse-slow" />
                )}
                <div className={`w-20 h-20 border-2 rounded-full overflow-hidden bg-slate-900 shadow-2xl relative transition-colors ${isTurn ? 'border-blue-400 ring-4 ring-blue-500/30' : 'border-white/20'}`}>
                   <Image src={`/personajes_profile/${rival.role}_profile.png`} 
                   alt={rival.name} fill 
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
                {isTurn && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <div className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-sm whitespace-nowrap shadow-lg">SU TURNO</div>
                    </div>
                )}
            </div>
            
            <div className="mt-3 flex flex-col items-center">
                <span className={`text-[12px] uppercase tracking-[0.2em] drop-shadow-lg ${isTurn ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>{rival.name}</span>
                {rival.currentBet > 0 && !rival.folded && (
                    <div className="mt-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-blue-200 text-[11px] font-bold tabular-nums">{rival.currentBet}¢</span>
                    </div>
                )}
            </div>
            </div>
        );
      })}

      {/* --- BOTTOM: LOCAL PLAYER --- */}
      <div className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pb-8 pt-16 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity ${winnerId !== null ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Progress bar logic if time limit existed... */}

        <div className="flex flex-row items-end gap-12 w-full max-w-7xl justify-between px-20">
            
            {/* Player Identity */}
            <div className="flex items-center gap-10">
                <div className="flex flex-row -space-x-14">
                   {myCards.map((card, i) => (
                       <div key={i} className={`w-32 h-44 rotate-[${i === 0 ? '-12deg' : '12deg'}] shadow-2xl transition-transform hover:-translate-y-6 hover:scale-105 group relative`}>
                           <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover:opacity-100 rounded-lg blur-md transition-opacity" />
                           <Image 
                           src={`/minijuegos/carta_alta/cards/card_${card.suit}_${card.rank}.png`} 
                           alt="Your card" 
                           className="w-full h-full object-contain pixelated relative z-10"
                           height={176}
                           width={128}
                            />
                       </div>
                   ))}
                </div>

                <div className="flex flex-col items-start gap-3 relative">
                    {currentTurnId === 0 && (
                        <div className="absolute -top-12 left-0 bg-amber-500 text-slate-950 text-[10px] px-3 py-1 rounded-sm font-bold animate-pulse shadow-lg">ES TU TURNO</div>
                    )}
                    <div className="flex items-center gap-5">
                        <div className={`relative w-24 h-24 border-4 rounded-full overflow-hidden bg-slate-900 shadow-2xl transition-all ${currentTurnId === 0 ? 'border-amber-400 scale-105 shadow-amber-500/20' : 'border-white/10 opacity-70'}`}>
                             <Image src={`/personajes_profile/${myRole}_profile.png`} 
                             alt="Tú" fill 
                             className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-amber-500 text-[10px] uppercase font-pixel tracking-widest opacity-80">TU</span>
                            <span className="text-white text-4xl tracking-tighter tabular-nums font-pixel">{myBalance}¢</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Betting Interface */}
            <div className="flex flex-col items-center gap-6">
                {myCurrentBet > 0 && (
                    <div className="bg-blue-600 border-2 border-blue-400 px-5 py-2 rounded-sm shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <span className="text-[10px] text-blue-100 font-pixel opacity-70">APUESTA EN CURSO</span>
                        <span className="text-white text-2xl font-bold tabular-nums">{myCurrentBet}¢</span>
                    </div>
                )}

                <div className="flex flex-row gap-5 items-center">
                    <PixelButton 
                        variant="red" 
                        className="w-44 py-6 text-sm"
                        onClick={() => handleActionClick("fold")}
                    >
                    RETIRARSE
                    </PixelButton>

                    <PixelButton 
                        variant={highestBet > myCurrentBet ? "purple" : "green"} 
                        className="w-56 py-6 text-sm"
                        onClick={() => handleActionClick("call")}
                    >
                    {highestBet > myCurrentBet ? `IGUALAR ${highestBet - myCurrentBet}¢` : "PASAR"}
                    </PixelButton>

                    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 border border-purple-500/30 rounded-lg backdrop-blur-md w-64 shadow-2xl group">
                        <div className="flex justify-between items-center opacity-80">
                            <span className="text-purple-400 text-[9px] font-pixel tracking-widest">SUBIR APUESTA</span>
                            <span className="text-white text-sm font-bold font-mono">+{raiseAmountSlider}¢</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max={Math.max(1, myBalance - (highestBet - myCurrentBet))} 
                            step="1"
                            value={raiseAmountSlider}
                            onChange={(e) => setRaiseAmountSlider(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <PixelButton 
                            variant="purple" 
                            className="w-full py-5 text-sm"
                            disabled={myBalance < (highestBet - myCurrentBet) + 1}
                            onClick={() => handleActionClick("raise")}
                        >
                            SUBIR
                        </PixelButton>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- WINNER OVERLAY --- */}
      {winnerId !== null && currentWinner && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
              <div className="flex flex-col items-center max-w-md w-full animate-in zoom-in-95 duration-700">
                  <div className="mb-8 relative">
                    <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 animate-pulse" />
                    <div className="w-48 h-48 border-8 border-amber-500 rounded-full overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.4)] relative">
                        <Image src={`/personajes_profile/${currentWinner.role}_profile.png`} alt="Winner" fill className="object-cover scale-110" />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 px-6 py-2 rounded shadow-2xl">
                        <span className="text-slate-950 font-pixel text-xl tracking-widest">GANADOR</span>
                    </div>
                  </div>

                  <h2 className="text-white text-4xl mb-2 font-pixel tracking-tighter text-center uppercase drop-shadow-lg">{currentWinner.name}</h2>
                  <p className="text-amber-500 text-lg mb-10 font-mono tracking-widest opacity-80 text-center">SE LLEVA EL BOTE</p>

                  <div className="bg-white/5 border border-amber-500/20 px-12 py-6 rounded-xl flex flex-col items-center transition-transform hover:scale-105">
                      <span className="text-white/40 text-[10px] mb-2 font-pixel">TOTAL PREMIO</span>
                      <span className="text-white text-6xl font-pixel tracking-tighter text-amber-500">{pot}¢</span>
                  </div>

                  <PixelButton 
                    variant="green" 
                    className="mt-12 w-64 text-sm"
                    onClick={() => initGame(myRole)}
                  >
                     NUEVA PARTIDA
                  </PixelButton>
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

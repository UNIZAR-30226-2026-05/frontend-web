"use client";

import React, { useState } from "react";
import OrderMinigameOverlay, { OrderMinigameType } from "@/features/minigames/components/OrderMinigameOverlay";
import DobleNadaOverlay from "@/features/board/components/DobleNadaOverlay";
import RuletaUI from "@/features/board/components/RuletaUI";
import BanqueroRoboModal from "@/features/board/components/BanqueroRoboModal";
import PixelButton from "@/components/UI/PixelButton";
import VidenteDadosModal from "@/features/board/components/VidenteDadosModal";
import GameOverOverlay from "@/features/board/components/GameOverOverlay";
import MinigameResultOverlay from "@/features/board/components/MinigameResultOverlay";
import PokerUI from "@/features/minigames/components/PokerUI";
import VideojugadorEleccionModal from "@/features/board/components/VideojugadorEleccionModal";

// Mocking the GameContext for DobleNadaOverlay in debug mode
// Since DobleNadaOverlay uses useGameContext(), we provide a simple mock if needed,
// but for now, we'll see if we can just render the UI or if we need to wrap it.
// Actually, DobleNadaOverlay imports useGameContext. To avoid errors, 
// we would normally need a Provider. Let's create a minimal one for debug.

// Import the real context to provide it with mock data
import type { Action, GameContextType, GamePlayer } from "@/features/board/context/GameContext";
import { GameContext } from "@/features/board/context/GameContext";

type DebugMinigameId =
  | OrderMinigameType
  | "doblenada"
  | "ruleta"
  | "banquero"
  | "videojugador_elector"
  | "videojugador_espectador"
  | "vidente"
  | "gameover"
  | "resultado_minijuego"
  | "poker";

const isOrderMinigameType = (value: DebugMinigameId | null): value is OrderMinigameType => (
  value === "tren" ||
  value === "pan" ||
  value === "crono" ||
  value === "cartas" ||
  value === "dilema" ||
  value === "reflejos"
);

export default function DebugMinigamesPage() {
  const [activeMinigame, setActiveMinigame] = useState<DebugMinigameId | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [mockBalance, setMockBalance] = useState(10);
  const noopDispatch: React.Dispatch<Action> = () => undefined;

  const addLog = (msg: string) => {
    setDebugLog(prev => [msg, ...prev].slice(0, 10));
  };

  const handleAction = (result: unknown) => {
    addLog(`Action Result: ${JSON.stringify(result)}`);
    setTimeout(() => setActiveMinigame(null), 1500);
  };

  const mockPlayer: GamePlayer = {
    username: "debug_user",
    character: "videojugador",
    characterWsName: "Videojugador",
    position: 0,
    balance: mockBalance,
    turnOrder: 1,
    diceType: "normal",
  };

  const mockContextValue: GameContextType = {
    state: {
      myUsername: "debug_user",
      players: { debug_user: mockPlayer },
      currentTurnOrder: 1,
      hasMoved: false,
      awaitingEndRound: false,
      lastDice: null,
      showOrderMinigame: false,
      showVideojugadorEleccion: false,
      videojugadorOpciones: [],
      currentOrderMinijuego: null,
      currentOrderMinijuegoDetails: null,
      showDobleNada: true,
      landedOnNegativeMove: false,
      landedOnBarrera: false,
      purchasedItems: {},
      penaltyTurns: 0,
      isAnyoneAnimating: false,
      lastSwapEvent: null,
      pendingBoardMinigame: { type: "Doble o Nada", user: "debug_user" },
      isSubmittingDobleNada: false,
      submittedDobleNadaBet: null,
      dobleNadaResult: null,
    },
    isMyTurn: true,
    myPlayer: mockPlayer,
    playerOrder: [mockPlayer],
    sendMovePlayer: () => undefined,
    sendEndRound: () => undefined,
    sendScoreReflejos: (score: number) => handleAction({ score }),
    sendScoreOrden: (score: number) => handleAction({ score }),
    sendScoreDobleNada: (score: number) => {
      handleAction({ score });
      setActiveMinigame(null);
    },
    sendIniRound: (minijuego: string, descripcion: string) => handleAction({ minijuego, descripcion }),
    markItemPurchased: () => undefined,
    notifyAnimationEnded: () => undefined,
    isAnyoneAnimating: false,
    dispatch: noopDispatch,
  };

  const minigames: { id: DebugMinigameId; label: string }[] = [
    { id: "tren", label: "Tren (Pasajeros)" },
    { id: "pan", label: "Cortar Pan" },
    { id: "crono", label: "Cronómetro Ciego" },
    { id: "cartas", label: "Mayor Menor (Cartas)" },
    { id: "dilema", label: "Dilema del Prisionero" },
    { id: "reflejos", label: "Reflejos (Original)" },
    { id: "doblenada", label: "Doble o Nada (Modal)" },
    { id: "ruleta", label: "Ruleta (Interactivo)" },
    { id: "banquero", label: "Habilidad Banquero" },
    { id: "videojugador_elector", label: "Videojugador (Elector)" },
    { id: "videojugador_espectador", label: "Videojugador (Espectador)" },
    { id: "vidente", label: "Test: Habilidad Vidente" },
    { id: "gameover", label: "Test: Fin de Partida" },
    { id: "resultado_minijuego", label: "Test: Resultado Minijuego" },
    { id: "poker", label: "Póker (Texas Hold'em)" },
  ];

  return (
    <GameContext.Provider value={mockContextValue}>
      <div className="min-h-screen bg-slate-950 text-white p-8 font-pixel overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 border-b-2 border-slate-800 pb-6 text-center">
            <h1 className="text-4xl text-amber-500 uppercase tracking-tighter mb-2">Minigames Debug Menu</h1>
            <p className="text-slate-400 text-xs text-balance mb-4">Snow Party UI Refactoring Suite • Balance para DobleNada: {mockBalance}¢</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-xs">0¢</span>
              <input
                type="range" min="0" max="50" value={mockBalance}
                onChange={(e) => setMockBalance(parseInt(e.target.value))}
                className="w-64 accent-amber-500"
              />
              <span className="text-xs">50¢</span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {minigames.map((mg) => (
              <PixelButton
                key={mg.id}
                variant={mg.id === "doblenada" ? "purple" : mg.id === "ruleta" ? "purple" : "green"}
                onClick={() => setActiveMinigame(mg.id)}
                className="w-full text-xs py-4"
              >
                {mg.label}
              </PixelButton>
            ))}
          </div>

          <div className="bg-black/50 border border-white/10 p-4 rounded h-64 overflow-y-auto font-mono text-xs shadow-inner">
            <h3 className="text-amber-500 mb-2 uppercase border-b border-white/10 pb-1">Action Logs:</h3>
            {debugLog.length === 0 && <p className="text-slate-600 italic">No actions recorded...</p>}
            {debugLog.map((log, i) => (
              <div key={i} className="mb-1 border-b border-white/5 pb-1 animate-in fade-in slide-in-from-left-2">
                <span className="text-blue-400">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
          </div>

          {activeMinigame === "poker" && (
            <PokerUI onAction={handleAction} />
          )}

          {activeMinigame !== null && isOrderMinigameType(activeMinigame) && (
            <OrderMinigameOverlay
              minigameType={activeMinigame}
              onAction={handleAction}
              onClose={() => setActiveMinigame(null)}
            />
          )}

          {activeMinigame === "doblenada" && (
            <DobleNadaOverlay />
          )}

          {activeMinigame === "ruleta" && (
            <RuletaUI
              onAction={handleAction}
              onClose={() => setActiveMinigame(null)}
            />
          )}

          {activeMinigame === "banquero" && (
            <BanqueroRoboModal
              targetPlayers={[
                { username: "David", character: "Escapista" },
                { username: "Maria", character: "Vidente" },
                { username: "Alex", character: "Videojugador" },
              ]}
              onSelect={(username) => {
                handleAction({ type: 'robbery', target: username });
              }}
            />
          )}

          {(activeMinigame === "videojugador_elector" || activeMinigame === "videojugador_espectador") && (
            <VideojugadorEleccionModal
              isVideojugador={activeMinigame === "videojugador_elector"}
              opciones={[
                { id: "tren", name: "Tren", description: "Atrapa a todos los pasajeros que puedas." },
                { id: "pan", name: "Corta Pan", description: "Demuestra tu precisión con el cuchillo." },
              ]}
              onSelect={(id) => {
                handleAction({ type: 'minigame_selection', selection: id });
              }}
            />
          )}

          {activeMinigame === "vidente" && (
            <VidenteDadosModal
              tiradas={[
                { dado1: 4, dado2: 2, diceType: "oro" },
                { dado1: 1, dado2: 4, diceType: "plata" },
                { dado1: 6, dado2: 1, diceType: "bronce" },
                { dado1: 3, dado2: 5, diceType: "normal" },
              ]}
              onClose={() => setActiveMinigame(null)}
            />
          )}

          {activeMinigame === "gameover" && (
            <GameOverOverlay
              players={[
                { username: "David", character: "vidente", balance: 35 },
                { username: "Maria", character: "banquero", balance: 20 },
                { username: "Alex", character: "videojugador", balance: 10 },
                { username: "Sofi", character: "escapista", balance: 0 },
              ]}
              onReturnToMenu={() => setActiveMinigame(null)}
            />
          )}

          {activeMinigame === "resultado_minijuego" && (
            <MinigameResultOverlay
              minigameName="REFLEJOS"
              subtitle="¿Ser rápido es tu virtud?"
              results={[
                { username: "lorien2", score: 515, character: "vidente" },
                { username: "Jugador 2", score: 2744, character: "banquero" },
                { username: "Jugador 4", score: 3730, character: "escapista" },
                { username: "Jugador 3", score: 4340, character: "videojugador" },
              ]}
              onClose={() => setActiveMinigame(null)}
            />
          )}
        </div>
      </div>
    </GameContext.Provider>
  );
}

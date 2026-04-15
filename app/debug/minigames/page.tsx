"use client";

import React, { useState } from "react";
import OrderMinigameOverlay, { OrderMinigameType } from "@/features/minigames/components/OrderMinigameOverlay";
import DobleNadaOverlay from "@/features/board/components/DobleNadaOverlay";
import RuletaUI from "@/features/board/components/RuletaUI";
import PixelButton from "@/components/UI/PixelButton";

// Mocking the GameContext for DobleNadaOverlay in debug mode
// Since DobleNadaOverlay uses useGameContext(), we provide a simple mock if needed,
// but for now, we'll see if we can just render the UI or if we need to wrap it.
// Actually, DobleNadaOverlay imports useGameContext. To avoid errors, 
// we would normally need a Provider. Let's create a minimal one for debug.

// Import the real context to provide it with mock data
import { GameContext } from "@/features/board/context/GameContext";

export default function DebugMinigamesPage() {
  const [activeMinigame, setActiveMinigame] = useState<OrderMinigameType | "doblenada" | "ruleta" | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [mockBalance, setMockBalance] = useState(10);

  const addLog = (msg: string) => {
    setDebugLog(prev => [msg, ...prev].slice(0, 10));
  };

  const handleAction = (result: any) => {
    addLog(`Action Result: ${JSON.stringify(result)}`);
    setTimeout(() => setActiveMinigame(null), 1500);
  };

  // Mock value for the provider
  const mockContextValue: any = {
    state: {
      myUsername: "debug_user",
      players: {
        debug_user: {
          username: "debug_user",
          balance: mockBalance,
          turnOrder: 1,
        }
      },
      showDobleNada: true,
    },
    myPlayer: {
      username: "debug_user",
      balance: mockBalance,
      turnOrder: 1,
    },
    closeDobleNada: () => setActiveMinigame(null),
    sendScoreReflejos: (score: number) => handleAction({ score }),
  };

  const minigames: { id: OrderMinigameType | "doblenada" | "ruleta"; label: string }[] = [
    { id: "tren", label: "Tren (Pasajeros)" },
    { id: "pan", label: "Cortar Pan" },
    { id: "crono", label: "Cronómetro Ciego" },
    { id: "cartas", label: "Mayor Menor (Cartas)" },
    { id: "dilema", label: "Dilema del Prisionero" },
    { id: "reflejos", label: "Reflejos (Original)" },
    { id: "doblenada", label: "Doble o Nada (Modal)" },
    { id: "ruleta", label: "Ruleta (Interactivo)" },
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

          {activeMinigame && activeMinigame !== "doblenada" && (
            <OrderMinigameOverlay
              minigameType={activeMinigame as OrderMinigameType}
              onAction={handleAction}
              onClose={() => setActiveMinigame(null)}
            />
          )}

          {activeMinigame === "doblenada" && (
            <DobleNadaOverlay onClose={() => setActiveMinigame(null)} />
          )}

          {activeMinigame === "ruleta" && (
            <RuletaUI 
              onAction={handleAction} 
              onClose={() => setActiveMinigame(null)} 
            />
          )}
        </div>
      </div>
    </GameContext.Provider>
  );
}

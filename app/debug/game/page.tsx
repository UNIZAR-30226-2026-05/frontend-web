"use client";

import React, { useEffect, useState } from 'react';
import { GameProvider, useGameContext } from '@/features/board/context/GameContext';
import BoardOverlay from '@/features/board/components/BoardOverlay';
import { BOARD_COORDS } from '@/features/board/constants/board';
import PixelButton from '@/components/UI/PixelButton';

function GameDebugger() {
  const { state, dispatch, playerOrder } = useGameContext();
  const [showIndices, setShowIndices] = useState(true);

  // Initialize 4 test players if empty
  const initBots = () => {
    dispatch({ 
      type: 'INIT', 
      myUsername: 'videojugador', 
      lobbyPlayers: ['Banquero', 'Escapista', 'Videojugador', 'Vidente'] 
    });
    
    // Select characters
    dispatch({ type: 'PLAYER_SELECTED', user: 'Banquero', character: 'Banquero' });
    dispatch({ type: 'PLAYER_SELECTED', user: 'Escapista', character: 'Escapista' });
    dispatch({ type: 'PLAYER_SELECTED', user: 'Videojugador', character: 'Videojugador' });
    dispatch({ type: 'PLAYER_SELECTED', user: 'Vidente', character: 'Vidente' });
  };

  const movePlayer = (username: string, delta: number) => {
    const player = state.players[username];
    if (!player) return;
    const nextPos = Math.max(0, Math.min(BOARD_COORDS.length - 1, player.position + delta));
    dispatch({ type: 'PLAYER_MOVED_FORCED', user: username, newPos: nextPos });
  };

  const teleportPlayer = (username: string, pos: number) => {
    dispatch({ type: 'PLAYER_MOVED_FORCED', user: username, newPos: pos });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[url('/tablero_def.png')] bg-contain bg-no-repeat bg-center bg-[#1a1c2c]">
      
      {/* Visualización de Casillas */}
      {showIndices && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {BOARD_COORDS.map((c, idx) => (
            <div
              key={idx}
              className="absolute flex items-center justify-center"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: '20px',
                height: '20px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="bg-black/80 border border-amber-500/50 text-amber-400 text-[8px] font-pixel w-full h-full flex items-center justify-center rounded-sm shadow-sm">
                {idx}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Capa de Personajes */}
      <BoardOverlay />

      {/* Panel de Control de Debug */}
      <div className="absolute top-4 right-4 z-[100] w-72 bg-slate-900/95 border-2 border-amber-500 p-6 font-pixel shadow-2xl rounded-lg">
        <h2 className="text-amber-500 text-lg mb-4 uppercase tracking-widest border-b border-amber-500/30 pb-2">Game Debugger</h2>
        
        <div className="flex flex-col gap-4">
          <PixelButton variant="purple" onClick={() => setShowIndices(!showIndices)} className="text-[10px] py-2">
            {showIndices ? 'Ocultar Índices' : 'Mostrar Índices'}
          </PixelButton>

          {playerOrder.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-white/60 text-[10px] uppercase">No hay jugadores activos</p>
              <PixelButton variant="green" onClick={initBots} className="text-[10px] py-2">Inicializar 4 Personajes</PixelButton>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-amber-500/70 text-[10px] uppercase border-b border-amber-500/20 pb-1">Personajes</p>
              {playerOrder.map(p => (
                <div key={p.username} className="bg-black/30 p-2 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white text-[10px] uppercase truncate max-w-[100px]">{p.username}</span>
                    <span className="text-amber-400 text-[10px]">Pos: {p.position}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => movePlayer(p.username, -1)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] p-1 border border-white/10 rounded transition-colors"
                    >
                      -1
                    </button>
                    <button 
                      onClick={() => movePlayer(p.username, 1)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] p-1 border border-white/10 rounded transition-colors"
                    >
                      +1
                    </button>
                    <input 
                      type="number"
                      className="w-12 bg-black border border-white/20 text-white text-[10px] px-1 rounded"
                      value={p.position}
                      onChange={(e) => teleportPlayer(p.username, parseInt(e.target.value) || 0)}
                      min={0}
                      max={71}
                    />
                  </div>
                </div>
              ))}
              <PixelButton 
                variant="red" 
                onClick={() => dispatch({ type: 'INIT', myUsername: null, lobbyPlayers: [] })}
                className="text-[10px] mt-2 py-1"
              >
                Reset Board
              </PixelButton>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-amber-500/30">
          <p className="text-white/30 text-[8px] uppercase leading-tight">
            Este debugger permite visualizar la calibración de las casillas y testear el movimiento de los personajes independientemente del backend.
          </p>
        </div>
      </div>

    </main>
  );
}

export default function DebugGamePage() {
  return (
    <GameProvider>
      <GameDebugger />
    </GameProvider>
  );
}

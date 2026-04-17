"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGameContext } from '@/features/board/context/GameContext';

/**
 * BoardOverlay Component
 * Renders player tokens on the board using calibrated coordinates.
 * - Animación casilla a casilla con retardo inicial tras ver el dado.
 * - Si se cae en una casilla de movimiento, primero se llega a ella y luego
 *   se aplica el desplazamiento adicional.
 */

// Coordenadas calibradas manualmente (0-71)
const BOARD_COORDS = [
  { "x": 15.03, "y": 87.72 }, { "x": 23.02, "y": 87.95 }, { "x": 28.16, "y": 87.72 },
  { "x": 33.3, "y": 88.11 }, { "x": 38.4, "y": 88.11 }, { "x": 43.5, "y": 88.19 },
  { "x": 48.69, "y": 88.03 }, { "x": 53.97, "y": 88.03 }, { "x": 58.98, "y": 88.03 },
  { "x": 64.17, "y": 88.03 }, { "x": 69.36, "y": 88.19 }, { "x": 74.63, "y": 87.56 },
  { "x": 80.13, "y": 83.62 }, { "x": 84.48, "y": 78.74 }, { "x": 87.98, "y": 72.05 },
  { "x": 91.18, "y": 64.09 }, { "x": 92.42, "y": 54.17 }, { "x": 92.68, "y": 45.2 },
  { "x": 92.28, "y": 35.28 }, { "x": 89.49, "y": 26.06 }, { "x": 85.54, "y": 18.98 },
  { "x": 80.4, "y": 14.09 }, { "x": 74.77, "y": 12.76 }, { "x": 69.31, "y": 12.6 },
  { "x": 64.3, "y": 12.68 }, { "x": 58.98, "y": 12.52 }, { "x": 53.92, "y": 12.76 },
  { "x": 48.96, "y": 12.83 }, { "x": 43.68, "y": 12.52 }, { "x": 38.71, "y": 12.76 },
  { "x": 33.26, "y": 12.44 }, { "x": 28.03, "y": 12.52 }, { "x": 22.66, "y": 12.76 },
  { "x": 17.56, "y": 15.51 }, { "x": 13.13, "y": 22.36 }, { "x": 10.33, "y": 30.24 },
  { "x": 9.27, "y": 40.87 }, { "x": 10.16, "y": 50.47 }, { "x": 12.37, "y": 59.21 },
  { "x": 17.52, "y": 65.2 }, { "x": 23.1, "y": 66.46 }, { "x": 28.07, "y": 66.54 },
  { "x": 33.44, "y": 66.77 }, { "x": 38.71, "y": 66.61 }, { "x": 43.68, "y": 66.38 },
  { "x": 48.51, "y": 66.69 }, { "x": 53.88, "y": 66.77 }, { "x": 58.94, "y": 66.85 },
  { "x": 64.39, "y": 66.93 }, { "x": 69.53, "y": 66.54 }, { "x": 75.34, "y": 64.41 },
  { "x": 79.2, "y": 56.22 }, { "x": 79.2, "y": 45.43 }, { "x": 74.81, "y": 36.38 },
  { "x": 69.45, "y": 34.49 }, { "x": 64.26, "y": 34.02 }, { "x": 59.07, "y": 34.33 },
  { "x": 53.92, "y": 34.09 }, { "x": 48.65, "y": 34.09 }, { "x": 43.64, "y": 34.41 },
  { "x": 38.31, "y": 34.17 }, { "x": 33.26, "y": 34.25 }, { "x": 27.41, "y": 35.51 },
  { "x": 23.24, "y": 45.12 }, { "x": 27.72, "y": 54.49 }, { "x": 33.17, "y": 55.28 },
  { "x": 38.18, "y": 54.88 }, { "x": 43.46, "y": 55.2 }, { "x": 48.91, "y": 55.43 },
  { "x": 53.92, "y": 55.28 }, { "x": 59.02, "y": 55.51 }, { "x": 68.29, "y": 51.34 }
];

const ROLE_ASSETS: Record<string, string> = {
  banquero: '/personajes_tablero/banquero_t_der.png',
  escapista: '/personajes_tablero/escapista_t_der.png',
  videojugador: '/personajes_tablero/videojugador_t_der.png',
  vidente: '/personajes_tablero/vidente_t_der.png',
};

// Fallback para cuando aún no se ha elegido personaje
const FALLBACK_ASSETS = [
  '/personajes_tablero/banquero_t_der.png',
  '/personajes_tablero/escapista_t_der.png',
  '/personajes_tablero/videojugador_t_der.png',
  '/personajes_tablero/vidente_t_der.png',
];

/** ms a esperar desde que llega player_moved hasta que empieza el movimiento (da tiempo a ver el dado) */
const DICE_SHOW_DELAY_MS = 1200;
/** ms entre cada avance de una casilla */
const STEP_INTERVAL_MS = 280;
/** pausa antes de empezar el movimiento forzado (casilla de movimiento) */
const FORCED_MOVE_PAUSE_MS = 400;

export default function BoardOverlay() {
  const { playerOrder, myPlayer, notifyAnimationEnded } = useGameContext();

  // Posición que se renderiza actualmente (animada, puede ir por detrás de la real)
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>({});

  // Refs de control: no necesitan provocar re-renders adicionales
  const displayPosRef = useRef<Record<string, number>>({});
  const queues = useRef<Record<string, number[]>>({});
  // busy = true mientras haya una animación en curso o haya un delay inicial pendiente
  const busy = useRef<Record<string, boolean>>({});
  const prevRealPos = useRef<Record<string, number>>({});

  // Función de animación en ref para ser llamada recursivamente sin problemas de cierre
  const startAnimRef = useRef<(username: string, from: number, to: number) => void>(null!);
  useLayoutEffect(() => {
  startAnimRef.current = (username: string, from: number, to: number) => {
    const onComplete = (finalPos: number) => {
      if ((queues.current[username]?.length ?? 0) > 0) {
        // Hay un movimiento forzado encolado: pequeña pausa y luego continuar
        const nextTarget = queues.current[username].shift()!;
        setTimeout(() => {
          startAnimRef.current!(username, finalPos, nextTarget);
        }, FORCED_MOVE_PAUSE_MS);
      } else {
        busy.current[username] = false;
        // Si acaba de terminar la cadena de animaciones del jugador local,
        // notificar al contexto para que termine el turno automáticamente.
        notifyAnimationEnded(username === myPlayer?.username);
      }
    };

    if (from === to) {
      onComplete(from);
      return;
    }

    const step = (current: number) => {
      if (current === to) {
        onComplete(current);
        return;
      }
      const next = current < to ? current + 1 : current - 1;
      displayPosRef.current[username] = next;
      setDisplayPositions(prev => ({ ...prev, [username]: next }));
      setTimeout(() => step(next), STEP_INTERVAL_MS);
    };

    step(from);
  };
  });

  useEffect(() => {
    playerOrder.forEach(player => {
      const { username, position } = player;

      // Inicializar jugador nuevo (posición inicial directa, sin animación)
      if (!(username in prevRealPos.current)) {
        prevRealPos.current[username] = position;
        displayPosRef.current[username] = position;
        queues.current[username] = [];
        busy.current[username] = false;
        setDisplayPositions(prev => ({ ...prev, [username]: position }));
        return;
      }

      // Detectar cambio de posición real
      if (position !== prevRealPos.current[username]) {
        prevRealPos.current[username] = position;

        if (!busy.current[username]) {
          // Primera animación del movimiento: esperar a que se vea el dado
          busy.current[username] = true;
          setTimeout(() => {
            startAnimRef.current!(username, displayPosRef.current[username] ?? 0, position);
          }, DICE_SHOW_DELAY_MS);
        } else {
          // Ya hay animación en curso o delay pendiente: encolar el destino
          queues.current[username].push(position);
        }
      }
    });
  }, [playerOrder]);

  // Agrupamiento por casilla usando posiciones ANIMADAS
  const playersByTile: Record<number, string[]> = {};
  playerOrder.forEach(player => {
    const pos = displayPositions[player.username] ?? 0;
    if (!playersByTile[pos]) playersByTile[pos] = [];
    playersByTile[pos].push(player.username);
  });

  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none overflow-hidden">

      {playerOrder.map((player, playerIdx) => {
        const displayPos = displayPositions[player.username] ?? 0;
        const tileIdx = Math.min(displayPos, BOARD_COORDS.length - 1);
        const c = BOARD_COORDS[tileIdx];
        const sharedTile = playersByTile[displayPos] ?? [player.username];
        const count = sharedTile.length;
        const indexInTile = sharedTile.indexOf(player.username);

        let size = 95;
        if (count === 2) size = 78;
        if (count === 3) size = 70;
        if (count === 4) size = 60;

        let dx = 0;
        let dy = 0;
        const offsetVal = size * 0.35;

        if (count > 1) {
          if (count === 2) {
            dx = indexInTile === 0 ? -offsetVal : offsetVal;
          } else if (count === 3) {
            if (indexInTile === 0) dy = -offsetVal;
            else if (indexInTile === 1) { dx = -offsetVal; dy = offsetVal; }
            else { dx = offsetVal; dy = offsetVal; }
          } else if (count === 4) {
            dx = indexInTile < 2 ? -offsetVal : offsetVal;
            dy = indexInTile % 2 === 0 ? -offsetVal : offsetVal;
          }
        }

        const assetSrc = player.character
          ? (ROLE_ASSETS[player.character] ?? FALLBACK_ASSETS[playerIdx % 4])
          : FALLBACK_ASSETS[playerIdx % 4];

        return (
          <div
            key={player.username}
            className="absolute transition-all duration-200"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`,
              zIndex: 30 + playerIdx,
            }}
          >
            <div className="relative w-full h-full group">
              <Image
                src={assetSrc}
                alt={player.characterWsName ?? player.username}
                fill
                className="object-contain pixelated transition-transform group-hover:scale-110 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
              />
            </div>
            {/* Sombra de contacto individual */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-black/30 rounded-full blur-sm -z-10" />
          </div>
        );
      })}

      <style jsx global>{`
        .pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  );
}

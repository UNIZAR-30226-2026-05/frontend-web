"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useGameContext } from '@/features/board/context/GameContext';

/**
 * BoardOverlay Component
 * Renders player tokens on the board using calibrated coordinates.
 * - Animación casilla a casilla con retardo inicial tras ver el dado.
 * - Si se cae en una casilla de movimiento, primero se llega a ella y luego
 *   se aplica el desplazamiento adicional.
 */

import { BOARD_COORDS } from '@/features/board/constants/board';

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
const DICE_SHOW_DELAY_MS = 2000;
/** ms entre cada avance de una casilla */
const STEP_INTERVAL_MS = 280;
/** pausa antes de aplicar el movimiento forzado o el intercambio */
const FORCED_MOVE_PAUSE_MS = 400;

type QueuedTransition =
  | { kind: 'path'; to: number }
  | { kind: 'swap'; to: number; partner: string; partnerTo: number };

export default function BoardOverlay() {
  const { state, playerOrder, myPlayer, notifyAnimationEnded } = useGameContext();
  const animatedUser = state.lastDice?.user ?? null;

  // Posición que se renderiza actualmente (animada, puede ir por detrás de la real)
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>({});

  // Refs de control: no necesitan provocar re-renders adicionales
  const displayPosRef = useRef<Record<string, number>>({});
  const queues = useRef<Record<string, QueuedTransition[]>>({});
  // busy = true mientras haya una animación en curso o haya un delay inicial pendiente
  const busy = useRef<Record<string, boolean>>({});
  const prevRealPos = useRef<Record<string, number>>({});
  const processedSwapEventId = useRef<number | null>(null);

  const syncDisplayPositions = useCallback((updates: Record<string, number>) => {
    Object.entries(updates).forEach(([username, position]) => {
      displayPosRef.current[username] = position;
    });

    setDisplayPositions(prev => {
      let changed = false;
      const next = { ...prev };

      Object.entries(updates).forEach(([username, position]) => {
        if (next[username] !== position) {
          next[username] = position;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  // Función de animación en ref para ser llamada recursivamente sin problemas de cierre
  const runQueuedTransitionRef = useRef<(username: string, from: number, transition: QueuedTransition) => void>(null!);
  const startAnimRef = useRef<(username: string, from: number, to: number) => void>(null!);
  useLayoutEffect(() => {
    runQueuedTransitionRef.current = (username: string, from: number, transition: QueuedTransition) => {
      if (transition.kind === 'path') {
        startAnimRef.current!(username, from, transition.to);
        return;
      }

      busy.current[username] = false;
      busy.current[transition.partner] = false;
      queues.current[username] = [];
      queues.current[transition.partner] = [];
      syncDisplayPositions({
        [username]: transition.to,
        [transition.partner]: transition.partnerTo,
      });
      notifyAnimationEnded(username === myPlayer?.username);
    };

    startAnimRef.current = (username: string, from: number, to: number) => {
      const onComplete = (finalPos: number) => {
        if ((queues.current[username]?.length ?? 0) > 0) {
          const nextTransition = queues.current[username].shift()!;
          setTimeout(() => {
            runQueuedTransitionRef.current!(username, finalPos, nextTransition);
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
        syncDisplayPositions({ [username]: next });
        setTimeout(() => step(next), STEP_INTERVAL_MS);
      };

      step(from);
    };
  }, [myPlayer?.username, notifyAnimationEnded, syncDisplayPositions]);

  const syncPosition = useCallback((username: string, position: number) => {
    busy.current[username] = false;
    queues.current[username] = [];
    syncDisplayPositions({ [username]: position });
  }, [syncDisplayPositions]);

  useEffect(() => {
    const swapEvent = state.lastSwapEvent;
    const hasFreshSwapEvent = !!swapEvent && swapEvent.id !== processedSwapEventId.current;

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

        if (hasFreshSwapEvent && swapEvent.otherUser === username) {
          return;
        }

        // Solo animamos casilla a casilla al jugador que acaba de tirar.
        // Si otro jugador cambia por un efecto colateral del backend, sincronizamos directo.
        if (username !== animatedUser) {
          syncPosition(username, position);
          return;
        }

        if (hasFreshSwapEvent && swapEvent.actor === username) {
          const partnerTo = state.players[swapEvent.otherUser]?.position;
          if (partnerTo === undefined) {
            syncPosition(username, position);
            return;
          }

          const swapTransition: QueuedTransition = {
            kind: 'swap',
            to: position,
            partner: swapEvent.otherUser,
            partnerTo,
          };

          if (!busy.current[username]) {
            busy.current[username] = true;
            setTimeout(() => {
              runQueuedTransitionRef.current!(username, displayPosRef.current[username] ?? 0, swapTransition);
            }, DICE_SHOW_DELAY_MS);
          } else {
            queues.current[username].push(swapTransition);
          }
          return;
        }

        if (!busy.current[username]) {
          // Primera animación del movimiento: esperar a que se vea el dado
          busy.current[username] = true;
          setTimeout(() => {
            startAnimRef.current!(username, displayPosRef.current[username] ?? 0, position);
          }, DICE_SHOW_DELAY_MS);
        } else {
          // Ya hay animación en curso o delay pendiente: encolar el destino
          queues.current[username].push({ kind: 'path', to: position });
        }
      }
    });

    if (hasFreshSwapEvent && swapEvent) {
      processedSwapEventId.current = swapEvent.id;
    }
  }, [animatedUser, playerOrder, state.lastSwapEvent, state.players, syncPosition]);

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

        const isFacingLeft = (displayPos >= 16 && displayPos < 36) || (displayPos >= 51 && displayPos < 63);

        return (
          <div
            key={player.username}
            className="absolute transition-all duration-200"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) ${isFacingLeft ? 'scaleX(-1)' : 'scaleX(1)'}`,
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

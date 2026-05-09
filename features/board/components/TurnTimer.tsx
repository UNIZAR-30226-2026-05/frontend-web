"use client";

import { useEffect, useRef, useState } from 'react';
import { useGameContext } from '@/features/board/context/GameContext';

/** Duración de cada turno en segundos. Debe coincidir con el timeout AFK del backend. */
export const TURN_DURATION_SECONDS = 25;

const LAST_SECONDS_THRESHOLD = 5;

const SIZE = 96;
const CX = SIZE / 2;
const CY = SIZE / 2;
const RADIUS = 36;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Componente interno montado con key={turnoDeUser}, por lo que se remonta
 * automáticamente en cada cambio de turno y el estado arranca desde cero.
 * Recibe el usuario activo para detectar cuándo ese jugador específico tira.
 */
function TurnTimerInner({ turnoDeUser }: { turnoDeUser: string }) {
  const { state } = useGameContext();
  const [remaining, setRemaining] = useState(TURN_DURATION_SECONDS);
  // true cuando el jugador activo del turno ha tirado los dados
  const frozenRef = useRef(false);
  // lastDice en el momento del montaje — para ignorar tiradas de turnos anteriores
  const initialLastDiceRef = useRef(state.lastDice);

  // Congela el timer en cuanto llega un lastDice nuevo del jugador activo
  useEffect(() => {
    if (
      state.lastDice !== initialLastDiceRef.current &&
      state.lastDice?.user === turnoDeUser
    ) {
      frozenRef.current = true;
    }
  }, [state.lastDice, turnoDeUser]);

  // Cuenta atrás — el setRemaining está dentro del callback, no en el cuerpo del efecto
  useEffect(() => {
    const interval = setInterval(() => {
      if (frozenRef.current) return; // congelado cuando el jugador activo ha tirado
      setRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []); // deps vacíos: se ejecuta una vez por montaje (turno)

  const dashoffset = CIRCUMFERENCE * (1 - remaining / TURN_DURATION_SECONDS);
  const isUrgent = remaining <= LAST_SECONDS_THRESHOLD && remaining > 0;
  const strokeColor = isUrgent ? '#ef4444' : '#f59e0b';

  return (
    <div className="bg-slate-900/95 border-2 border-amber-500/50 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.6)] p-3 flex flex-col items-center gap-1">
      <p className="text-amber-500/70 font-pixel text-[8px] uppercase tracking-widest leading-none">
        Tiempo
      </p>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Pista de fondo */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Arco de progreso — sentido antihorario desde las 12 */}
          <circle
            cx={CX}
            cy={CY}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: 'scaleX(-1) rotate(-90deg)',
              transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease',
            }}
          />
        </svg>
        {/* Número central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`font-pixel text-2xl leading-none select-none ${
              isUrgent ? 'text-red-500 animate-pulse' : 'text-amber-400'
            }`}
          >
            {remaining}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Wrapper que oculta el timer entre turnos y fuerza remontaje en cada nuevo turno. */
export default function TurnTimer() {
  const { state } = useGameContext();
  if (state.turnoDeUser === null) return null;

  return (
    <div className="absolute top-4 right-4 z-[90]">
      <TurnTimerInner key={state.turnoDeUser} turnoDeUser={state.turnoDeUser} />
    </div>
  );
}



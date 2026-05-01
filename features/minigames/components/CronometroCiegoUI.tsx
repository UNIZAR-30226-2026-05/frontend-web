"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PixelButton from "@/components/UI/PixelButton";

import Image from "next/image";

interface CronometroCiegoUIProps {
  onAction: (result: { score: number; objetivo?: number }) => void;
  /** Tiempo objetivo en segundos enviado por el backend (detalles.objetivo). Default 10. */
  objetivo?: number;
}

function getRandomBlindTime(minBlindTime: number, maxBlindTime: number) {
  const range = Math.max(0, maxBlindTime - minBlindTime);
  return Math.random() * range + minBlindTime;
}

export default function CronometroCiegoUI({ onAction, objetivo = 10 }: CronometroCiegoUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [time, setTime] = useState(0); // segundos (float)
  const [isRunning, setIsRunning] = useState(true);
  const [isBlinded, setIsBlinded] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // El blind range se deriva del objetivo: la puerta cae entre el 30 % y el 50 % del tiempo objetivo.
  const defaultMinBlind = objetivo * 0.3;
  const defaultMaxBlind = objetivo * 0.5;

  const [debugMinBlindTime, setDebugMinBlindTime] = useState(defaultMinBlind);
  const [debugMaxBlindTime, setDebugMaxBlindTime] = useState(defaultMaxBlind);
  const [debugDoorTransitionMs, setDebugDoorTransitionMs] = useState(500);
  const [debugDoorW, setDebugDoorW] = useState(100);
  const [debugDoorH, setDebugDoorH] = useState(100);
  const [debugDoorTop, setDebugDoorTop] = useState(0);
  const [debugContW, setDebugContW] = useState(82);
  const [debugContH, setDebugContH] = useState(86);
  const [debugContTop, setDebugContTop] = useState(70);
  const [debugContLeft, setDebugContLeft] = useState(50);
  const [blindTime, setBlindTime] = useState(() => getRandomBlindTime(defaultMinBlind, defaultMaxBlind));
  const [showDebug, setShowDebug] = useState(true);
  const isDebug = isDebugRoute && showDebug;

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const updateBlindWindow = (nextMinBlindTime: number, nextMaxBlindTime: number) => {
    const safeMinBlindTime = Math.min(nextMinBlindTime, nextMaxBlindTime);
    const safeMaxBlindTime = Math.max(nextMinBlindTime, nextMaxBlindTime);

    setDebugMinBlindTime(safeMinBlindTime);
    setDebugMaxBlindTime(safeMaxBlindTime);
    setBlindTime(getRandomBlindTime(safeMinBlindTime, safeMaxBlindTime));
  };

  useEffect(() => {
    if (!isRunning) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    }

    const tick = () => {
      if (!isRunning) return;

      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      const currentSecs = elapsed / 1000;
      setTime(currentSecs);

      if (currentSecs >= blindTime) {
        setIsBlinded(true);
      }

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [blindTime, isRunning]);

  const handleStop = () => {
    if (!isRunning || isFinished) return;

    setIsRunning(false);
    setIsFinished(true);
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
    }

    // El backend almacena objetivo como randint(7,10) en segundos y clasifica
    // con abs(score - objetivo). El score debe estar en la misma unidad: ms (int).
    const scoreMs = Math.round(time * 1000);
    const objetivoMs = Math.round(objetivo * 1000);

    onAction({ score: scoreMs, objetivo: objetivoMs });
  };

  const formatTime = (t: number) => {
    return t.toFixed(2).padStart(5, "0");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel flex flex-col items-center justify-center">

      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="flex flex-col">
            <label>Field Width: {debugContW}%</label>
            <input
              type="range" min="10" max="100" step="1"
              value={debugContW} onChange={(e) => setDebugContW(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Field Height: {debugContH}%</label>
            <input
              type="range" min="10" max="100" step="1"
              value={debugContH} onChange={(e) => setDebugContH(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Field Top: {debugContTop}%</label>
            <input
              type="range" min="0" max="100" step="0.5"
              value={debugContTop} onChange={(e) => setDebugContTop(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Field Left: {debugContLeft}%</label>
            <input
              type="range" min="0" max="100" step="0.5"
              value={debugContLeft} onChange={(e) => setDebugContLeft(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="font-bold text-amber-500 mt-2 mb-1 underline">DOOR OVERLAY</div>
          <div className="flex flex-col">
            <label>Min Blind Time: {debugMinBlindTime.toFixed(1)}s</label>
            <input
              type="range" min="0.5" max="5.0" step="0.1"
              value={debugMinBlindTime} onChange={(e) => updateBlindWindow(parseFloat(e.target.value), debugMaxBlindTime)}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Max Blind Time: {debugMaxBlindTime.toFixed(1)}s</label>
            <input
              type="range" min="1.0" max="8.0" step="0.1"
              value={debugMaxBlindTime} onChange={(e) => updateBlindWindow(debugMinBlindTime, parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Door Transition: {debugDoorTransitionMs}ms</label>
            <input
              type="range" min="100" max="3000" step="100"
              value={debugDoorTransitionMs} onChange={(e) => setDebugDoorTransitionMs(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Door Width: {debugDoorW}%</label>
            <input
              type="range" min="10" max="200" step="1"
              value={debugDoorW} onChange={(e) => setDebugDoorW(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Door Height: {debugDoorH}%</label>
            <input
              type="range" min="10" max="200" step="1"
              value={debugDoorH} onChange={(e) => setDebugDoorH(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Door Top (Initial): {debugDoorTop}%</label>
            <input
              type="range" min="-100" max="100" step="1"
              value={debugDoorTop} onChange={(e) => setDebugDoorTop(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            minBlind: {debugMinBlindTime.toFixed(1)},<br />
            maxBlind: {debugMaxBlindTime.toFixed(1)},<br />
            transition: {debugDoorTransitionMs},<br />
            field: W:{debugContW} H:{debugContH} T:{debugContTop}% L:{debugContLeft}%,<br />
            door: W:{debugDoorW} H:{debugDoorH} Y:{debugDoorTop}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowDebug(false)}
              className="flex-1 text-[10px] bg-red-500/20 hover:bg-red-500/40 py-1 rounded transition-colors"
            >
              HIDE
            </button>
          </div>
        </div>
      )}

      {/* Fondo Almacén (Pantalla Completa) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/minijuegos/cronometro/almacen_cronometro.png"
          alt="Almacén de seguridad"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Texto de Objetivo Dorado (Top) */}
      <div className="absolute top-24 z-20 text-center">
        <h3 className="text-amber-400 text-4xl md:text-6xl font-bold tracking-[0.2em] drop-shadow-[0_4px_15px_rgba(251,191,36,0.6)] uppercase">
          TIEMPO OBJETIVO: {String(Math.floor(objetivo)).padStart(2, "0")}.00
        </h3>
      </div>

      {/* Contenedor del Temporizador y Puerta (Posicionado según la imagen de fondo si fuera necesario, o centrado) */}
      <div className="relative z-10 w-full max-w-4xl aspect-[2/1]">

        {/* El Recuadro del Crono */}
        <div
          className="absolute bg-black/30 border-4 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl"
          style={{
            width: `${debugContW}%`,
            height: `${debugContH}%`,
            top: `${debugContTop}%`,
            left: `${debugContLeft}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Reloj Digital */}
          <div className="text-6xl md:text-8xl lg:text-9xl font-mono text-green-500 tracking-tighter font-bold drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">
            {formatTime(time)}
          </div>

          {/* Puerta (Persiana) - SOLO EN ESTE RECUADRO */}
          <div
            className={`absolute z-20 transition-transform ease-in-out
              ${isBlinded ? "translate-y-0" : "-translate-y-full"}`}
            style={{
              transitionDuration: `${debugDoorTransitionMs}ms`,
              left: '50%',
              top: `${debugDoorTop}%`,
              width: `${debugDoorW}%`,
              height: `${debugDoorH}%`,
              transform: isBlinded ? `translate(-50%, 0)` : `translate(-50%, -${debugDoorH}%)`
            }}
          >
            <Image
              src="/minijuegos/cronometro/puerta.png"
              alt="Puerta de seguridad"
              fill
              className="object-fill"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Botón de Parar (Bottom) */}
      <div className="absolute bottom-20 z-20 flex flex-col items-center gap-6">
        <PixelButton
          variant="red"
          onClick={handleStop}
          disabled={isFinished}
          className="px-24 py-10 text-4xl h-32 w-96 shadow-[0_12px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-[0.2em]"
        >
          PARAR
        </PixelButton>
      </div>
    </div>
  );
}

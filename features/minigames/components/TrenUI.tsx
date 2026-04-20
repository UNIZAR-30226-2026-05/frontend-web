"use client";

import { type CSSProperties, useState } from "react";
import { usePathname } from "next/navigation";
import PixelButton from "@/components/UI/PixelButton";
import Image from "next/image";

interface TrenUIProps {
  onAction: (result: { score: number }) => void;
}

// Pool de 10 vagones con recuentos fijos
const WAGON_POOL = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, count: i + 1 }));

function buildSelectedWagons(count: number, keepSorted: boolean) {
  const pool = [...WAGON_POOL];

  if (keepSorted) {
    pool.sort((a, b) => a.id - b.id);
  } else {
    pool.sort(() => Math.random() - 0.5);
  }

  return pool.slice(0, count);
}

/**
 * TrenUI: Minijuego de contar pasajeros.
 * 
 * Diseño Responsivo: 
 * Utilizamos un contenedor "Scene" que mantiene el aspect ratio nativo de vias.png (2816x1536).
 * Esto permite posicionar el tren con coordenadas relativas (%) que coinciden exactamente
 * con el dibujo de las vías en cualquier resolución.
 */
export default function TrenUI({ onAction }: TrenUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [userCount, setUserCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [debugTop, setDebugTop] = useState(76.7);
  const [debugTranslateY, setDebugTranslateY] = useState(-113.5);
  const [debugScale, setDebugScale] = useState(46.0); // Ancho en %
  const [debugStartX, setDebugStartX] = useState(-234); // Inicio en %
  const [debugTimePerWagon, setDebugTimePerWagon] = useState(4.0); // Tiempo (s) por vagón en escena
  const [debugWagonCount, setDebugWagonCount] = useState(4);
  const [selectedWagons, setSelectedWagons] = useState(() => buildSelectedWagons(isDebugRoute ? 4 : 4, isDebugRoute));
  const [isPreviewing, setIsPreviewing] = useState(() => !isDebugRoute); // En debug no empieza sola
  const [showDebug, setShowDebug] = useState(true);
  const isDebug = isDebugRoute && showDebug;

  const handleSubmit = () => {
    if (isFinished) return;
    setIsFinished(true);
    
    const trueTotal = selectedWagons.reduce((sum, w) => sum + w.count, 0);
    const diff = Math.abs(trueTotal - userCount);
    const score = Math.max(0, Math.min(9999, Math.floor(diff)));
    
    onAction({ score });
  };

  const adjustCount = (val: number) => {
    if (isFinished) return;
    setUserCount(prev => Math.max(0, prev + val));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel bg-slate-900 flex items-center justify-center">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">ALIGNMENT DEBUGGER</div>
          <div className="flex flex-col">
            <label>Top Pos (Rail): {debugTop.toFixed(2)}%</label>
            <input 
              type="range" min="0" max="100" step="0.1" 
              value={debugTop} onChange={(e) => setDebugTop(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>TranslateY (Wheels): {debugTranslateY.toFixed(2)}%</label>
            <input 
              type="range" min="-200" max="0" step="0.5" 
              value={debugTranslateY} onChange={(e) => setDebugTranslateY(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Train Scale: {debugScale.toFixed(1)}%</label>
            <input 
              type="range" min="10" max="60" step="0.5" 
              value={debugScale} onChange={(e) => setDebugScale(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Start X (Spawn): {debugStartX.toFixed(0)}%</label>
            <input 
              type="range" min="-300" max="0" step="1" 
              value={debugStartX} onChange={(e) => setDebugStartX(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Wagons (Count): {debugWagonCount}</label>
            <input 
              type="range" min="1" max="10" step="1" 
              value={debugWagonCount} onChange={(e) => {
                const nextWagonCount = parseInt(e.target.value);
                setDebugWagonCount(nextWagonCount);
                setSelectedWagons(buildSelectedWagons(nextWagonCount, true));
              }}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Time per Wagon (Speed): {debugTimePerWagon.toFixed(1)}s</label>
            <input 
              type="range" min="0.5" max="10" step="0.1" 
              value={debugTimePerWagon} onChange={(e) => setDebugTimePerWagon(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            top: {debugTop.toFixed(1)}%,<br />
            translateY: {debugTranslateY.toFixed(1)}%,<br />
            width: {debugScale.toFixed(1)}%,<br />
            startX: {debugStartX.toFixed(0)}%,<br />
            wagons: {debugWagonCount},<br />
            wagonSpeed: {debugTimePerWagon.toFixed(1)}s
          </div>
          
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setIsPreviewing(!isPreviewing)}
              className={`flex-1 text-[10px] py-1 rounded transition-colors ${isPreviewing ? 'bg-green-500/40' : 'bg-blue-500/40'}`}
            >
              {isPreviewing ? 'STOP PREVIEW' : 'PREVIEW ANIMATION'}
            </button>
            <button 
              onClick={() => setShowDebug(false)}
              className="px-3 text-[10px] bg-red-500/20 hover:bg-red-500/40 py-1 rounded transition-colors"
            >
              HIDE
            </button>
          </div>
        </div>
      )}

      {/* 
          Scene Wrapper: 
          Mantiene el aspect ratio 2816:1536 (11:6).
          Usa w-full h-full con object-cover logic manual para asegurar alineación.
      */}
      <div className="relative aspect-[2816/1536] w-full max-h-full flex items-center justify-center overflow-hidden">
        
        {/* Fondo de Vías */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/minijuegos/tren/vias.png" 
            alt="Vías del tren" 
            fill 
            className="object-cover"
            priority
            unoptimized
          />
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* 
            Contenedor del Convoy:
            - Posicionado a debugTop% de altura (donde están los raíles de vias.png).
            - Usamos translate-y para que la base de las ruedas coincida.
        */}
        <div 
            key={isPreviewing ? `preview-${debugWagonCount}-${debugTimePerWagon}` : 'static'}
            className={`absolute left-0 w-full z-10 flex ${isPreviewing ? 'animate-[moveTrain_var(--duration)_linear_forwards]' : ''} items-baseline`}
          style={{ 
                top: `${debugTop}%`, 
                transform: `translateY(${debugTranslateY}%) translateX(${debugStartX}%)`,
                '--duration': `${(debugTimePerWagon * (100 + (debugWagonCount + 1) * debugScale)) / (100 + debugScale)}s`
          } as CSSProperties & { "--duration": string }}
        >
            {/* Locomotora */}
            <div className="relative shrink-0" style={{ width: `${debugScale}%`, aspectRatio: '677/369' }}>
                <Image 
                    src="/minijuegos/tren/locomotora.png" 
                    alt="Locomotora" 
                    fill 
                    className="object-contain"
                    unoptimized
                />
            </div>
            
            {/* Vagones Dinámicos */}
            {selectedWagons.map((wagon, wIdx) => (
                <div key={wIdx} className="relative shrink-0 ml-[-0.5%]" style={{ width: `${debugScale}%`, aspectRatio: '677/369' }}>
                    <Image 
                        src={`/minijuegos/tren/vagon${wagon.count}.png`} 
                        alt={`Vagón con ${wagon.count} pasajeros`} 
                        fill 
                        className="object-contain"
                        unoptimized
                    />
                </div>
            ))}
        </div>
      </div>

      {/* 
          UI Controls Layer:
          Siempre por encima de la escena 
      */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-end pb-12">
        <div className="pointer-events-auto flex flex-col items-center gap-6">
            <h2 className="text-white text-xl tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] px-4 text-center">
            ¿CUÁNTOS PASAJEROS HAS VISTO?
            </h2>
            
            <div className="flex items-center gap-8 bg-black/60 p-6 border-4 border-white/20 rounded-2xl backdrop-blur-md shadow-2xl scale-75 md:scale-100">
                <PixelButton 
                    variant="red" 
                    onClick={() => adjustCount(-1)}
                    disabled={isFinished || userCount === 0}
                    className="w-16 h-16 text-3xl shadow-[0_6px_0_rgb(153,27,27)] active:shadow-none active:translate-y-1 transition-all"
                >
                    -
                </PixelButton>

                <div className="w-24 text-center">
                    <span className="text-6xl text-amber-400 font-bold drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                    {userCount}
                    </span>
                </div>

                <PixelButton 
                    variant="green" 
                    onClick={() => adjustCount(1)}
                    disabled={isFinished}
                    className="w-16 h-16 text-3xl shadow-[0_6px_0_rgb(22,101,52)] active:shadow-none active:translate-y-1 transition-all"
                >
                    +
                </PixelButton>
            </div>

            <PixelButton 
                variant="purple" 
                onClick={handleSubmit}
                disabled={isFinished}
                className="px-16 py-4 text-xl tracking-[0.4em] uppercase shadow-[0_8px_0_rgb(88,28,135)] active:shadow-none active:translate-y-1 transition-all"
            >
                ENVIAR
            </PixelButton>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveTrain {
          0% { transform: translateY(${debugTranslateY}%) translateX(${debugStartX}%); }
          100% { transform: translateY(${debugTranslateY}%) translateX(120vw); }
        }
      `}</style>
    </div>
  );
}

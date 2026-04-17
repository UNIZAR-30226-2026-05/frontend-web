"use client";

import React from 'react';
import PixelButton from '@/components/UI/PixelButton';

interface VideojugadorEleccionModalProps {
    isVideojugador: boolean;
    opciones: { id: string; name: string; description?: string }[];
    onSelect: (id: string) => void;
    /** Llamado cuando el contador llega a 0 sin que el videojugador haya elegido */
    onTimeout?: () => void;
}

export default function VideojugadorEleccionModal({ 
    isVideojugador, 
    opciones, 
    onSelect,
    onTimeout,
}: VideojugadorEleccionModalProps) {
    const [countdown, setCountdown] = React.useState(10);

    React.useEffect(() => {
        if (isVideojugador && countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
        if (isVideojugador && countdown === 0 && onTimeout) {
            onTimeout();
        }
    }, [isVideojugador, countdown, onTimeout]);
    
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className={`
                relative w-full max-w-2xl bg-[#2d1b4d] rounded-2xl p-10 flex flex-col items-center
                border-[6px] ${isVideojugador ? 'border-[#ff00ff]' : 'border-[#ffcc00]'}
                shadow-[0_0_30px_rgba(0,0,0,0.5)]
            `}>
                
                {!isVideojugador ? (
                    /* MODO ESPECTADOR */
                    <div className="flex flex-col items-center space-y-8 w-full">
                        <h2 className="text-[#ffcc00] font-pixel text-xl md:text-2xl text-center uppercase tracking-wider leading-relaxed">
                            El Videojugador está eligiendo...
                        </h2>
                        
                        <p className="text-white/60 font-pixel text-sm uppercase tracking-tighter">
                            Siguiente Minijuego
                        </p>

                        <div className="flex gap-4 w-full justify-center opacity-40 grayscale pointer-events-none">
                            <PixelButton variant="purple" className="min-w-[140px] text-[10px]">MINIJUEGO</PixelButton>
                            <PixelButton variant="purple" className="min-w-[140px] text-[10px]">MINIJUEGO</PixelButton>
                        </div>

                        {/* Spinner */}
                        <div className="w-10 h-10 border-4 border-[#ffcc00]/20 border-t-[#ffcc00] rounded-full animate-spin mt-4" />
                    </div>
                ) : (
                    /* MODO ELECTOR */
                    <div className="flex flex-col items-center space-y-6 w-full text-center">
                        <span className="text-[#ff00ff] font-pixel text-sm uppercase tracking-[0.2em]">
                            Tu Habilidad
                        </span>
                        
                        <h2 className="text-white font-pixel text-2xl md:text-3xl uppercase tracking-tighter leading-none">
                            Elige el siguiente minijuego
                        </h2>

                        <div className="text-[#ffcc00] font-pixel text-6xl my-2">
                            {countdown}
                        </div>
                        
                        <div className="flex flex-wrap gap-6 w-full justify-center pt-4">
                            {opciones.map((opcion) => (
                                <PixelButton 
                                    key={opcion.id}
                                    variant="purple" 
                                    className="min-w-[180px] text-xs py-3"
                                    onClick={() => onSelect(opcion.id)}
                                >
                                    {opcion.name.toUpperCase()}
                                </PixelButton>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes pulse-fast {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}

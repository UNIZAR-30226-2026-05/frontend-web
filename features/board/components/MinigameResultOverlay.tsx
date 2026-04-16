"use client";

import React, { useEffect } from 'react';

interface PlayerResult {
    username: string;
    score: number;
    character: string;
}

interface MinigameResultOverlayProps {
    minigameName: string;
    subtitle: string;
    results: PlayerResult[];
    onClose: () => void;
}

const CHARACTER_IMAGES: Record<string, string> = {
    banquero: '/personajes_profile/banquero_profile.png',
    videojugador: '/personajes_profile/videojugador_profile.png',
    escapista: '/personajes_profile/escapista_profile.png',
    vidente: '/personajes_profile/vidente_profile.png',
};

export default function MinigameResultOverlay({ 
    minigameName, 
    subtitle, 
    results, 
    onClose 
}: MinigameResultOverlayProps) {
    
    // Cierre automático tras 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    // Ordenar por score ascendente (según la foto, los scores bajos parecen ser los mejores o al menos están arriba)
    const sortedResults = [...results].sort((a, b) => a.score - b.score);

    return (
        <div className="fixed inset-0 z-[600] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
            
            {/* Cabecera */}
            <div className="text-center mb-6 space-y-2">
                <h1 className="text-4xl md:text-5xl font-pixel text-[#ffcc00] uppercase tracking-widest drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                    {minigameName}
                </h1>
                <p className="text-white font-pixel text-xs md:text-sm lowercase tracking-tighter opacity-90">
                    {subtitle}
                </p>
            </div>

            {/* Panel de Resultados */}
            <div className="w-full max-w-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl">🏆</span>
                    <h2 className="text-[#ffcc00] font-pixel text-2xl uppercase tracking-tighter">
                        Resultados
                    </h2>
                </div>

                <div className="bg-[#1a1a1a]/85 border-2 border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 space-y-5">
                        {sortedResults.map((player, index) => (
                            <div key={index} className="flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                    {/* Imagen del personaje */}
                                    <div className={`
                                        w-10 h-10 rounded-lg border flex items-center justify-center bg-black/40 p-1
                                        ${index === 0 ? 'border-[#ffcc00]/50 shadow-[0_0_10px_rgba(255,204,0,0.2)]' : 'border-white/10'}
                                    `}>
                                        <img
                                            src={CHARACTER_IMAGES[player.character.toLowerCase()] || '/personajes_profile/vidente_profile.png'}
                                            alt={player.character}
                                            className="w-full h-full object-contain pixelated"
                                        />
                                    </div>
                                    <span className={`
                                        font-pixel text-lg md:text-xl uppercase tracking-wider transition-colors
                                        ${index === 0 ? 'text-[#ffcc00]' : 'text-white'}
                                    `}>
                                        {player.username}
                                    </span>
                                </div>
                                <span className={`
                                    font-pixel text-lg md:text-xl transition-colors
                                    ${index === 0 ? 'text-[#ffcc00]' : 'text-white/80'}
                                `}>
                                    {player.score}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 flex flex-col items-center gap-4">
                <p className="text-white/60 font-pixel text-[10px] uppercase tracking-[0.2em] animate-pulse">
                    Volviendo al tablero...
                </p>
                
                {/* Spinner minimalista */}
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>

            <style jsx>{`
                .font-pixel {
                    font-family: inherit; /* Asumiendo que la fuente pixel se maneja globalmente o vía clase */
                }
            `}</style>
        </div>
    );
}

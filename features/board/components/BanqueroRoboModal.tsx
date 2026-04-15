"use client";

import React from 'react';
import Image from 'next/image';
import PixelButton from '@/components/UI/PixelButton';

interface TargetPlayer {
    username: string;
    character: string; // "banquero", "videojugador", "escapista", "vidente"
}

interface BanqueroRoboModalProps {
    targetPlayers: TargetPlayer[];
    onSelect: (username: string) => void;
}

export default function BanqueroRoboModal({ targetPlayers, onSelect }: BanqueroRoboModalProps) {
    
    // Mapeo para obtener la imagen correcta basada en el rol
    const getCharacterImage = (role: string) => {
        const r = role.toLowerCase();
        if (r.includes('banquero')) return '/personajes_profile/banquero_profile.png';
        if (r.includes('videojugador')) return '/personajes_profile/videojugador_profile.png';
        if (r.includes('escapista')) return '/personajes_profile/escapista_profile.png';
        if (r.includes('vidente')) return '/personajes_profile/vidente_profile.png';
        return '/personajes_profile/banquero_profile.png'; // fallback
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                
                {/* Cabecera */}
                <div className="p-6 border-b-4 border-white bg-[var(--color-sp-bg-medium)] text-center">
                    <h2 className="text-2xl md:text-3xl font-pixel text-white tracking-widest uppercase mb-2">
                        Habilidad de Banquero
                    </h2>
                    <p className="text-amber-400 font-pixel text-sm uppercase tracking-tighter">
                        ¿A quién quieres robar?
                    </p>
                </div>

                {/* Grid de Víctimas */}
                <div className="p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {targetPlayers.map((player, index) => {
                            const isEscapista = player.character.toLowerCase() === 'escapista';
                            
                            return (
                                <div 
                                    key={player.username + index}
                                    className="group relative flex flex-col items-center bg-[var(--color-sp-bg-medium)] border-4 border-white p-6 transition-all hover:scale-105"
                                >
                                    {/* Avatar */}
                                    <div className="relative w-24 h-24 mb-4 border-2 border-white/30 bg-black/40 overflow-hidden">
                                        <Image
                                            src={getCharacterImage(player.character)}
                                            alt={player.character}
                                            fill
                                            className="object-contain p-2 pixelated"
                                        />
                                    </div>

                                    {/* Nombre */}
                                    <h3 className="text-white font-pixel text-lg mb-6 truncate w-full text-center">
                                        {player.username}
                                    </h3>

                                    {/* Botón de Acción */}
                                    <div className="w-full mt-auto">
                                        <PixelButton
                                            variant={isEscapista ? "purple" : "green"}
                                            onClick={() => onSelect(player.username)}
                                            className="w-full text-[10px] md:text-xs py-2 h-auto"
                                        >
                                            {isEscapista ? "ROBAR 1¢" : "ROBAR 2¢"}
                                        </PixelButton>
                                    </div>

                                    {/* Decoración pixel */}
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-white/10" />
                                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/10" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Decorativo */}
                <div className="p-3 bg-black/20 border-t-2 border-white/10 text-center">
                    <p className="text-[var(--color-sp-text-light)] font-pixel text-[9px] uppercase tracking-widest opacity-50">
                        Elige sabiamente para maximizar tus ganancias
                    </p>
                </div>
            </div>

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

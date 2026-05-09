"use client";

import React from 'react';
import Image from 'next/image';
import PixelButton from '@/components/UI/PixelButton';

interface Player {
    username: string;
    character: string;
    balance: number;
}

interface GameOverOverlayProps {
    players: Player[];
    winnerUsername?: string;
    onReturnToMenu: () => void;
}

const CHARACTER_IMAGES: Record<string, string> = {
    banquero: '/personajes_profile/banquero_profile.png',
    videojugador: '/personajes_profile/videojugador_profile.png',
    escapista: '/personajes_profile/escapista_profile.png',
    vidente: '/personajes_profile/vidente_profile.png',
};

export default function GameOverOverlay({ players, winnerUsername, onReturnToMenu }: GameOverOverlayProps) {
    const winner = winnerUsername
        ? players.find(p => p.username === winnerUsername) ?? players[0]
        : [...players].sort((a, b) => b.balance - a.balance)[0];

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-700 overflow-y-auto">
            {/* Fondo con partículas o efectos (opcional, por ahora gradiente sutil) */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 to-transparent pointer-events-none" />

            {/* Título Principal */}
            <div className="relative z-10 text-center mb-12 animate-in slide-in-from-top-10 duration-1000">
                <h1 className="text-4xl md:text-6xl font-pixel text-yellow-500 uppercase tracking-widest drop-shadow-[0_4px_0_rgba(180,83,9,1)]">
                    ¡FIN DE LA PARTIDA!
                </h1>
                <div className="h-1 w-64 md:w-96 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4" />
            </div>

            {/* GANADOR */}
            {winner && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-700 delay-300 fill-mode-both">
                        <div className="relative group">
                            {/* Corona */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                                👑
                            </div>
                            
                            {/* Marco Dorado del Ganador */}
                            <div className="relative w-40 h-40 md:w-56 md:h-56 p-1 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                                <div className="w-full h-full bg-[#1a0b2e] rounded-[1.4rem] overflow-hidden border-4 border-[#2d1b4d] flex items-center justify-center">
                                    <Image
                                        src={CHARACTER_IMAGES[winner.character.toLowerCase()] || '/personajes_profile/vidente_profile.png'}
                                        alt={winner.username}
                                        width={200}
                                        height={200}
                                        className="object-contain pixelated p-4 scale-110"
                                    />
                                </div>
                            </div>

                            {/* Etiqueta 1º Puesto */}
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-pixel px-6 py-2 rounded-full border-4 border-[#b45309] shadow-lg whitespace-nowrap">
                                1º LUGAR
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <h2 className="text-2xl md:text-3xl font-pixel text-white uppercase tracking-widest">
                                {winner.username}
                            </h2>
                        </div>
                    </div>
                )}

            {/* BOTÓN DE ACCIÓN */}
            <div className="relative z-10 mt-16 animate-in slide-in-from-bottom-2 duration-1000 delay-1000 fill-mode-both">
                <PixelButton
                    variant="purple"
                    className="px-12 py-5 text-sm"
                    onClick={onReturnToMenu}
                >
                    VOLVER AL MENÚ
                </PixelButton>
            </div>
        </div>
    );
}

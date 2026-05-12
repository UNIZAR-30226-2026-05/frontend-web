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

const PLACE_LABELS = ['1º LUGAR', '2º LUGAR', '3º LUGAR', '4º LUGAR'];
const PLACE_COLORS = [
    'bg-yellow-500 border-[#b45309] text-black',
    'bg-slate-400 border-slate-600 text-black',
    'bg-amber-700 border-amber-900 text-white',
    'bg-slate-700 border-slate-900 text-white',
];
const FRAME_COLORS = [
    'from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_50px_rgba(234,179,8,0.4)]',
    'from-slate-300 via-slate-400 to-slate-600 shadow-[0_0_30px_rgba(148,163,184,0.3)]',
    'from-amber-600 via-amber-700 to-amber-900 shadow-[0_0_20px_rgba(180,83,9,0.3)]',
    'from-slate-600 via-slate-700 to-slate-900',
];

export default function GameOverOverlay({ players, winnerUsername, onReturnToMenu }: GameOverOverlayProps) {
    // players ya viene ordenado por posición final desde GameOverController,
    // pero aseguramos que el winner esté primero.
    const ordered = winnerUsername
        ? [
            ...players.filter(p => p.username === winnerUsername),
            ...players.filter(p => p.username !== winnerUsername),
          ]
        : players;

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-700 overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 to-transparent pointer-events-none" />

            {/* Título */}
            <div className="relative z-10 text-center mb-10 animate-in slide-in-from-top-10 duration-1000">
                <h1 className="text-4xl md:text-6xl font-pixel text-yellow-500 uppercase tracking-widest drop-shadow-[0_4px_0_rgba(180,83,9,1)]">
                    ¡FIN DE LA PARTIDA!
                </h1>
                <div className="h-1 w-64 md:w-96 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4" />
            </div>

            {/* Podio */}
            <div className="relative z-10 flex flex-wrap justify-center gap-6 md:gap-8">
                {ordered.map((player, index) => {
                    const isWinner = index === 0;
                    const imgSize = isWinner ? 'w-40 h-40 md:w-52 md:h-52' : 'w-28 h-28 md:w-36 md:h-36';
                    const frameGrad = FRAME_COLORS[index] ?? FRAME_COLORS[3];
                    const placeLabel = PLACE_LABELS[index] ?? `${index + 1}º LUGAR`;
                    const placeColor = PLACE_COLORS[index] ?? PLACE_COLORS[3];

                    return (
                        <div
                            key={player.username}
                            className={`flex flex-col items-center animate-in zoom-in duration-700 fill-mode-both`}
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className="relative group">
                                {isWinner && (
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                                        👑
                                    </div>
                                )}
                                <div className={`relative ${imgSize} p-1 bg-gradient-to-br ${frameGrad} rounded-3xl`}>
                                    <div className="w-full h-full bg-[#1a0b2e] rounded-[1.4rem] overflow-hidden border-4 border-[#2d1b4d] flex items-center justify-center">
                                        <Image
                                            src={CHARACTER_IMAGES[player.character.toLowerCase()] || '/personajes_profile/vidente_profile.png'}
                                            alt={player.username}
                                            width={200}
                                            height={200}
                                            className="object-contain pixelated p-3 scale-110"
                                        />
                                    </div>
                                </div>
                                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 font-pixel px-4 py-1 rounded-full border-4 shadow-lg whitespace-nowrap text-xs ${placeColor}`}>
                                    {placeLabel}
                                </div>
                            </div>
                            <div className="mt-8 text-center">
                                <h2 className={`font-pixel uppercase tracking-widest ${isWinner ? 'text-2xl md:text-3xl text-white' : 'text-sm md:text-base text-slate-300'}`}>
                                    {player.username}
                                </h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BOTÓN */}
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

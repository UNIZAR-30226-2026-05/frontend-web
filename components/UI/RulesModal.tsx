"use client";

import React from 'react';
import PixelButton from './PixelButton';

interface RulesModalProps {
    onClose: () => void;
}

const RULES = [
    {
        title: "OBJETIVO",
        text: "Sé el jugador con más monedas al final de la partida.",
    },
    {
        title: "TURNO",
        text: "En tu turno tira los dados para avanzar casillas. La posición en el orden de turno se decide con el minijuego de reflejos.",
    },
    {
        title: "CASILLAS",
        text: "Cada casilla tiene un efecto: pueden darte o quitarte monedas, mover tu posición, bloquearte un turno o activar un minijuego.",
    },
    {
        title: "TIENDA",
        text: "Antes de tirar puedes comprar objetos con tus monedas. Los objetos se usan al instante.",
    },
    {
        title: "OBJETOS",
        text: "• Avanzar Casillas (1¢) - Avanza una casilla extra. Solo antes de tirar.\n• Mejorar Dados (3¢) - Mejora tu segundo dado un nivel para la tirada.\n• Barrera (10¢) - Penaliza un turno al Jugador elegido.\n• Salvavidas movimiento (5¢) - Anula el efecto de una casilla de movimiento.\n• Salvavidas bloqueo (10¢) - Anula el efecto de una casilla de bloqueo.",
    },
    {
        title: "DADOS",
        text: "El jugador con mejor resultado en el minijuego obtiene el dado de oro (el mejor). Hay dados de oro, plata, bronce y normal.",
    },
];

export default function RulesModal({ onClose }: RulesModalProps) {
    const textShadow = "0 0 4px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.6), 0 0 12px rgba(220,200,255,0.3)";

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[34rem] max-h-[95vh] bg-[#241738] border-2 border-white/20 p-8 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Título */}
                <h1 
                    className="text-[2.8rem] font-pixel text-white font-bold tracking-widest mb-6 uppercase shrink-0"
                    style={{ textShadow }}
                >
                    NORMAS
                </h1>

                {/* Contenedor de Reglas con Scroll */}
                <div className="bg-[#1a0f2b] p-6 rounded-md w-full flex flex-col gap-6 mb-8 border border-white/5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {RULES.map((rule) => (
                        <div key={rule.title} className="flex flex-col gap-2">
                            <h3 className="text-white font-pixel text-[1.4rem] tracking-wider font-bold">
                                {rule.title}
                            </h3>
                            <p className="text-gray-300 font-pixel text-[1.1rem] leading-snug tracking-tight whitespace-pre-line">
                                {rule.text}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Botón Cerrar */}
                <div className="flex justify-center w-full">
                    <PixelButton
                        variant="purple"
                        className="!px-12 !py-4 !text-[1.5rem]"
                        onClick={onClose}
                    >
                        CERRAR
                    </PixelButton>
                </div>
            </div>
        </div>
    );
}


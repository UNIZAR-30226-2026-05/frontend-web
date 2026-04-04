"use client";

import React from 'react';

interface RulesModalProps {
    onClose: () => void;
}

const RULES = [
    {
        title: "Objetivo",
        text: "Sé el jugador con más monedas al final de la partida.",
    },
    {
        title: "Turno",
        text: "En tu turno tira los dados para avanzar casillas. La posición en el orden de turno se decide con el minijuego de reflejos.",
    },
    {
        title: "Casillas",
        text: "Cada casilla tiene un efecto: pueden darte o quitarte monedas, mover tu posición, bloquearte un turno o activar un minijuego.",
    },
    {
        title: "Tienda",
        text: "Antes de tirar puedes comprar objetos con tus monedas. Los objetos se usan al instante.",
    },
    {
        title: "Objetos",
        items: [
            { emoji: "👞", name: "Avanzar Casillas (1¢)", desc: "Avanza una casilla extra. Solo antes de tirar." },
            { emoji: "🎲", name: "Mejorar Dados (3¢)", desc: "Mejora tu segundo dado un nivel para la tirada." },
            { emoji: "🚧", name: "Barrera (10¢)", desc: "Penaliza un turno al jugador elegido." },
            { emoji: "🛟", name: "Salvavidas movimiento (5¢)", desc: "Anula el efecto de una casilla de movimiento." },
            { emoji: "🔒", name: "Salvavidas bloqueo (10¢)", desc: "Anula el efecto de una casilla de bloqueo." },
        ],
    },
    {
        title: "Dados",
        text: "El jugador con mejor resultado en el minijuego obtiene el dado de oro (el mejor). Hay dados de oro, plata, bronce y normal.",
    },
];

export default function RulesModal({ onClose }: RulesModalProps) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            {/* Contenedor del Modal — stopPropagation para que clicar dentro no cierre */}
            <div
                className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabecera */}
                <div className="p-4 border-b-4 border-white flex justify-between items-center bg-[var(--color-sp-bg-medium)]">
                    <h2 className="text-2xl font-pixel text-white tracking-widest uppercase">
                        Reglas del juego
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-400 transition-colors text-3xl font-bold p-2 leading-none"
                        aria-label="Cerrar"
                    >
                        X
                    </button>
                </div>

                {/* Contenido con scroll */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
                    <div className="flex flex-col gap-6">
                        {RULES.map((rule) => (
                            <div key={rule.title} className="flex flex-col gap-2">
                                <h3 className="text-white font-pixel text-lg tracking-wider uppercase border-b-2 border-white/30 pb-1">
                                    {rule.title}
                                </h3>
                                {rule.text && (
                                    <p className="text-white/80 font-pixel text-sm leading-relaxed">
                                        {rule.text}
                                    </p>
                                )}
                                {rule.items && (
                                    <ul className="flex flex-col gap-2 mt-1">
                                        {rule.items.map((item) => (
                                            <li key={item.name} className="flex items-start gap-3">
                                                <span className="text-2xl shrink-0">{item.emoji}</span>
                                                <span className="font-pixel text-sm text-white/80 leading-relaxed">
                                                    <span className="text-white">{item.name}</span>
                                                    {" — "}
                                                    {item.desc}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

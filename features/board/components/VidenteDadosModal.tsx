"use client";

import Image from "next/image";
import React from 'react';
import PixelButton from '@/components/UI/PixelButton';

export type DiceType = "oro" | "plata" | "bronce" | "normal";

export interface TiradaVidente {
    dado1: number;
    dado2: number;
    diceType: DiceType;
}

interface VidenteDadosModalProps {
    tiradas: TiradaVidente[];
    onClose: () => void;
}

const typeStyles: Record<DiceType, string> = {
    oro: "border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.5)]",
    plata: "border-slate-300/50 shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    bronce: "border-orange-700/50 shadow-[0_0_15px_rgba(194,65,12,0.4)]",
    normal: "border-white shadow-lg",
};

const filterStyles: Record<DiceType, string> = {
    oro: "brightness(1.1) sepia(1) hue-rotate(-15deg) saturate(4)",
    plata: "grayscale(1) brightness(1.2) contrast(1.1)",
    bronce: "sepia(1) hue-rotate(-30deg) saturate(2) brightness(0.7)",
    normal: "none",
};

export default function VidenteDadosModal({ 
    tiradas, 
    onClose 
}: VidenteDadosModalProps) {
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-500">
            {/* Contenedor Místico */}
            <div className="relative w-full max-w-lg bg-[#1a0b2e] rounded-2xl p-6 flex flex-col items-center border-[6px] border-[#9d4edd] shadow-[0_0_40px_rgba(157,78,221,0.3)] overflow-hidden">
                
                {/* Efecto de brillo de fondo */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 blur-[60px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 blur-[60px] rounded-full" />

                <div className="relative z-10 flex flex-col items-center space-y-6 w-full text-center">
                    <div className="space-y-1">
                        <span className="text-[#c77dff] font-pixel text-[10px] uppercase tracking-[0.3em] animate-pulse">
                            Habilidad Mística
                        </span>
                        
                        <h2 className="text-white font-pixel text-xl md:text-2xl uppercase tracking-tighter leading-none glow-text">
                            Visión del Futuro
                        </h2>
                    </div>

                    <p className="text-white/60 font-pixel text-[10px] uppercase tracking-wider">
                        El resultado de los dados será:
                    </p>

                    {/* Lista Vertical de Tiradas */}
                    <div className="w-full space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {tiradas.map((tirada, index) => {
                            const labels = ["Primer puesto", "Segundo puesto", "Tercer puesto", "Cuarto puesto"];
                            const isFourth = index === 3;
                            const total = isFourth ? tirada.dado1 : tirada.dado1 + tirada.dado2;
                            
                            return (
                                <div 
                                    key={index} 
                                    className="flex items-center justify-between bg-black/40 border-2 border-[#9d4edd]/30 rounded-xl p-3 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="flex flex-col items-start min-w-[120px]">
                                        <span className="text-[#c77dff] font-pixel text-xs uppercase tracking-tight">
                                            {labels[index] || `Turno ${index + 1}`}
                                        </span>
                                    </div>

                                    <div className="flex gap-3 flex-1 justify-center">
                                        {/* Dado 1 (Normal) - Siempre visible */}
                                        <div className="relative group">
                                            <Image
                                                src={`/dice/${tirada.dado1}.png`}
                                                alt={`Dado normal ${tirada.dado1}`}
                                                className="w-12 h-12 rounded-lg border-2 object-cover bg-white border-white shadow-md transition-transform group-hover:scale-110"
                                                width={48}
                                                height={48}
                                            />
                                        </div>

                                        {/* Dado 2 (Especial/Normal) - Oculto en el 4º puesto */}
                                        {!isFourth && (
                                            <div className="relative group">
                                                <Image
                                                    src={`/dice/${tirada.dado2}.png`}
                                                    alt={`Dado ${tirada.diceType} ${tirada.dado2}`}
                                                    className={`w-12 h-12 rounded-lg border-2 object-cover bg-white transition-transform group-hover:scale-110 ${typeStyles[tirada.diceType]}`}
                                                    style={{ filter: filterStyles[tirada.diceType] }}
                                                    width={48}
                                                    height={48}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end min-w-[80px]">
                                        <span className="text-amber-400 font-pixel text-[10px] uppercase">Total</span>
                                        <span className="text-white font-pixel text-xl glow-text-amber">{total}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2 w-full">
                        <PixelButton 
                            variant="purple" 
                            className="w-full py-3 text-xs"
                            onClick={onClose}
                        >
                            ACEPTAR
                        </PixelButton>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .glow-text {
                    text-shadow: 0 0 10px rgba(157, 78, 221, 0.8), 0 0 20px rgba(157, 78, 221, 0.4);
                }
                .glow-text-amber {
                    text-shadow: 0 0 10px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 191, 36, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(157, 78, 221, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(157, 78, 221, 0.5);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}

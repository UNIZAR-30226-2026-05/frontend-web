"use client";

import React from 'react';
import Image from 'next/image';
import PixelButton from '@/components/UI/PixelButton';

/**
 * Interfaz para los personajes disponibles en el juego.
 */
interface Character {
  id: string;
  name: string;
  description: string;
  image: string;
}

const CHARACTERS: Character[] = [
  { 
    id: 'banquero', 
    name: 'Banquero', 
    description: 'Roba una cantidad de monedas X a un jugador elegido por el propio banquero en cada turno.', 
    image: '/personajes_profile/banquero_profile.png' 
  },
  { 
    id: 'videojugador', 
    name: 'Videojugador', 
    description: 'Vota entre dos opciones de minijuegos posibles.', 
    image: '/personajes_profile/videojugador_profile.png' 
  },
  { 
    id: 'escapista', 
    name: 'Escapista', 
    description: 'Recibe penalizaciones reducidas en eventos negativos.', 
    image: '/personajes_profile/escapista_profile.png' 
  },
  { 
    id: 'vidente', 
    name: 'Vidente', 
    description: 'Puede visualizar el resultado de los dados antes de jugar el minijuego de orden para tomar decisiones estratégicas.', 
    image: '/personajes_profile/vidente_profile.png' 
  },
];

interface CharacterSelectionModalProps {
  unavailableRoles: string[];
  onSelect: (roleId: string) => void;
}

/**
 * CharacterSelectionModal Component
 * Modal obligatorio al inicio de la partida para elegir personaje.
 * 
 * @param unavailableRoles - IDs de personajes ya elegidos por otros jugadores.
 * @param onSelect - Callback ejecutado al confirmar la selección de un personaje disponible.
 */
export default function CharacterSelectionModal({ unavailableRoles, onSelect }: CharacterSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Contenedor del Modal - Estética Pixel Art coherente con ShopModal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in duration-300">
        
        {/* Cabecera */}
        <div className="p-6 border-b-4 border-white bg-[var(--color-sp-bg-medium)] text-center">
          <h2 className="text-3xl font-pixel text-white tracking-[0.2em] uppercase">
            Selecciona tu Personaje
          </h2>
          <p className="text-[var(--color-sp-text-light)] font-pixel text-xs mt-2 opacity-70">
            Cada héroe tiene habilidades únicas para dominar el tablero
          </p>
        </div>

        {/* Rejilla de Personajes */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHARACTERS.map((char) => {
              const rotateClass = char.id === 'banquero' || char.id === 'escapista' ? 'hover:-rotate-1' : 'hover:rotate-1';
              const isUnavailable = unavailableRoles.includes(char.id);

              return (
                <div
                  key={char.id}
                  className={`
                    group relative flex flex-col items-center bg-[var(--color-sp-bg-medium)] border-4 border-white p-6 transition-all duration-200 
                    ${isUnavailable ? 'opacity-50 grayscale' : `hover:bg-[var(--color-sp-bg-light)] hover:scale-105 active:scale-95 ${rotateClass}`}
                  `}
                >
                  {/* Imagen del Personaje */}
                  <div className="relative w-32 h-32 mb-6 border-4 border-white bg-black/20 overflow-hidden shadow-inner">
                    <Image
                      src={char.image}
                      alt={char.name}
                      fill
                      className="object-contain p-2 pixelated"
                    />
                  </div>

                  {/* Info del Personaje */}
                  <div className="flex flex-col items-center text-center gap-3 mb-6 flex-1">
                    <h3 className="text-white font-pixel text-xl tracking-wider uppercase">
                      {char.name}
                    </h3>
                    <p className="text-[var(--color-sp-text-light)] font-pixel text-[10px] leading-relaxed">
                      {char.description}
                    </p>
                  </div>

                  {/* Estado / Botón de Acción */}
                  <div className="w-full mt-auto">
                    {isUnavailable ? (
                      <div className="w-full py-3 bg-red-900/50 border-2 border-red-500 text-red-500 font-pixel text-[10px] text-center uppercase tracking-widest">
                        Ocupado
                      </div>
                    ) : (
                      <PixelButton
                        variant="green"
                        onClick={() => onSelect(char.id)}
                        className="w-full text-xs py-3 h-auto"
                      >
                        Elegir
                      </PixelButton>
                    )}
                  </div>

                  {/* Efecto decorativo de brillo al pasar el ratón (solo si está disponible) */}
                  {!isUnavailable && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/0 group-hover:border-white/20 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="p-4 bg-[var(--color-sp-bg-medium)]/50 border-t-2 border-white/20 text-center">
          <p className="text-white font-pixel text-[9px] uppercase tracking-widest animate-pulse">
            Esperando selección del jugador...
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

"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import PixelButton from '@/components/UI/PixelButton';
import { getGameSocket } from '@/lib/gameSocket';

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

// Mapeo id → nombre exacto para el payload WS
const CHARACTER_WS_NAME: Record<string, string> = {
  banquero: 'Banquero',
  videojugador: 'Videojugador',
  escapista: 'Escapista',
  vidente: 'Vidente',
};

interface CharacterSelectionModalProps {
  unavailableRoles: string[];
  onSelect: (roleId: string) => void;
}

export default function CharacterSelectionModal({ unavailableRoles, onSelect }: CharacterSelectionModalProps) {
  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [currentChooserIndex, setCurrentChooserIndex] = useState(0);

  // Leer sessionStorage solo en cliente
  useEffect(() => {
    const username = sessionStorage.getItem('username');
    const raw = sessionStorage.getItem('lobbyPlayers');
    setLocalUsername(username);
    if (raw) {
      try {
        setLobbyPlayers(JSON.parse(raw));
      } catch {
        console.error('Error al parsear lobbyPlayers desde sessionStorage');
      }
    }
  }, []);

  // Avanzar el turno cuando cambian los roles no disponibles
  useEffect(() => {
    setCurrentChooserIndex(unavailableRoles.length);
  }, [unavailableRoles]);

  const currentChooser = lobbyPlayers[currentChooserIndex] ?? null;
  const isMyTurn = localUsername !== null && localUsername === currentChooser;
  const allChosen = currentChooserIndex >= lobbyPlayers.length;

  const handleSelect = (char: Character) => {
      if (!isMyTurn) return;

      const ws = getGameSocket();

      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
              action: "select_player",
              payload: { character: CHARACTER_WS_NAME[char.id] }
          }));
      } else {
          console.warn('WebSocket no disponible o no abierto:', ws?.readyState);
      }

      onSelect(char.id);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
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

        {/* Banner de turno */}
        <div className={`px-6 py-3 text-center font-pixel text-xs uppercase tracking-widest border-b-2 ${
          isMyTurn
            ? 'bg-green-900/60 border-green-500 text-green-300'
            : 'bg-yellow-900/40 border-yellow-600/50 text-yellow-300'
        }`}>
          {allChosen
            ? '✓ Todos los jugadores han elegido personaje'
            : isMyTurn
              ? 'Es tu turno de elegir'
              : `Esperando a ${currentChooser ?? '...'}  (${unavailableRoles.length}/${lobbyPlayers.length} elegidos)`
          }
        </div>

        {/* Rejilla de Personajes */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CHARACTERS.map((char) => {
              const rotateClass = char.id === 'banquero' || char.id === 'escapista' ? 'hover:-rotate-1' : 'hover:rotate-1';
              const isUnavailable = unavailableRoles.includes(char.id);
              // Interactuable solo si es mi turno y el personaje está libre
              const isSelectable = isMyTurn && !isUnavailable;

              return (
                <div
                  key={char.id}
                  className={`
                    group relative flex flex-col items-center bg-[var(--color-sp-bg-medium)] border-4 border-white p-6 transition-all duration-200
                    ${isUnavailable
                      ? 'opacity-50 grayscale'
                      : isSelectable
                        ? `hover:bg-[var(--color-sp-bg-light)] hover:scale-105 active:scale-95 ${rotateClass} cursor-pointer`
                        : 'opacity-60 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Imagen */}
                  <div className="relative w-32 h-32 mb-6 border-4 border-white bg-black/20 overflow-hidden shadow-inner">
                    <Image
                      src={char.image}
                      alt={char.name}
                      fill
                      className="object-contain p-2 pixelated"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col items-center text-center gap-3 mb-6 flex-1">
                    <h3 className="text-white font-pixel text-xl tracking-wider uppercase">
                      {char.name}
                    </h3>
                    <p className="text-[var(--color-sp-text-light)] font-pixel text-[10px] leading-relaxed">
                      {char.description}
                    </p>
                  </div>

                  {/* Botón / Estado */}
                  <div className="w-full mt-auto">
                    {isUnavailable ? (
                      <div className="w-full py-3 bg-red-900/50 border-2 border-red-500 text-red-500 font-pixel text-[10px] text-center uppercase tracking-widest">
                        Ocupado
                      </div>
                    ) : isSelectable ? (
                      <PixelButton
                        variant="green"
                        onClick={() => handleSelect(char)}
                        className="w-full text-xs py-3 h-auto"
                      >
                        Elegir
                      </PixelButton>
                    ) : (
                      <div className="w-full py-3 bg-gray-900/50 border-2 border-gray-600 text-gray-500 font-pixel text-[10px] text-center uppercase tracking-widest">
                        No es tu turno
                      </div>
                    )}
                  </div>

                  {/* Brillo hover (solo seleccionable) */}
                  {isSelectable && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/0 group-hover:border-white/20 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--color-sp-bg-medium)]/50 border-t-2 border-white/20 text-center">
          <p className="text-white font-pixel text-[9px] uppercase tracking-widest animate-pulse">
            {isMyTurn ? 'Elige tu personaje para continuar...' : 'Esperando a los demás jugadores...'}
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
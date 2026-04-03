"use client";

import Dice from "@/features/board/components/Dice";
import PlayerHUD from "@/features/board/components/PlayerHUD";
import PixelButton from "@/components/UI/PixelButton";
import ShopModal from "@/features/shop/components/ShopModal";
import BoardOverlay from "@/features/board/components/BoardOverlay";
import CharacterSelectionModal from "@/features/board/components/CharacterSelectionModal";
import { GameProvider } from "@/features/board/context/GameContext";
import { getGameSocket, getLobbyPlayers } from "@/lib/gameSocket";
import { useEffect, useState } from "react";
import OrderMinigameOverlay, { OrderMinigameType } from "@/features/minigames/components/OrderMinigameOverlay";

export default function GamePage() {
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);
  const [mockUnavailableRoles] = useState(['banquero']);
  const [lobbyPlayers] = useState<unknown[]>(() => getLobbyPlayers());
  const [unavailableRoles, setUnavailableRoles] = useState<string[]>([]);
  
  // Mapeo nombre WS → id local
  const WS_NAME_TO_ID: Record<string, string> = {
    Banquero: 'banquero',
    Videojugador: 'videojugador',
    Escapista: 'escapista',
    Vidente: 'vidente',
  };

  // Debug State for Minigames
  const [activeMinigame, setActiveMinigame] = useState<OrderMinigameType | null>(null);

  const handleCharacterSelect = (roleId: string) => {
    console.log(`Personaje seleccionado: ${roleId}`);
    // Guardamos referencia al socket ANTES de cualquier re-render
    const ws = getGameSocket();
    console.log('Socket state al elegir:', ws?.readyState);
    setShowCharacterSelect(false);
  };

  const handleMinigameAction = (result: object) => {
    console.log("Minigame Action:", activeMinigame, result);
    // Ya no salimos automáticamente después del timeout
  };

  useEffect(() => {
    const ws = getGameSocket();

    if (!ws) {
      console.warn("No hay una conexion WebSocket activa en /game");
      return;
    }

   const onMessage = (event: MessageEvent) => {
    console.log("Mensaje en /game:", event.data);

    try {
      const data = JSON.parse(event.data);
      if (data.type === 'player_selected' && data.character) {
        const roleId = WS_NAME_TO_ID[data.character];
        if (roleId) {
          setUnavailableRoles((prev) =>
            prev.includes(roleId) ? prev : [...prev, roleId]
          );
        }
      }
    } catch {
      // mensaje no JSON, ignorar
    }
  };

    const onClose = (event: CloseEvent) => {
      console.log("WebSocket cerrado en /game", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    };

    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", onClose);

    return () => {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("close", onClose);
    };
  }, []);

  useEffect(() => {
    console.log("Jugadores recibidos desde la lobby:", lobbyPlayers);
  }, [lobbyPlayers]);


  return (
    <GameProvider>
      <main className="relative min-h-screen w-full overflow-hidden bg-[url('/tablero_def.png')] bg-contain bg-no-repeat bg-center">
      
      {/* Modal de Selección de Personaje (Mandatorio) */}
      {showCharacterSelect && (
        <CharacterSelectionModal 
          unavailableRoles={unavailableRoles} 
          onSelect={handleCharacterSelect} 
        />
      )}

      {/* Capa de Fichas de Jugadores y Lógica de Tablero */}
      <BoardOverlay />

      {/* HUD de Jugadores (Lado izquierdo) */}
      <div className="absolute top-2 left-2 z-50">
        <PlayerHUD />
      </div>

      {/*
      {lobbyPlayers.length > 0 && (
        <div className="absolute top-2 right-2 z-50 rounded bg-black/60 px-4 py-2 text-xs text-white">
          Lobby players: {lobbyPlayers.length}
        </div>
      )}
      */}

      {/* Botón Tienda (Esquina inferior izquierda) */}
      <div className="absolute bottom-6 left-6 z-50">
        <PixelButton 
          variant="purple" 
          onClick={() => setIsShopOpen(true)}
          className="text-sm px-8 py-4 uppercase"
        >
          Tienda
        </PixelButton>
      </div>

      {/* Tienda Modal */}
      {isShopOpen && (
        <ShopModal onClose={() => setIsShopOpen(false)} />
      )}

      {/* Contenedor superpuesto para controles (esquina inferior derecha) */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex flex-col items-end gap-4">
        <Dice />
        
        {/* Debug: Menú de Minijuegos */}
        <div className="flex flex-wrap justify-end gap-2 max-w-[200px]">
          {(['tren', 'reflejos', 'pan', 'crono', 'cartas'] as OrderMinigameType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveMinigame(type)}
              className="bg-black/50 hover:bg-black/80 text-white text-[8px] font-pixel p-2 border border-white/20 rounded uppercase"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay de Minijuegos de Orden */}
      {activeMinigame && (
        <OrderMinigameOverlay 
          minigameType={activeMinigame} 
          onAction={handleMinigameAction}
          onClose={() => setActiveMinigame(null)}
        />
      )}

    </main>
    </GameProvider>
  );
}

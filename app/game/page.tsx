"use client";

import Dice from "@/features/board/components/Dice";
import PlayerHUD from "@/features/board/components/PlayerHUD";
import ShopModal from "@/features/shop/components/ShopModal";
import BoardOverlay from "@/features/board/components/BoardOverlay";
import CharacterSelectionModal from "@/features/board/components/CharacterSelectionModal";
import VideojugadorEleccionModal from "@/features/board/components/VideojugadorEleccionModal";
import { GameProvider } from "@/features/board/context/GameContext";
import { useGameContext } from "@/features/board/context/GameContext";
import { getGameSocket, getLobbyPlayers } from "@/lib/gameSocket";
import { useEffect, useState } from "react";
import OrderMinigameOverlay, { OrderMinigameType } from "@/features/minigames/components/OrderMinigameOverlay";
import DobleNadaOverlay from "@/features/board/components/DobleNadaOverlay";

// Mapeo nombre WS → id local (fuera del componente para evitar recreación en cada render)
const WS_NAME_TO_ID: Record<string, string> = {
  Banquero: 'banquero',
  Videojugador: 'videojugador',
  Escapista: 'escapista',
  Vidente: 'vidente',
};

// Mapeo nombre backend → tipo local de OrderMinigameOverlay
const MINIJUEGO_NAME_TO_TYPE: Record<string, OrderMinigameType> = {
  'Tren': 'tren',
  'Reflejos': 'reflejos',
  'Cortar pan': 'pan',
  'Cronometro ciego': 'crono',
  'Mayor o Menor': 'cartas',
};

/** Muestra el overlay del minijuego de orden elegido por el videojugador. */
function OrderMinigameController() {
  const { state, sendScoreOrden } = useGameContext();

  if (!state.showOrderMinigame) return null;

  const minijuegoType = state.currentOrderMinijuego
    ? (MINIJUEGO_NAME_TO_TYPE[state.currentOrderMinijuego] ?? 'reflejos')
    : 'reflejos';

  return (
    <OrderMinigameOverlay
      minigameType={minijuegoType}
      onAction={(result: { score: number }) => sendScoreOrden(result.score)}
      onClose={() => {/* no se puede cerrar manualmente */}}
    />
  );
}

/** Muestra el modal de elección del videojugador (o vista espectador para el resto). */
function VideojugadorEleccionController() {
  const { state, myPlayer, sendIniRound } = useGameContext();

  if (!state.showVideojugadorEleccion) return null;

  const isVideojugador = myPlayer?.character === 'videojugador';

  const opciones = state.videojugadorOpciones.map(o => ({
    id: o.nombre,
    name: o.nombre,
    description: o.descripcion ?? undefined,
  }));

  const handleSelect = (id: string) => {
    const opcion = state.videojugadorOpciones.find(o => o.nombre === id);
    if (opcion) {
      sendIniRound(opcion.nombre, opcion.descripcion ?? '');
    }
  };

  return (
    <VideojugadorEleccionModal
      isVideojugador={isVideojugador}
      opciones={opciones}
      onSelect={handleSelect}
      onTimeout={() => {
        if (opciones.length > 0) handleSelect(opciones[0].id);
      }}
    />
  );
}

/** Muestra el overlay de Doble o Nada cuando el jugador cae en la casilla correspondiente. */
function DobleNadaController() {
  const { state, closeDobleNada } = useGameContext();

  if (!state.showDobleNada) return null;

  return (
    <DobleNadaOverlay onClose={closeDobleNada} />
  );
}

export default function GamePage() {
  const [lobbyPlayers] = useState<unknown[]>(() => getLobbyPlayers());
  const [unavailableRoles, setUnavailableRoles] = useState<string[]>([]);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(true);

  // Debug State for Minigames - DESACTIVADO POR DEFECTO PARA VER EL BOARD
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

      {/* Contenedor central de acciones (Dados) */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Dice onOpenShop={() => setIsShopOpen(true)} />
        </div>
      </div>

      {/* Tienda Modal */}
      {isShopOpen && (
        <div className="fixed inset-0 z-[200]">
          <ShopModal onClose={() => setIsShopOpen(false)} />
        </div>
      )}

      {/* Overlay de Minijuego de Orden (elegido por el videojugador) */}
      <OrderMinigameController />

      {/* Modal de elección del videojugador */}
      <VideojugadorEleccionController />

      {/* Overlay de Doble o Nada */}
      <DobleNadaController />

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

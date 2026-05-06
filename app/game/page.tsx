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
import BanqueroRoboModal from "@/features/board/components/BanqueroRoboModal";
import VidenteDadosModal from "@/features/board/components/VidenteDadosModal";
import MinigameResultOverlay from "@/features/board/components/MinigameResultOverlay";
import RuletaUI from "@/features/board/components/RuletaUI";
import PokerUI from "@/features/minigames/components/PokerUI";
import BarreraModal from "@/features/board/components/BarreraModal";

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
  const { state, myPlayer, sendScoreOrden } = useGameContext();

  if (!state.showOrderMinigame) return null;

  const minijuegoType = state.currentOrderMinijuego
    ? (MINIJUEGO_NAME_TO_TYPE[state.currentOrderMinijuego] ?? 'reflejos')
    : 'reflejos';

  return (
    <OrderMinigameOverlay
      minigameType={minijuegoType}
      backendCardIndexes={state.currentOrderMinijuegoDetails?.cartas}
      assignedCardSlot={myPlayer ? myPlayer.turnOrder - 1 : undefined}
      objetivo={state.currentOrderMinijuegoDetails?.objetivo}
      onAction={(result) => sendScoreOrden(result.score as number, result.objetivo)}
      onClose={() => {/* no se puede cerrar manualmente */}}
    />
  );
}

/** Muestra el modal de elección del videojugador (o vista espectador para el resto). */
function VideojugadorEleccionController() {
  const { state, myPlayer, sendIniRound } = useGameContext();

  const isVideojugador = myPlayer?.character === 'videojugador';
  const isWaitingForVideojugadorChoice =
    !isVideojugador &&
    !state.showVideojugadorEleccion &&
    Object.keys(state.players).length > 0 &&
    state.currentTurnOrder === 0 &&
    !state.isAnyoneAnimating &&
    !state.showOrderMinigame &&
    !state.waitingForMinigameResults &&
    !state.pendingMinigameResults &&
    !state.showDobleNada;

  if (!state.showVideojugadorEleccion && !isWaitingForVideojugadorChoice) return null;

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
      onTimeout={isVideojugador
        ? () => {
            if (opciones.length > 0) handleSelect(opciones[0].id);
          }
        : undefined}
    />
  );
}

/** Muestra el overlay de Doble o Nada cuando el jugador cae en la casilla correspondiente. */
function DobleNadaController() {
  const { state } = useGameContext();

  if (!state.showDobleNada && !state.dobleNadaResult) return null;

  return <DobleNadaOverlay />;
}

/** Muestra el modal de robo del banquero. */
function BanqueroRoboController() {
  const { state, playerOrder, sendRoboBanquero } = useGameContext();

  if (!state.showBanqueroModal) return null;

  // Filtrar víctimas: todos los jugadores menos yo mismo
  const targetPlayers = playerOrder
    .filter(p => p.username !== state.myUsername)
    .map(p => ({
      username: p.username,
      character: p.character ?? 'banquero', // fallback
    }));

  return (
    <BanqueroRoboModal
      targetPlayers={targetPlayers}
      onSelect={(targetUser) => sendRoboBanquero(targetUser)}
    />
  );
}

/** Muestra el modal de las tiradas futuras para el vidente. */
function VidenteController() {
  const { state } = useGameContext();

  if (!state.showVidenteModal || !state.videnteTiradas) return null;

  return (
    <VidenteDadosModal
      tiradas={state.videnteTiradas}
    />
  );
}

/** Muestra el scoreboard con los resultados del minijuego de orden. */
function MinigameResultController() {
  const { state, dispatch } = useGameContext();

  // Mientras el jugador espera los resultados del resto (ya envió su score)
  if (state.waitingForMinigameResults && !state.pendingMinigameResults) {
    return (
      <MinigameResultOverlay
        minigameName={state.currentOrderMinijuego ?? 'Minijuego'}
        subtitle=""
        results={[]}
        isLoading
        onClose={() => {}}
      />
    );
  }

  if (!state.pendingMinigameResults) return null;

  const { resultados, minigameName } = state.pendingMinigameResults;

  // Transformar Record<username, {posicion, score}> en array PlayerResult[]
  const resultsArray = Object.entries(resultados).map(([username, data]) => {
    const player = state.players[username];
    return {
      username,
      score: data.score,
      character: player?.character ?? 'banquero', // fallback
      posicion: data.posicion,
    };
  });

  return (
    <MinigameResultOverlay
      minigameName={minigameName}
      subtitle={`Clasificación: ${minigameName}`}
      results={resultsArray}
      onClose={() => dispatch({ type: 'MINIJUEGO_RESULTADOS' })}
    />
  );
}

/** Muestra la ruleta de objetos cuando el jugador cae en la casilla correspondiente. */
function RuletaController() {
  const { state, myPlayer, sendEndRound, dispatch } = useGameContext();

  if (!state.showRuleta || !state.pendingObjetoRuleta) return null;

  const isSpectator = state.pendingObjetoRuleta.user !== myPlayer?.username;

  const handleAction = (result: { name: string; image: string }) => {
    if (!isSpectator) {
      // Limpiar estado y terminar turno (el backend aplica el efecto automáticamente)
      dispatch({ type: 'SET_PENDING_OBJETO_RULETA', data: null });
      dispatch({ type: 'HIDE_RULETA' });
      dispatch({ type: 'SET_ANYONE_ANIMATING', value: false });
      sendEndRound();
    } else {
      // Espectador solo limpia la UI
      dispatch({ type: 'HIDE_RULETA' });
      dispatch({ type: 'SET_ANYONE_ANIMATING', value: false });
    }
  };

  return (
    <RuletaUI 
      targetPrize={state.pendingObjetoRuleta.objeto}
      isSpectator={isSpectator}
      onAction={handleAction}
    />
  );
}

/** Muestra el Dilema del Prisionero cuando dos jugadores coinciden. */
function DilemaController() {
  const { state, sendScoreDilema, dispatch } = useGameContext();

  if (!state.showDilema) return null;

  return (
    <OrderMinigameOverlay
      minigameType="dilema"
      onAction={(result) => sendScoreDilema(result.score as "cooperar" | "traicionar")}
      onClose={() => dispatch({ type: 'HIDE_DILEMA' })}
    />
  );
}

/** Muestra el Poker cuando el jugador cae en la casilla correspondiente. */
function PokerController() {
  const { state, sendEndRound, dispatch } = useGameContext();

  if (!state.showPoker) return null;

  return (
    <PokerUI
      onClose={() => {
        dispatch({ type: 'HIDE_POKER' });
        if (state.awaitingEndRound) {
          sendEndRound();
        }
      }}
    />
  );
}

/** Muestra el modal de la barrera para elegir objetivo. */
function BarreraController() {
  const { state, playerOrder, sendUsarObjeto, dispatch } = useGameContext();

  if (!state.showBarreraModal) return null;

  // Filtrar: todos menos yo y menos el escapista (el backend lo bloquea)
  const targetPlayers = playerOrder
    .filter(p => p.username !== state.myUsername && p.character !== 'escapista')
    .map(p => ({
      username: p.username,
      character: p.character ?? 'banquero',
    }));

  return (
    <BarreraModal
      targetPlayers={targetPlayers}
      onSelect={(targetUser) => {
        sendUsarObjeto('Barrera', targetUser);
        dispatch({ type: 'SET_SHOW_BARRERA_MODAL', value: false });
      }}
      onClose={() => dispatch({ type: 'SET_SHOW_BARRERA_MODAL', value: false })}
    />
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

      {/* Modal de Robo del Banquero */}
      <BanqueroRoboController />

      {/* Modal del Vidente */}
      <VidenteController />

      {/* Scoreboard de resultados del minijuego */}
      <MinigameResultController />

      {/* Ruleta de objetos */}
      <RuletaController />

      {/* Dilema del Prisionero */}
      <DilemaController />

      {/* Mano de Poker */}
      <PokerController />

      {/* Modal de Barrera */}
      <BarreraController />

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

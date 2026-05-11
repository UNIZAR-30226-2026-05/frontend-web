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
import React, { useEffect, useState } from "react";
import OrderMinigameOverlay, { OrderMinigameType, MinigameResultEntry } from "@/features/minigames/components/OrderMinigameOverlay";
import DobleNadaOverlay from "@/features/board/components/DobleNadaOverlay";
import BanqueroRoboModal from "@/features/board/components/BanqueroRoboModal";
import VidenteDadosModal, { TiradaVidente } from "@/features/board/components/VidenteDadosModal";
import MinigameResultOverlay from "@/features/board/components/MinigameResultOverlay";
import RuletaUI from "@/features/board/components/RuletaUI";
import PokerUI from "@/features/minigames/components/PokerUI";
import BarreraModal from "@/features/board/components/BarreraModal";
import GameOverOverlay from "@/features/board/components/GameOverOverlay";
import DilemaPrisioneroUI from "@/features/minigames/components/DilemaPrisioneroUI";
import TurnTimer from "@/features/board/components/TurnTimer";

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
  const { state, myPlayer, sendScoreOrden, dispatch } = useGameContext();

  if (state.showPoker) return null;
  if (state.showRuleta) return null;
  if (!state.showOrderMinigame && !state.waitingForMinigameResults && !state.pendingMinigameResults) return null;

  const minijuegoType = state.currentOrderMinijuego
    ? (MINIJUEGO_NAME_TO_TYPE[state.currentOrderMinijuego] ?? 'reflejos')
    : 'reflejos';

  // Construir array de resultados con info de personaje para el podio inline
  const results: MinigameResultEntry[] | undefined = state.pendingMinigameResults
    ? Object.entries(state.pendingMinigameResults.resultados).map(([username, data]) => ({
        username,
        score: data.score,
        posicion: data.posicion,
        character: state.players[username]?.character ?? 'banquero',
      }))
    : undefined;

  return (
    <OrderMinigameOverlay
      minigameType={minijuegoType}
      minigameName={state.pendingMinigameResults?.minigameName ?? state.currentOrderMinijuego ?? 'Minijuego'}
      description={state.currentOrderMinijuegoDescripcion ?? undefined}
      backendCardIndexes={state.currentOrderMinijuegoDetails?.cartas}
      assignedCardSlot={myPlayer ? myPlayer.turnOrder - 1 : undefined}
      objetivo={state.currentOrderMinijuegoDetails?.objetivo}
      onAction={(result) => sendScoreOrden(result.score as number, result.objetivo)}
      onResultsClosed={() => dispatch({ type: 'MINIJUEGO_RESULTADOS' })}
      waitingForResults={state.waitingForMinigameResults}
      results={results}
    />
  );
}

/** Muestra el modal de elección del videojugador (o vista espectador para el resto). */
function VideojugadorEleccionController() {
  const { state, myPlayer, sendIniRound } = useGameContext();

  if (state.showPoker) return null;
  if (state.showRuleta) return null;

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

  const isSpectator = state.pendingBoardMinigame?.type === 'Doble o Nada' &&
    state.pendingBoardMinigame.user !== state.myUsername;

  if (!state.showDobleNada && !state.dobleNadaResult && !isSpectator) return null;
  // Espectador: esperar a que termine la animación antes de mostrar el banner,
  // pero no ocultar si ya hay resultado (isAnyoneAnimating se reactiva al mostrar resultado)
  if (isSpectator && state.isAnyoneAnimating && !state.dobleNadaResult) return null;

  return <DobleNadaOverlay />;
}

/** Muestra el modal de robo del banquero. */
function BanqueroRoboController() {
  const { state, playerOrder, sendRoboBanquero, isMyTurn, myPlayer, dispatch } = useGameContext();

  useEffect(() => {
    if (state.showPoker) return;
    if (state.showRuleta) return;
    if (isMyTurn && myPlayer?.character === 'banquero' && !state.hasUsedAbility && !state.hasMoved && !state.showBanqueroModal) {
      dispatch({ type: 'SET_SHOW_BANQUERO_MODAL', value: true });
    }
  }, [isMyTurn, myPlayer?.character, state.hasUsedAbility, state.hasMoved, state.showBanqueroModal, state.showPoker, state.showRuleta, dispatch]);

  if (state.showPoker) return null;
  if (state.showRuleta) return null;
  if (!state.showBanqueroModal) return null;

  // Filtrar víctimas: todos los jugadores menos yo mismo
  const targetPlayers = playerOrder
    .filter(p => p.username !== state.myUsername)
    .map(p => ({
      username: p.username,
      character: p.character ?? 'banquero', // fallback
      balance: state.players[p.username]?.balance ?? 0,
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

  if (state.showPoker) return null;
  if (state.showRuleta) return null;
  if (!state.showVidenteModal || !state.videnteTiradas) return null;

  return (
    <VidenteDadosModal
      tiradas={state.videnteTiradas as TiradaVidente[]}
    />
  );
}

/** Muestra el scoreboard con los resultados del minijuego de orden. */
function MinigameResultController() {
  const { state, dispatch } = useGameContext();

  if (state.showPoker) return null;
  if (state.showRuleta) return null;
  // Los resultados de orden se muestran inline dentro del OrderMinigameOverlay
  if (state.showOrderMinigame || state.waitingForMinigameResults) return null;

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

  const handleAction = () => {
    let willAnimateMove = false;
    if (state.bufferedRuletaMove) {
      const user = state.bufferedRuletaMove.user;
      const currentPos = state.players[user]?.position;
      if (currentPos !== state.bufferedRuletaMove.newPos) {
        willAnimateMove = true;
      }
    }

    dispatch({ type: 'FLUSH_RULETA_BUFFER' });
    dispatch({ type: 'SET_PENDING_OBJETO_RULETA', data: null });
    dispatch({ type: 'HIDE_RULETA' });

    // Si no va a haber animación (porque no es un movimiento, porque la distancia es 0, o porque ya se animó),
    // o si somos espectadores (y por tanto no dependemos de enviar el fin de turno),
    // liberamos la animación.
    // Si va a haber animación y somos el jugador activo, la propia animación al terminar llamará a sendEndRound()
    if (!willAnimateMove || isSpectator) {
      dispatch({ type: 'SET_ANYONE_ANIMATING', value: false });
      if (!isSpectator) {
        sendEndRound();
      }
    }
  };

  return (
    <RuletaUI 
      targetPrize={state.pendingObjetoRuleta.objeto}
      onAction={handleAction}
    />
  );
}

/** Muestra el Dilema del Prisionero cuando dos jugadores coinciden. */
function DilemaController() {
  const { state, sendScoreDilema } = useGameContext();

  if (!state.showDilema) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 animate-in fade-in duration-300">
      <DilemaPrisioneroUI
        onAction={(result) => {
          sendScoreDilema(result.score as "cooperar" | "traicionar");
        }}
      />
    </div>
  );
}

/** Vista espectadora del Dilema del Prisionero: banner durante el juego y resultados al final. */
function DilemaSpectatorController() {
  const { state, dispatch } = useGameContext();

  // Solo para espectadores (participantes ven la UI completa)
  if (state.showDilema) return null;

  // Mostrar resultados para espectadores
  if (state.dilemaResultados && state.dilemaRecompensas) {
    const users = Object.keys(state.dilemaResultados);
    return (
      <DilemaSpectatorResultOverlay
        resultados={state.dilemaResultados}
        recompensas={state.dilemaRecompensas}
        users={users}
        onClose={() => dispatch({ type: 'HIDE_DILEMA' })}
      />
    );
  }

  // Mostrar banner mientras se juega
  if (state.dilemaParticipantes && state.dilemaParticipantes.length >= 2) {
    const [p1, p2] = state.dilemaParticipantes;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-[#1A1A2E] border-4 border-[#7C3AED] p-10 flex flex-col items-center gap-6 rounded-xl max-w-md w-full mx-4 font-pixel [filter:drop-shadow(0_0_15px_rgba(124,58,237,0.5))]">
          <h3 className="text-white text-2xl tracking-[0.15em] text-center uppercase drop-shadow-md">
            DILEMA DEL PRISIONERO
          </h3>
          <div className="w-full border-4 border-white/15 bg-black/20 rounded-lg px-6 py-5 text-center">
            <p className="text-[#C084FC] text-sm uppercase tracking-[0.1em] animate-pulse leading-relaxed">
              {`¿${p1.toUpperCase()} y ${p2.toUpperCase()} podrán cooperar o se traicionarán mutuamente?`}
            </p>
          </div>
          <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] text-center">
            Esperando decisión...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

interface DilemaSpectatorResultProps {
  resultados: Record<string, 'cooperar' | 'traicionar'>;
  recompensas: Record<string, number>;
  users: string[];
  onClose: () => void;
}

function DilemaSpectatorResultOverlay({ resultados, recompensas, users, onClose }: DilemaSpectatorResultProps) {
  const { useEffect } = React;
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1A1A2E] border-4 border-[#7C3AED] p-10 flex flex-col items-center gap-6 rounded-xl max-w-md w-full mx-4 font-pixel [filter:drop-shadow(0_0_15px_rgba(124,58,237,0.6))]">
        <h3 className="text-white text-2xl tracking-[0.15em] text-center uppercase drop-shadow-md">
          DILEMA DEL PRISIONERO
        </h3>
        <div className="w-full border-4 border-white/15 bg-black/20 rounded-lg px-6 py-5 flex flex-col gap-3">
          {users.map((u) => {
            const decision = resultados[u];
            const recompensa = recompensas[u] ?? 0;
            const isCooperar = decision === 'cooperar';
            return (
              <div key={u} className="flex items-center justify-between gap-4">
                <span className="text-white/80 text-xs uppercase tracking-wide">{u.toUpperCase()}</span>
                <span className={`text-sm uppercase tracking-wide ${isCooperar ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                  {isCooperar ? 'COOPERÓ' : 'TRAICIONÓ'}
                </span>
                <span className={`text-base ${recompensa > 0 ? 'text-[#4ADE80]' : 'text-white/50'}`}>
                  {recompensa > 0 ? `+${recompensa}¢` : `+0¢`}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-white/60 text-[10px] uppercase tracking-[0.25em] animate-pulse text-center">
          Cerrando en breve...
        </p>
      </div>
    </div>
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

/** Banner de notificación de compra de objeto */
function PurchaseNotificationBanner() {
  const { state } = useGameContext();
  const notif = state.purchaseNotification;
  if (!notif) return null;

  const isLocalUser = notif.user === state.myUsername;
  const subject = isLocalUser ? 'HAS' : `${notif.user.toUpperCase()} HA`;
  const extraLabel =
    notif.objeto === 'Avanzar Casillas' && notif.avanceExtra != null && notif.avanceExtra > 0
      ? ` X${notif.avanceExtra}`
      : '';

  return (
    <div className="fixed top-0 left-0 right-0 z-[600] flex justify-center pointer-events-none">
      <div className="mt-2 px-6 py-3 bg-black/85 border border-white/20 rounded-md shadow-xl">
        <p className="font-pixel text-white text-sm tracking-widest uppercase whitespace-nowrap">
          {subject}{' '}
          <span className="text-white">COMPRADO </span>
          <span className="text-yellow-400">{notif.objeto.toUpperCase()}{extraLabel}</span>
        </p>
      </div>
    </div>
  );
}

/** Muestra la pantalla final del juego */
function GameOverController() {
  const { state, playerOrder } = useGameContext();

  // No mostrar la pantalla final hasta que todas las animaciones hayan terminado
  if (!state.isGameOver || state.isAnyoneAnimating) return null;

  return (
    <GameOverOverlay 
      players={playerOrder.map(p => ({ 
        username: p.username, 
        character: p.character || 'banquero', 
        balance: p.balance 
      }))}
      winnerUsername={state.gameWinner ?? undefined}
      onReturnToMenu={() => {
        window.location.href = '/menu';
      }}
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

      {/* Temporizador de turno (Arriba a la derecha) */}
      <TurnTimer />

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

      {/* Vista espectadora del Dilema del Prisionero */}
      <DilemaSpectatorController />

      {/* Mano de Poker */}
      <PokerController />

      {/* Modal de Barrera */}
      <BarreraController />

      {/* Overlay de Minijuegos de Orden */}
      {activeMinigame && (
        <OrderMinigameOverlay 
          minigameType={activeMinigame} 
          minigameName={activeMinigame}
          onAction={handleMinigameAction}
          onResultsClosed={() => setActiveMinigame(null)}
        />
      )}

      {/* Pantalla Final de Partida */}
      <GameOverController />

      {/* Banner de compra de objeto */}
      <PurchaseNotificationBanner />

    </main>
    </GameProvider>
  );
}

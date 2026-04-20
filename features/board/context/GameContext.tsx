"use client";

import React, { createContext, useContext, useEffect, useReducer, useCallback, useState, useRef } from 'react';
import { getGameSocket } from '@/lib/gameSocket';
import type { DiceType } from '@/features/board/components/Dice';

// -------------------------------------------------------------------
// Mapa de nombres WS (Banquero, Videojugador…) al id local (banquero…)
// -------------------------------------------------------------------
const WS_CHAR_TO_ROLE_ID: Record<string, string> = {
  Banquero: 'banquero',
  Videojugador: 'videojugador',
  Escapista: 'escapista',
  Vidente: 'vidente',
};

const SWAP_POSITIONS_MESSAGE = 'Posiciones intercambiadas con otro jugador aleatoriamente';

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------
export interface GamePlayer {
  username: string;
  character: string | null;       // id local: 'banquero', etc.
  characterWsName: string | null; // nombre WS: 'Banquero', etc.
  position: number;               // índice en BOARD_COORDS (0-based)
  balance: number;                // monedas actuales
  turnOrder: number;              // 1-4, posición en el orden actual
  diceType: DiceType;             // dado especial que le corresponde
}

interface SwapAnimationEvent {
  id: number;
  actor: string;
  otherUser: string;
}

interface GameState {
  players: Record<string, GamePlayer>;
  /** Qué posición del orden está jugando ahora (1–4). 0 = entre rondas. */
  currentTurnOrder: number;
  /** El jugador local ya tiró los dados esta ronda */
  hasMoved: boolean;
  /** El jugador local movió y debe enviar end_round */
  awaitingEndRound: boolean;
  /** Últimos dados tirados (de cualquier jugador) */
  lastDice: { dado1: number; dado2: number; user: string; diceType: DiceType } | null;
  myUsername: string | null;
  /** Mostrar el minijuego de reflejos para determinar el orden de la siguiente ronda */
  showOrderMinigame: boolean;
  /** El videojugador está eligiendo el minijuego de orden */
  showVideojugadorEleccion: boolean;
  /** Opciones enviadas por el backend para que el videojugador elija */
  videojugadorOpciones: { nombre: string; descripcion: string | null }[];
  /** Nombre del minijuego de orden actualmente en curso (de ini_minijuego) */
  currentOrderMinijuego: string | null;
  /** Mostrar overlay de Doble o Nada */
  showDobleNada: boolean;
  /** El jugador local cayó en una casilla de movimiento negativo este turno */
  landedOnNegativeMove: boolean;
  /** El jugador local cayó en una casilla de barrera este turno */
  landedOnBarrera: boolean;
  /** Objetos comprados en el turno actual (nombre -> cantidad), persiste entre aperturas de la tienda */
  purchasedItems: Record<string, number>;
  /** Turnos de penalización restantes para el jugador local (casilla barrera) */
  penaltyTurns: number;
  /** true mientras cualquier ficha esté animándose en el tablero */
  isAnyoneAnimating: boolean;
  /** Último intercambio instantáneo entre dos jugadores del tablero */
  lastSwapEvent: SwapAnimationEvent | null;
}

// -------------------------------------------------------------------
// Acciones del reducer
// -------------------------------------------------------------------
export type Action =
  | { type: 'INIT'; myUsername: string | null; lobbyPlayers: string[] }
  | { type: 'PLAYER_SELECTED'; user: string; character: string }
  | { type: 'PLAYER_MOVED_DICE'; user: string; newPos: number; dado1: number; dado2: number }
  | { type: 'PLAYER_MOVED_FORCED'; user: string; newPos: number }
  | { type: 'PLAYERS_SWAPPED'; actor: string; actorPos: number; otherUser: string; otherPos: number; swapEventId: number }
  | { type: 'BALANCES_CHANGED'; balances: Record<string, number> }
  | { type: 'MINIJUEGO_RESULTADOS'; nuevo_orden: Record<string, number> }
  | { type: 'RECONNECT_SUCCESS'; boardState: { positions?: Record<string, number>; balances?: Record<string, number>; characters?: Record<string, string>; order?: Record<string, number> } }
  | { type: 'LOCAL_END_ROUND' }
  | { type: 'SHOW_ORDER_MINIGAME' }
  | { type: 'HIDE_ORDER_MINIGAME' }
  | { type: 'SHOW_VIDEOJUGADOR_ELECCION'; opciones: { nombre: string; descripcion: string | null }[] }
  | { type: 'HIDE_VIDEOJUGADOR_ELECCION' }
  | { type: 'SET_CURRENT_ORDER_MINIJUEGO'; minijuego: string }
  | { type: 'SHOW_DOBLE_NADA' }
  | { type: 'HIDE_DOBLE_NADA' }
  | { type: 'SET_CASILLA_TIPO'; casilla: 'mov_negativo' | 'barrera' | 'none' }
  | { type: 'MARK_ITEM_PURCHASED'; item: string }
  | { type: 'SET_PENALTY_TURNS'; turns: number }
  | { type: 'CLEAR_PENALTY_TURNS' }
  | { type: 'SET_ANYONE_ANIMATING'; value: boolean }
  /** Otro jugador saltó su turno bloqueado (el backend hizo broadcast de penalizacion_actualizada) */
  | { type: 'REMOTE_SKIPPED'; user: string }
  | { type: 'DEBUG_SET_TURN_ORDER'; order: number };


// -------------------------------------------------------------------
// Reducer
// -------------------------------------------------------------------
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT': {
      const players: Record<string, GamePlayer> = {};
      action.lobbyPlayers.forEach((username, index) => {
        players[username] = {
          username,
          character: null,
          characterWsName: null,
          position: 0,
          balance: 1, // inicio con 1 modneda
          turnOrder: index + 1,
          diceType: 'normal',
        };
      });
      return { ...state, players, currentTurnOrder: 1, myUsername: action.myUsername, lastSwapEvent: null };
    }

    case 'PLAYER_SELECTED': {
      const player = state.players[action.user];
      if (!player) return state;
      const roleId = WS_CHAR_TO_ROLE_ID[action.character] ?? action.character.toLowerCase();
      return {
        ...state,
        players: {
          ...state.players,
          [action.user]: { ...player, character: roleId, characterWsName: action.character },
        },
      };
    }

    case 'PLAYER_MOVED_DICE': {
      const player = state.players[action.user];
      if (!player) return state;

      const isLocalPlayer = action.user === state.myUsername;
      const nextTurnOrder = player.turnOrder + 1;
      const totalPlayers = Object.keys(state.players).length;
      // Si todos jugaron -> 0 (esperando minijuego/nueva ronda)
      const newCurrentTurnOrder = nextTurnOrder <= totalPlayers ? nextTurnOrder : 0;

      return {
        ...state,
        players: {
          ...state.players,
          [action.user]: { ...player, position: action.newPos },
        },
        currentTurnOrder: newCurrentTurnOrder,
        hasMoved: isLocalPlayer ? true : state.hasMoved,
        awaitingEndRound: isLocalPlayer ? true : state.awaitingEndRound,
        isAnyoneAnimating: true,
        lastDice: {
          dado1: action.dado1,
          dado2: action.dado2,
          user: action.user,
          diceType: player.diceType,
        },
      };
    }

    case 'PLAYER_MOVED_FORCED': {
      const player = state.players[action.user];
      if (!player) return state;
      return {
        ...state,
        isAnyoneAnimating: true,
        players: {
          ...state.players,
          [action.user]: { ...player, position: action.newPos },
        },
      };
    }

    case 'PLAYERS_SWAPPED': {
      const actor = state.players[action.actor];
      const otherPlayer = state.players[action.otherUser];
      if (!actor || !otherPlayer) return state;
      return {
        ...state,
        isAnyoneAnimating: true,
        lastSwapEvent: {
          id: action.swapEventId,
          actor: action.actor,
          otherUser: action.otherUser,
        },
        players: {
          ...state.players,
          [action.actor]: { ...actor, position: action.actorPos },
          [action.otherUser]: { ...otherPlayer, position: action.otherPos },
        },
      };
    }

    case 'BALANCES_CHANGED': {
      const updatedPlayers = { ...state.players };
      for (const [username, balance] of Object.entries(action.balances)) {
        if (updatedPlayers[username]) {
          updatedPlayers[username] = { ...updatedPlayers[username], balance };
        }
      }
      return { ...state, players: updatedPlayers };
    }

    case 'MINIJUEGO_RESULTADOS': {
      const updatedPlayers = { ...state.players };
      for (const [username, order] of Object.entries(action.nuevo_orden)) {
        if (updatedPlayers[username]) {
          const diceType: DiceType =
            order === 1 ? 'oro' :
            order === 2 ? 'plata' :
            order === 3 ? 'bronce' : 'normal';
          updatedPlayers[username] = { ...updatedPlayers[username], turnOrder: order, diceType };
        }
      }
      return {
        ...state,
        players: updatedPlayers,
        currentTurnOrder: 1,
        hasMoved: false,
        awaitingEndRound: false,
        showOrderMinigame: false,
        showVideojugadorEleccion: false,
        videojugadorOpciones: [],
        currentOrderMinijuego: null,
        landedOnBarrera: false,
        showDobleNada: false,
        purchasedItems: {},
        isAnyoneAnimating: false,
      };
    }

    case 'RECONNECT_SUCCESS': {
      const { positions, balances, characters, order } = action.boardState;
      const updatedPlayers = { ...state.players };
      for (const username of Object.keys(updatedPlayers)) {
        const updates: Partial<GamePlayer> = {};
        if (positions?.[username] !== undefined) updates.position = positions[username];
        if (balances?.[username] !== undefined) updates.balance = balances[username];
        if (characters?.[username]) {
          const charWsName = characters[username];
          updates.character = WS_CHAR_TO_ROLE_ID[charWsName] ?? charWsName.toLowerCase();
          updates.characterWsName = charWsName;
        }
        if (order?.[username] !== undefined) {
          const o = order[username];
          updates.turnOrder = o;
          updates.diceType = o === 1 ? 'oro' : o === 2 ? 'plata' : o === 3 ? 'bronce' : 'normal';
        }
        if (Object.keys(updates).length > 0) {
          updatedPlayers[username] = { ...updatedPlayers[username], ...updates };
        }
      }
      return { ...state, players: updatedPlayers };
    }

    case 'LOCAL_END_ROUND': {
      // Cuando el jugador tiró dados, PLAYER_MOVED_DICE ya avanzó currentTurnOrder.
      // Cuando el jugador pasó de turno sin tirar (bloqueado), debemos avanzarlo aquí,
      // o el siguiente jugador nunca verá isMyTurn = true y el juego queda congelado.
      const myPlayer = state.players[state.myUsername ?? ''];
      let newCurrentTurnOrder = state.currentTurnOrder;
      if (!state.hasMoved && myPlayer) {
        const totalPlayers = Object.keys(state.players).length;
        const nextOrder = myPlayer.turnOrder + 1;
        newCurrentTurnOrder = nextOrder <= totalPlayers ? nextOrder : 0;
      }
      // Si el jugador NO movió (turno bloqueado), consumimos un turno de penalización.
      // Si SÍ movió (acaba de caer en barrera), la penalización empieza el turno siguiente.
      // El backend confirmará el valor real con penalizacion_actualizada.
      const newPenaltyTurns =
        !state.hasMoved && state.penaltyTurns > 0
          ? state.penaltyTurns - 1
          : state.penaltyTurns;
      return {
        ...state,
        currentTurnOrder: newCurrentTurnOrder,
        awaitingEndRound: false,
        landedOnBarrera: false,
        showDobleNada: false,
        purchasedItems: {},
        penaltyTurns: newPenaltyTurns,
        // Si el jugador pasó sin moverse (bloqueado), ninguna animación está pendiente.
        // Garantizamos isAnyoneAnimating = false para que el siguiente pueda tirar de inmediato.
        isAnyoneAnimating: state.hasMoved ? state.isAnyoneAnimating : false,
      };
    }

    case 'SET_CASILLA_TIPO':
      return {
        ...state,
        landedOnBarrera: action.casilla === 'barrera',
        landedOnNegativeMove: action.casilla === 'mov_negativo',
      };

    case 'MARK_ITEM_PURCHASED':
      return {
        ...state,
        purchasedItems: {
          ...state.purchasedItems,
          [action.item]: (state.purchasedItems[action.item] ?? 0) + 1,
        },
      };

    case 'SET_PENALTY_TURNS':
      return { ...state, penaltyTurns: action.turns };

    case 'CLEAR_PENALTY_TURNS':
      return { ...state, penaltyTurns: 0, landedOnBarrera: false };

    case 'SET_ANYONE_ANIMATING':
      return { ...state, isAnyoneAnimating: action.value };

    case 'REMOTE_SKIPPED': {
      // El jugador remoto saltó su turno bloqueado (no tiró dados).
      // Avanzamos currentTurnOrder solo si aún apunta a ese jugador;
      // si ya apuntaba a otro es que esto llegó después de un player_moved y no hace falta.
      const skipped = state.players[action.user];
      if (!skipped || skipped.turnOrder !== state.currentTurnOrder) return state;
      const totalPlayers = Object.keys(state.players).length;
      const next = skipped.turnOrder + 1;
      return {
        ...state,
        currentTurnOrder: next <= totalPlayers ? next : 0,
        isAnyoneAnimating: false,
      };
    }

    case 'SHOW_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: true };

    case 'HIDE_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: false, currentOrderMinijuego: null };

    case 'SHOW_VIDEOJUGADOR_ELECCION':
      return { ...state, showVideojugadorEleccion: true, videojugadorOpciones: action.opciones };

    case 'HIDE_VIDEOJUGADOR_ELECCION':
      return { ...state, showVideojugadorEleccion: false, videojugadorOpciones: [] };

    case 'SET_CURRENT_ORDER_MINIJUEGO':
      return { ...state, currentOrderMinijuego: action.minijuego };

    case 'SHOW_DOBLE_NADA':
      return { ...state, showDobleNada: true };
    
    case 'HIDE_DOBLE_NADA':
      return { ...state, showDobleNada: false };

    case 'DEBUG_SET_TURN_ORDER':
      return { ...state, currentTurnOrder: action.order, hasMoved: false, awaitingEndRound: false };

    default:
      return state;
  }
}

const initialState: GameState = {
  players: {},
  currentTurnOrder: 1,
  hasMoved: false,
  awaitingEndRound: false,
  lastDice: null,
  myUsername: null,
  showOrderMinigame: false,
  showVideojugadorEleccion: false,
  videojugadorOpciones: [],
  currentOrderMinijuego: null,
  showDobleNada: false,
  landedOnNegativeMove: false,
  landedOnBarrera: false,
  penaltyTurns: 0,
  purchasedItems: {},
  isAnyoneAnimating: false,
  lastSwapEvent: null,
};

// -------------------------------------------------------------------
// Interfaz del contexto
// -------------------------------------------------------------------
export interface GameContextType {
  state: GameState;
  /** true cuando es el turno del jugador local y aún no ha movido */
  isMyTurn: boolean;
  myPlayer: GamePlayer | null;
  /** Jugadores ordenados por turnOrder ascendente */
  playerOrder: GamePlayer[];
  sendMovePlayer: () => void;
  sendEndRound: () => void;
  /** Enviar puntuación del minijuego de reflejos al backend y cerrar el overlay */
  sendScoreReflejos: (reactionTimeMs: number) => void;
  /** Enviar puntuación del minijuego de orden elegido por el videojugador */
  sendScoreOrden: (score: number) => void;
  /** El videojugador envía ini_round con el minijuego elegido */
  sendIniRound: (minijuego: string, descripcion: string) => void;
  /** Cerrar el overlay de Doble o Nada */
  closeDobleNada: () => void;
  /** Registrar la compra de un objeto en el turno actual */
  markItemPurchased: (item: string) => void;
  /** BoardOverlay llama a esto cuando termina la cadena de animación de un jugador.
   *  isLocalPlayer=true → si procede, se envía end_round automáticamente. */
  notifyAnimationEnded: (isLocalPlayer: boolean) => void;
  /** true mientras cualquier ficha esté animándose en el tablero */
  isAnyoneAnimating: boolean;

  /** Dispatcher para depuración y casos avanzados */
  dispatch: React.Dispatch<Action>;

}

export const GameContext = createContext<GameContextType | null>(null);

export function useGameContext(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext debe usarse dentro de <GameProvider>');
  return ctx;
}

// -------------------------------------------------------------------
// Provider
// -------------------------------------------------------------------
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const swapEventIdRef = useRef(0);

  // Auto-dismiss del toast de error tras 4 segundos
  useEffect(() => {
    if (!errorToast) return;
    const timer = setTimeout(() => setErrorToast(null), 4000);
    return () => clearTimeout(timer);
  }, [errorToast]);

  // Inicialización desde sessionStorage (solo cliente)
  useEffect(() => {
    const myUsername = sessionStorage.getItem('username');
    const lobbyRaw = sessionStorage.getItem('lobbyPlayers');
    if (!lobbyRaw) return;
    try {
      const lobbyPlayers = JSON.parse(lobbyRaw) as unknown;
      if (Array.isArray(lobbyPlayers) && lobbyPlayers.length > 0) {
        dispatch({ type: 'INIT', myUsername, lobbyPlayers: lobbyPlayers as string[] });
      }
    } catch {
      console.error('GameProvider: error al parsear lobbyPlayers');
    }
  }, []);



  // Listener de mensajes WebSocket
  useEffect(() => {
    const ws = getGameSocket();
    if (!ws) return;

    // Rastrea qué jugador acaba de mover para saber si tipo_casilla es del jugador local
    let lastMovedUser: string | null = null;
    const pendingSwapMoves: { user: string; newPos: number }[] = [];

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;

        // Errores del backend (sin campo type, con campo error)
        if ('error' in data && typeof data.error === 'string') {
          setErrorToast(data.error);
          return;
        }

        switch (data.type as string) {
          case 'player_selected': {
            const user = data.user as string;
            const character = data.character as string;
            dispatch({ type: 'PLAYER_SELECTED', user, character });
            break;
          }

          case 'player_moved': {
            const user = data.user as string;
            const newPos = data.nueva_casilla as number;
            lastMovedUser = user;
            if ('dado1' in data && 'dado2' in data) {
              pendingSwapMoves.length = 0;
              dispatch({
                type: 'PLAYER_MOVED_DICE',
                user,
                newPos,
                dado1: data.dado1 as number,
                dado2: data.dado2 as number,
              });
            } else if (data.message === SWAP_POSITIONS_MESSAGE) {
              pendingSwapMoves.push({ user, newPos });
              if (pendingSwapMoves.length === 2) {
                const [actorMove, otherMove] = pendingSwapMoves;
                pendingSwapMoves.length = 0;
                swapEventIdRef.current += 1;
                dispatch({
                  type: 'PLAYERS_SWAPPED',
                  actor: actorMove.user,
                  actorPos: actorMove.newPos,
                  otherUser: otherMove.user,
                  otherPos: otherMove.newPos,
                  swapEventId: swapEventIdRef.current,
                });
              }
            } else {
              pendingSwapMoves.length = 0;
              dispatch({ type: 'PLAYER_MOVED_FORCED', user, newPos });
            }
            break;
          }

          case 'balances_changed': {
            dispatch({
              type: 'BALANCES_CHANGED',
              balances: data.balances as Record<string, number>,
            });
            break;
          }

          case 'minijuego_resultados': {
            dispatch({
              type: 'MINIJUEGO_RESULTADOS',
              nuevo_orden: data.nuevo_orden as Record<string, number>,
            });
            break;
          }

          case 'choose_minijuego': {
            const opciones = data.minijuegos as { nombre: string; descripcion: string | null }[];
            dispatch({ type: 'SHOW_VIDEOJUGADOR_ELECCION', opciones });
            break;
          }

          case 'ini_minijuego': {
            // Los minijuegos de orden llegan con estado_partida/detalles.
            if ('estado_partida' in data) {
              const minijuego = data.minijuego as string;
              dispatch({ type: 'HIDE_VIDEOJUGADOR_ELECCION' });
              dispatch({ type: 'SET_CURRENT_ORDER_MINIJUEGO', minijuego });
              dispatch({ type: 'SHOW_ORDER_MINIGAME' });
            }
            break;
          }

          case 'tipo_casilla': {
            const myUsername = sessionStorage.getItem('username');
            if (lastMovedUser === myUsername) {
              const casilla = data.casilla as string;
              const extra = data.extra as number;
              if (casilla === 'barrera') {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'barrera' });
                if (extra > 0) {
                  dispatch({ type: 'SET_PENALTY_TURNS', turns: extra });
                }
              } else if (casilla === 'mov' && extra < 0) {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'mov_negativo' });
              } else {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'none' });
              }
            }
            break;
          }

          case 'minijuego_casilla': {
            const myUsername = sessionStorage.getItem('username');
            if (lastMovedUser === myUsername && data.minijuego === 'Doble o Nada') {
              dispatch({ type: 'SHOW_DOBLE_NADA' });
            }
            break;
          }

          case 'penalizacion_actualizada': {
            const myUsername = sessionStorage.getItem('username');
            const affectedUser = data.user as string;
            if (affectedUser === myUsername) {
              // Actualizar los turnos de penalización del jugador local
              dispatch({ type: 'SET_PENALTY_TURNS', turns: data.penalizacion as number });
            } else {
              // Otro jugador saltó su turno bloqueado → avanzar currentTurnOrder si toca
              dispatch({ type: 'REMOTE_SKIPPED', user: affectedUser });
            }
            break;
          }

          case 'penalizacion_eliminada': {
            const myUsername = sessionStorage.getItem('username');
            if ((data.user as string) === myUsername) {
              dispatch({ type: 'CLEAR_PENALTY_TURNS' });
            }
            break;
          }
        }
      } catch {
        // Mensaje no-JSON u otros errores → ignorar
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, []);

  // Acciones enviadas al WebSocket
  const sendMovePlayer = useCallback(() => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: 'move_player' }));
  }, []);

  const sendEndRound = useCallback(() => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: 'end_round' }));
    dispatch({ type: 'LOCAL_END_ROUND' });
  }, []);

  const markItemPurchased = useCallback((item: string) => {
    dispatch({ type: 'MARK_ITEM_PURCHASED', item });
  }, []);

  // Ref siempre actualizado para leer el estado más reciente sin crear closures obsoletas.
  const awaitingEndRoundRef = useRef(false);
  useEffect(() => {
    awaitingEndRoundRef.current = state.awaitingEndRound;
  }, [state.awaitingEndRound]);

  /** ms extra tras terminar la animación antes de desbloquear el botón del siguiente jugador */
  const POST_ANIMATION_DELAY_MS = 800;

  /** Llamado por BoardOverlay al finalizar la cadena de animación de un jugador.
   *  Si es el jugador local y está esperando end_round, lo envía automáticamente. */
  const notifyAnimationEnded = useCallback((isLocalPlayer: boolean) => {
    if (isLocalPlayer && awaitingEndRoundRef.current) {
      sendEndRound();
    }
    // Pequeño delay extra antes de desbloquear el botón del siguiente jugador
    setTimeout(() => {
      dispatch({ type: 'SET_ANYONE_ANIMATING', value: false });
    }, POST_ANIMATION_DELAY_MS);
  }, [sendEndRound]);

  const sendScoreReflejos = useCallback((reactionTimeMs: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score: reactionTimeMs * 1000 },
    }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
  }, []);

  const sendScoreOrden = useCallback((score: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // Reflejos: el backend espera ms*1000. El resto de minijuegos usan el score directo.
    const minijuego = state.currentOrderMinijuego;
    const payload = minijuego === 'Reflejos'
      ? { score: score * 1000 }
      : { score };
    ws.send(JSON.stringify({ action: 'score_minijuego', payload }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
  }, [state.currentOrderMinijuego]);

  const sendIniRound = useCallback((minijuego: string, descripcion: string) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: 'ini_round', payload: { minijuego, descripcion } }));
    dispatch({ type: 'HIDE_VIDEOJUGADOR_ELECCION' });
  }, []);

  const closeDobleNada = useCallback(() => {
    dispatch({ type: 'HIDE_DOBLE_NADA' });
  }, []);

  // Datos derivados
  const myPlayer = state.myUsername ? (state.players[state.myUsername] ?? null) : null;
  const isMyTurn =
    myPlayer !== null &&
    myPlayer.turnOrder === state.currentTurnOrder &&
    !state.hasMoved;
  const playerOrder = Object.values(state.players).sort((a, b) => a.turnOrder - b.turnOrder);

  return (
        <GameContext.Provider value={{ state, isMyTurn, myPlayer, playerOrder, sendMovePlayer, sendEndRound, sendScoreReflejos, sendScoreOrden, sendIniRound, closeDobleNada, markItemPurchased, notifyAnimationEnded, isAnyoneAnimating: state.isAnyoneAnimating, dispatch }}>



      {children}
      {errorToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-red-900 border-2 border-red-400 px-5 py-3 shadow-lg animate-in slide-in-from-bottom duration-300">
          <span className="text-red-300 text-lg select-none">⚠</span>
          <p className="font-pixel text-white text-xs tracking-wide">{errorToast}</p>
          <button
            onClick={() => setErrorToast(null)}
            className="ml-2 text-red-300 hover:text-white font-bold text-base leading-none"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </GameContext.Provider>
  );
}

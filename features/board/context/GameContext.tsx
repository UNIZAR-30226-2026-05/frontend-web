"use client";

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
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
}

// -------------------------------------------------------------------
// Acciones del reducer
// -------------------------------------------------------------------
export type Action =
  | { type: 'INIT'; myUsername: string | null; lobbyPlayers: string[] }
  | { type: 'PLAYER_SELECTED'; user: string; character: string }
  | { type: 'PLAYER_MOVED_DICE'; user: string; newPos: number; dado1: number; dado2: number }
  | { type: 'PLAYER_MOVED_FORCED'; user: string; newPos: number }
  | { type: 'BALANCES_CHANGED'; balances: Record<string, number> }
  | { type: 'MINIJUEGO_RESULTADOS'; nuevo_orden: Record<string, number> }
  | { type: 'RECONNECT_SUCCESS'; boardState: { positions?: Record<string, number>; balances?: Record<string, number>; characters?: Record<string, string>; order?: Record<string, number> } }
  | { type: 'LOCAL_END_ROUND' }
  | { type: 'SHOW_ORDER_MINIGAME' }
  | { type: 'HIDE_ORDER_MINIGAME' }
  | { type: 'SHOW_DOBLE_NADA' }
  | { type: 'HIDE_DOBLE_NADA' }
  | { type: 'SET_CASILLA_TIPO'; casilla: 'mov_negativo' | 'barrera' | 'none' }
  | { type: 'MARK_ITEM_PURCHASED'; item: string }
  | { type: 'SET_PENALTY_TURNS'; turns: number }
  | { type: 'CLEAR_PENALTY_TURNS' }
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
      return { ...state, players, currentTurnOrder: 1, myUsername: action.myUsername };
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

      return {
        ...state,
        players: {
          ...state.players,
          [action.user]: { ...player, position: action.newPos },
        },
        // MANTENER el currentTurnOrder hasta que el jugador envíe end_round o el backend cambie el turno
        hasMoved: isLocalPlayer ? true : state.hasMoved,
        awaitingEndRound: isLocalPlayer ? true : state.awaitingEndRound,
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
        players: {
          ...state.players,
          [action.user]: { ...player, position: action.newPos },
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
        landedOnBarrera: false,
        showDobleNada: false,
        purchasedItems: {},
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
      const myPlayer = state.players[state.myUsername ?? ''];
      let newCurrentTurnOrder = state.currentTurnOrder;
      if (!state.hasMoved && myPlayer) {
        const totalPlayers = Object.keys(state.players).length;
        const nextOrder = myPlayer.turnOrder + 1;
        newCurrentTurnOrder = nextOrder <= totalPlayers ? nextOrder : 0;
      }
      return {
        ...state,
        currentTurnOrder: newCurrentTurnOrder,
        awaitingEndRound: false,
        landedOnBarrera: false,
        showDobleNada: false,
        purchasedItems: {},
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

    case 'SHOW_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: true };

    case 'HIDE_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: false };

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
  showDobleNada: false,
  landedOnNegativeMove: false,
  landedOnBarrera: false,
  penaltyTurns: 0,
  purchasedItems: {},
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
  /** Cerrar el overlay de Doble o Nada */
  closeDobleNada: () => void;
  /** Registrar la compra de un objeto en el turno actual */
  markItemPurchased: (item: string) => void;
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

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as Record<string, unknown>;

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
              dispatch({
                type: 'PLAYER_MOVED_DICE',
                user,
                newPos,
                dado1: data.dado1 as number,
                dado2: data.dado2 as number,
              });
            } else {
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
            const ws = getGameSocket();
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                action: 'ini_round',
                payload: { minijuego: 'Reflejos', descripcion: 'Reacciona en cuanto cambie el color' },
              }));
            }
            break;
          }

          case 'ini_minijuego':
            dispatch({ type: 'SHOW_ORDER_MINIGAME' });
            break;

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
              } else if (casilla === 'mov_negativo') {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'mov_negativo' });
              } else {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'none' });
              }
            }
            break;
          }

          case 'minijuego_casilla': {
            const myUsername = sessionStorage.getItem('username');
            if (lastMovedUser === myUsername && data.minijuego === 'Doble_Nada') {
              dispatch({ type: 'SHOW_DOBLE_NADA' });
            }
            break;
          }

          case 'penalizacion_actualizada': {
            const myUsername = sessionStorage.getItem('username');
            if ((data.user as string) === myUsername) {
              dispatch({ type: 'SET_PENALTY_TURNS', turns: data.penalizacion as number });
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

  const sendScoreReflejos = useCallback((reactionTimeMs: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score: reactionTimeMs * 1000 },
    }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
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
    <GameContext.Provider value={{ state, isMyTurn, myPlayer, playerOrder, sendMovePlayer, sendEndRound, sendScoreReflejos, closeDobleNada, markItemPurchased, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

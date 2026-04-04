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
  /** El jugador local cayó en una casilla de movimiento negativo este turno */
  landedOnNegativeMove: boolean;
  /** El jugador local cayó en una casilla de barrera este turno */
  landedOnBarrera: boolean;
}

// -------------------------------------------------------------------
// Acciones del reducer
// -------------------------------------------------------------------
type Action =
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
  | { type: 'SET_CASILLA_TIPO'; casilla: 'mov_negativo' | 'barrera' | 'none' };

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
      const nextTurnOrder = player.turnOrder + 1;
      const totalPlayers = Object.keys(state.players).length;
      // Si todos jugaron → 0 (esperando minijuego/nueva ronda)
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
        landedOnNegativeMove: false,
        landedOnBarrera: false,
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

    case 'LOCAL_END_ROUND':
      return { ...state, awaitingEndRound: false, landedOnNegativeMove: false, landedOnBarrera: false };

    case 'SET_CASILLA_TIPO':
      return {
        ...state,
        landedOnNegativeMove: action.casilla === 'mov_negativo',
        landedOnBarrera: action.casilla === 'barrera',
      };

    case 'SHOW_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: true };

    case 'HIDE_ORDER_MINIGAME':
      return { ...state, showOrderMinigame: false };

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
  landedOnNegativeMove: false,
  landedOnBarrera: false,
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
}

const GameContext = createContext<GameContextType | null>(null);

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
            // Guardar personaje propio en sessionStorage
            const myUsername = sessionStorage.getItem('username');
            if (user === myUsername) {
              const roleId = WS_CHAR_TO_ROLE_ID[character] ?? character.toLowerCase();
              sessionStorage.setItem('myCharacter', roleId);
            }
            break;
          }

          case 'player_moved': {
            const user = data.user as string;
            const newPos = data.nueva_casilla as number;
            lastMovedUser = user;
            // Si trae dado1/dado2 es un movimiento por tirada normal
            // Si no, es un movimiento forzado por casilla de movimiento
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

          case 'reconnect_success': {
            const board = data.current_board as {
              positions?: Record<string, number>;
              balances?: Record<string, number>;
              characters?: Record<string, string>;
              order?: Record<string, number>;
            } | undefined;
            if (board) {
              dispatch({ type: 'RECONNECT_SUCCESS', boardState: board });
            }
            break;
          }

          case 'choose_minijuego': {
            // No se muestra UI de elección: auto-responder siempre con Reflejos
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
              if (casilla === 'mov' && extra < 0) {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'mov_negativo' });
              } else if (casilla === 'barrera') {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'barrera' });
              } else {
                dispatch({ type: 'SET_CASILLA_TIPO', casilla: 'none' });
              }
            }
            break;
          }

          // Mensajes de casillas especiales: ignorados intencionalmente
          case 'intercambiar_objeto':
          case 'obtener_objeto':
          case 'minijuego_casilla':
          case 'inventory_updated':
          case 'objeto_usado':
          // Habilidades de personaje del vidente: ignoradas intencionalmente
          case 'dice_shown':
            break;
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
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket no disponible para move_player');
      return;
    }
    ws.send(JSON.stringify({ action: 'move_player' }));
  }, []);

  const sendEndRound = useCallback(() => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket no disponible para end_round');
      return;
    }
    ws.send(JSON.stringify({ action: 'end_round' }));
    dispatch({ type: 'LOCAL_END_ROUND' });
  }, []);

  const sendScoreReflejos = useCallback((reactionTimeMs: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket no disponible para score_minijuego');
      return;
    }
    // El backend espera ms * 1000 para reflejos
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score: reactionTimeMs * 1000 },
    }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
  }, []);

  // Datos derivados
  const myPlayer = state.myUsername ? (state.players[state.myUsername] ?? null) : null;
  const isMyTurn =
    myPlayer !== null &&
    myPlayer.turnOrder === state.currentTurnOrder &&
    !state.hasMoved;
  const playerOrder = Object.values(state.players).sort((a, b) => a.turnOrder - b.turnOrder);

  return (
    <GameContext.Provider value={{ state, isMyTurn, myPlayer, playerOrder, sendMovePlayer, sendEndRound, sendScoreReflejos }}>
      {children}
    </GameContext.Provider>
  );
}

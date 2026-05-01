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

interface PendingBoardMinigame {
  type: 'Doble o Nada' | 'Dilema del Prisionero' | 'Mano de Poker';
  user: string;
}

// -------------------------------------------------------------------
// Poker: tipos y conversión de cartas backend → frontend
// -------------------------------------------------------------------
export interface PokerCard {
  suit: string;   // "hearts" | "diamonds" | "spades" | "clubs"
  rank: number;   // 1–13
}

interface BackendCard {
  valor: string;  // "2".."10", "jota", "reina", "rey", "as"
  palo: string;   // "picas", "corazones", "treboles", "diamantes"
}

const PALO_MAP: Record<string, string> = {
  picas: 'spades',
  corazones: 'hearts',
  treboles: 'clubs',
  diamantes: 'diamonds',
};

const VALOR_MAP: Record<string, number> = {
  as: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, jota: 11, reina: 12, rey: 13,
};

/** Convierte una carta del formato backend {valor,palo} al formato UI {suit,rank}. */
function mapBackendCard(c: BackendCard): PokerCard {
  return {
    suit: PALO_MAP[c.palo] ?? c.palo,
    rank: VALOR_MAP[c.valor] ?? (parseInt(c.valor) || 1),
  };
}

export interface PokerResultado {
  idGanadores: string[];
  boteGanado: number;
  resultadosOrdenados: { user: string; mano: string; cartas: PokerCard[] }[];
  mesaCompleta: PokerCard[];
}

export interface PokerState {
  fase: string;                    // "Pre-Flop", "Flop", "Turn", "River", "Resultados"
  misCartas: PokerCard[];          // las 2 cartas del jugador local
  mesaVisible: PokerCard[];        // cartas comunitarias reveladas
  bote: number;                    // bote acumulado
  apuestaObjetivo: number;         // apuesta mínima a igualar
  jugadoresActivos: string[];      // usernames que no se han retirado
  hasActedThisPhase: boolean;      // true tras enviar acción → bloquea botones
  resultados: PokerResultado | null;
}

interface DobleNadaResult {
  user: string;
  bet: number;
  outcome: 'ganado' | 'perdido' | 'pasado';
  delta: number;
}

interface OrderMinijuegoDetails {
  objetivo?: number;
  cartas?: number[];
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
  /** Detalles enviados por backend para el minijuego de orden actual */
  currentOrderMinijuegoDetails: OrderMinijuegoDetails | null;
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
  /** Minijuego de casilla pendiente de resolver antes de cerrar el turno */
  pendingBoardMinigame: PendingBoardMinigame | null;
  /** Evita reenvíos mientras se espera la resolución de Doble o Nada */
  isSubmittingDobleNada: boolean;
  /** Apuesta enviada por el jugador local para reutilizarla al mostrar el resultado */
  submittedDobleNadaBet: number | null;
  /** Mostrar el resultado de Doble o Nada visible para todos los jugadores */
  dobleNadaResult: DobleNadaResult | null;
  /** El jugador local es el banquero y ya ha usado su habilidad este turno */
  hasUsedAbility: boolean;
  /** Mostrar el modal de robo del banquero */
  showBanqueroModal: boolean;
  /** Tiradas futuras vistas por el vidente */
  videnteTiradas: any[] | null; // Usamos any[] temporalmente para evitar circular dependency si no movemos el tipo
  /** Mostrar el modal del vidente */
  showVidenteModal: boolean;
  /** Resultados pendientes de mostrar en el scoreboard antes de volver al tablero */
  pendingMinigameResults: {
    resultados: Record<string, { posicion: number; score: number }>;
    nuevo_orden: Record<string, number>;
    minigameName: string;
  } | null;
  /** Objeto que el backend ya ha decidido para la ruleta */
  pendingObjetoRuleta: { user: string; objeto: string; descripcion: string } | null;
  /** Mostrar la UI de la ruleta */
  showRuleta: boolean;
  /** Mostrar la UI del Dilema del Prisionero */
  showDilema: boolean;
  /** Mostrar la UI de la Mano de Poker */
  showPoker: boolean;
  /** Estado completo del minijuego de poker (llenado por WS) */
  pokerState: PokerState;
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
  | { type: 'SHOW_MINIGAME_RESULTS'; resultados: Record<string, { posicion: number; score: number }>; nuevo_orden: Record<string, number> }
  | { type: 'MINIJUEGO_RESULTADOS'; nuevo_orden?: Record<string, number> }
  | { type: 'RECONNECT_SUCCESS'; boardState: { positions?: Record<string, number>; balances?: Record<string, number>; characters?: Record<string, string>; order?: Record<string, number> } }
  | { type: 'LOCAL_END_ROUND' }
  | { type: 'SHOW_ORDER_MINIGAME' }
  | { type: 'HIDE_ORDER_MINIGAME' }
  | { type: 'SHOW_VIDEOJUGADOR_ELECCION'; opciones: { nombre: string; descripcion: string | null }[] }
  | { type: 'HIDE_VIDEOJUGADOR_ELECCION' }
  | { type: 'SET_CURRENT_ORDER_MINIJUEGO'; minijuego: string; details: OrderMinijuegoDetails | null }
  | { type: 'SHOW_DOBLE_NADA'; user: string }
  | { type: 'OPEN_DOBLE_NADA' }
  | { type: 'SUBMIT_DOBLE_NADA'; score: number }
  | { type: 'DOBLE_NADA_SUBMISSION_FAILED' }
  | { type: 'SHOW_DOBLE_NADA_RESULT'; result: DobleNadaResult }
  | { type: 'CLEAR_DOBLE_NADA_FLOW' }
  | { type: 'SET_CASILLA_TIPO'; casilla: 'mov_negativo' | 'barrera' | 'none' }
  | { type: 'MARK_ITEM_PURCHASED'; item: string }
  | { type: 'SET_PENALTY_TURNS'; turns: number }
  | { type: 'CLEAR_PENALTY_TURNS' }
  | { type: 'SET_ANYONE_ANIMATING'; value: boolean }
  /** Otro jugador saltó su turno bloqueado (el backend hizo broadcast de penalizacion_actualizada) */
  | { type: 'REMOTE_SKIPPED'; user: string }
  | { type: 'CLEAR_LAST_DICE' }
  | { type: 'SET_SHOW_BANQUERO_MODAL'; value: boolean }
  | { type: 'MARK_ABILITY_USED' }
  | { type: 'SHOW_VIDENTE_MODAL'; tiradas: any[] }
  | { type: 'HIDE_VIDENTE_MODAL' }
  | { type: 'DEBUG_SET_TURN_ORDER'; order: number }
  | { type: 'SET_PENDING_OBJETO_RULETA'; data: { user: string; objeto: string; descripcion: string } | null }
  | { type: 'SHOW_RULETA' }
  | { type: 'HIDE_RULETA' }
  | { type: 'SHOW_DILEMA_PENDING'; user: string }
  | { type: 'OPEN_DILEMA' }
  | { type: 'HIDE_DILEMA' }
  | { type: 'SHOW_POKER_PENDING' }
  | { type: 'OPEN_POKER' }
  | { type: 'HIDE_POKER' }
  | { type: 'POKER_INICIO_RONDA'; fase: string; misCartas: PokerCard[] }
  | { type: 'POKER_NUEVA_FASE'; fase: string; bote: number; mesaVisible: PokerCard[]; jugadoresActivos: string[] }
  | { type: 'POKER_APUESTA_ACTUALIZADA'; user: string; apuestaObjetivo: number }
  | { type: 'POKER_RESULTADOS'; resultados: PokerResultado }
  | { type: 'POKER_MARK_ACTED' };


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
      return {
        ...state,
        players,
        currentTurnOrder: 1,
        myUsername: action.myUsername,
        lastSwapEvent: null,
        pendingBoardMinigame: null,
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        hasUsedAbility: false,
        showBanqueroModal: false,
        videnteTiradas: null,
        showVidenteModal: false,
        pendingMinigameResults: null,
        pendingObjetoRuleta: null,
        showRuleta: false,
        showDilema: false,
        showPoker: false,
        pokerState: { ...initialPokerState },
      };
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

    case 'SHOW_MINIGAME_RESULTS': {
      return {
        ...state,
        showOrderMinigame: false,
        currentOrderMinijuego: null,
        currentOrderMinijuegoDetails: null,
        pendingMinigameResults: {
          resultados: action.resultados,
          nuevo_orden: action.nuevo_orden,
          minigameName: state.currentOrderMinijuego ?? 'Minijuego',
        },
      };
    }

    case 'MINIJUEGO_RESULTADOS': {
      const nuevoOrden = action.nuevo_orden ?? state.pendingMinigameResults?.nuevo_orden;
      if (!nuevoOrden) return state;

      const updatedPlayers = { ...state.players };
      for (const [username, order] of Object.entries(nuevoOrden)) {
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
        currentOrderMinijuegoDetails: null,
        landedOnBarrera: false,
        showDobleNada: false,
        pendingBoardMinigame: null,
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        isAnyoneAnimating: false,
        hasUsedAbility: false,
        showBanqueroModal: false,
        videnteTiradas: null,
        showVidenteModal: false,
        pendingMinigameResults: null,
        pendingObjetoRuleta: null,
        showRuleta: false,
        showDilema: false,
        showPoker: false,
        pokerState: { ...initialPokerState },
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
        pendingBoardMinigame: null,
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        purchasedItems: {},
        penaltyTurns: newPenaltyTurns,
        // Si el jugador pasó sin moverse (bloqueado), ninguna animación está pendiente.
        // Garantizamos isAnyoneAnimating = false para que el siguiente pueda tirar de inmediato.
        isAnyoneAnimating: false,
        hasUsedAbility: false,
        showVidenteModal: false,
        pendingObjetoRuleta: null,
        showRuleta: false,
        showDilema: false,
        showPoker: false,
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
      return {
        ...state,
        showOrderMinigame: false,
      };

    case 'SHOW_VIDEOJUGADOR_ELECCION':
      return { ...state, showVideojugadorEleccion: true, videojugadorOpciones: action.opciones };

    case 'HIDE_VIDEOJUGADOR_ELECCION':
      return { ...state, showVideojugadorEleccion: false, videojugadorOpciones: [] };

    case 'SET_CURRENT_ORDER_MINIJUEGO':
      return {
        ...state,
        currentOrderMinijuego: action.minijuego,
        currentOrderMinijuegoDetails: action.details,
      };

    case 'SHOW_DOBLE_NADA':
      return {
        ...state,
        showDobleNada: false,
        pendingBoardMinigame: { type: 'Doble o Nada', user: action.user },
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        isAnyoneAnimating: true,
      };

    case 'OPEN_DOBLE_NADA':
      if (state.pendingBoardMinigame?.type !== 'Doble o Nada') return state;
      if (state.pendingBoardMinigame.user !== state.myUsername) return state;
      return { ...state, showDobleNada: true };

    case 'SUBMIT_DOBLE_NADA':
      return { ...state, isSubmittingDobleNada: true, submittedDobleNadaBet: action.score };

    case 'DOBLE_NADA_SUBMISSION_FAILED':
      return { ...state, isSubmittingDobleNada: false };

    case 'SHOW_DOBLE_NADA_RESULT':
      return {
        ...state,
        showDobleNada: false,
        isSubmittingDobleNada: false,
        pendingBoardMinigame: state.pendingBoardMinigame ?? { type: 'Doble o Nada', user: action.result.user },
        dobleNadaResult: action.result,
        isAnyoneAnimating: true,
      };

    case 'CLEAR_DOBLE_NADA_FLOW':
      return {
        ...state,
        showDobleNada: false,
        pendingBoardMinigame: null,
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        isAnyoneAnimating: false,
      };

    case 'CLEAR_LAST_DICE':
      return { ...state, lastDice: null };

    case 'DEBUG_SET_TURN_ORDER':
      return {
        ...state,
        currentTurnOrder: action.order,
        hasMoved: false,
        awaitingEndRound: false,
        pendingBoardMinigame: null,
        isSubmittingDobleNada: false,
        submittedDobleNadaBet: null,
        dobleNadaResult: null,
        hasUsedAbility: false,
      };

    case 'SET_SHOW_BANQUERO_MODAL':
      return { ...state, showBanqueroModal: action.value };

    case 'MARK_ABILITY_USED':
      return { ...state, hasUsedAbility: true };

    case 'SHOW_VIDENTE_MODAL':
      return { ...state, showVidenteModal: true, videnteTiradas: action.tiradas };

    case 'HIDE_VIDENTE_MODAL':
      return { ...state, showVidenteModal: false };

    case 'SET_PENDING_OBJETO_RULETA':
      return { ...state, pendingObjetoRuleta: action.data };

    case 'SHOW_RULETA':
      return { ...state, showRuleta: true };

    case 'HIDE_RULETA':
      return { ...state, showRuleta: false };

    case 'SHOW_DILEMA_PENDING':
      return {
        ...state,
        showDilema: false,
        pendingBoardMinigame: { type: 'Dilema del Prisionero', user: action.user },
        isAnyoneAnimating: true,
      };

    case 'OPEN_DILEMA':
      return { ...state, showDilema: true };

    case 'HIDE_DILEMA':
      return {
        ...state,
        showDilema: false,
        pendingBoardMinigame: null,
        isAnyoneAnimating: false,
      };

    case 'SHOW_POKER_PENDING':
      return {
        ...state,
        showPoker: false,
        pendingBoardMinigame: { type: 'Mano de Poker', user: '' },
        isAnyoneAnimating: true,
      };

    case 'OPEN_POKER':
      return { ...state, showPoker: true };

    case 'HIDE_POKER':
      return {
        ...state,
        showPoker: false,
        pendingBoardMinigame: null,
        isAnyoneAnimating: false,
        pokerState: { ...initialPokerState },
      };

    case 'POKER_INICIO_RONDA':
      return {
        ...state,
        pokerState: {
          ...state.pokerState,
          fase: action.fase,
          misCartas: action.misCartas,
          mesaVisible: [],
          bote: 0,
          apuestaObjetivo: 0,
          jugadoresActivos: Object.keys(state.players),
          hasActedThisPhase: false,
          resultados: null,
        },
      };

    case 'POKER_NUEVA_FASE':
      return {
        ...state,
        pokerState: {
          ...state.pokerState,
          fase: action.fase,
          bote: action.bote,
          mesaVisible: action.mesaVisible,
          jugadoresActivos: action.jugadoresActivos,
          hasActedThisPhase: state.myUsername
            ? !action.jugadoresActivos.includes(state.myUsername)
            : true,
          resultados: null,
        },
      };

    case 'POKER_APUESTA_ACTUALIZADA':
      return {
        ...state,
        pokerState: {
          ...state.pokerState,
          apuestaObjetivo: action.apuestaObjetivo,
          // Quien subó sigue bloqueado; los demás activos se desbloquean
          hasActedThisPhase: action.user === state.myUsername
            ? state.pokerState.hasActedThisPhase
            : state.myUsername
              ? !state.pokerState.jugadoresActivos.includes(state.myUsername)
              : true,
        },
      };

    case 'POKER_RESULTADOS':
      return {
        ...state,
        pokerState: {
          ...state.pokerState,
          fase: 'Resultados',
          resultados: action.resultados,
          hasActedThisPhase: true,
        },
      };

    case 'POKER_MARK_ACTED':
      return {
        ...state,
        pokerState: {
          ...state.pokerState,
          hasActedThisPhase: true,
        },
      };

    default:
      return state;
  }
}

const initialPokerState: PokerState = {
  fase: '',
  misCartas: [],
  mesaVisible: [],
  bote: 0,
  apuestaObjetivo: 0,
  jugadoresActivos: [],
  hasActedThisPhase: false,
  resultados: null,
};

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
  currentOrderMinijuegoDetails: null,
  showDobleNada: false,
  landedOnNegativeMove: false,
  landedOnBarrera: false,
  penaltyTurns: 0,
  purchasedItems: {},
  isAnyoneAnimating: false,
  lastSwapEvent: null,
  pendingBoardMinigame: null,
  isSubmittingDobleNada: false,
  submittedDobleNadaBet: null,
  dobleNadaResult: null,
  hasUsedAbility: false,
  showBanqueroModal: false,
  videnteTiradas: null,
  showVidenteModal: false,
  pendingMinigameResults: null,
  pendingObjetoRuleta: null,
  showRuleta: false,
  showDilema: false,
  showPoker: false,
  pokerState: { ...initialPokerState },
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
  sendScoreOrden: (score: number, objetivo?: number) => void;
  /** Enviar apuesta de Doble o Nada; `0` equivale a pasar */
  sendScoreDobleNada: (score: number) => void;
  /** El videojugador envía ini_round con el minijuego elegido */
  sendIniRound: (minijuego: string, descripcion: string) => void;
  /** Registrar la compra de un objeto en el turno actual */
  markItemPurchased: (item: string) => void;
  /** BoardOverlay llama a esto cuando termina la cadena de animación de un jugador.
   *  isLocalPlayer=true → si procede, se envía end_round automáticamente. */
  notifyAnimationEnded: (username: string) => void;
  /** true mientras cualquier ficha esté animándose en el tablero */
  isAnyoneAnimating: boolean;

  /** Dispatcher para depuración y casos avanzados */
  dispatch: React.Dispatch<Action>;

  /** Enviar acción de robo del banquero al backend */
  sendRoboBanquero: (targetUser: string) => void;
  /** Enviar decisión del dilema del prisionero (cooperar o traicionar) */
  sendScoreDilema: (decision: "cooperar" | "traicionar") => void;
  /** Enviar acción de poker (apostar/retirarse) */
  sendPokerAction: (decision: 'apostar' | 'retirarse', cantidad: number) => void;
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
  const awaitingEndRoundRef = useRef(false);
  const pendingBoardMinigameRef = useRef<GameState['pendingBoardMinigame']>(null);
  const isSubmittingDobleNadaRef = useRef(false);
  const awaitingDobleNadaBalanceRef = useRef(false);
  const submittedDobleNadaBetRef = useRef<number | null>(null);
  const playersRef = useRef<GameState['players']>({});
  const dobleNadaResultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingObjetoRuletaRef = useRef<GameState['pendingObjetoRuleta']>(null);

  useEffect(() => {
    awaitingEndRoundRef.current = state.awaitingEndRound;
  }, [state.awaitingEndRound]);

  useEffect(() => {
    pendingBoardMinigameRef.current = state.pendingBoardMinigame;
  }, [state.pendingBoardMinigame]);

  useEffect(() => {
    isSubmittingDobleNadaRef.current = state.isSubmittingDobleNada;
  }, [state.isSubmittingDobleNada]);

  useEffect(() => {
    submittedDobleNadaBetRef.current = state.submittedDobleNadaBet;
  }, [state.submittedDobleNadaBet]);

  useEffect(() => {
    playersRef.current = state.players;
  }, [state.players]);

  useEffect(() => {
    pendingObjetoRuletaRef.current = state.pendingObjetoRuleta;
  }, [state.pendingObjetoRuleta]);

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

  /** ms extra tras terminar la animación antes de desbloquear el botón del siguiente jugador */
  const POST_ANIMATION_DELAY_MS = 800;
  /** tiempo de cortesía mostrando el resultado de Doble o Nada antes de cerrar la ronda */
  const DOBLE_NADA_RESULT_DELAY_MS = 1800;

  const clearDobleNadaResultTimer = useCallback(() => {
    if (dobleNadaResultTimerRef.current !== null) {
      clearTimeout(dobleNadaResultTimerRef.current);
      dobleNadaResultTimerRef.current = null;
    }
  }, []);

  const finalizeDobleNadaFlow = useCallback((resolvedUser: string) => {
    clearDobleNadaResultTimer();
    awaitingDobleNadaBalanceRef.current = false;
    dobleNadaResultTimerRef.current = setTimeout(() => {
      const myUsername = sessionStorage.getItem('username');
      const shouldFinishLocalTurn = resolvedUser === myUsername && awaitingEndRoundRef.current;

      if (shouldFinishLocalTurn) {
        sendEndRound();
      }

      dispatch({ type: 'CLEAR_DOBLE_NADA_FLOW' });
      dobleNadaResultTimerRef.current = null;
    }, DOBLE_NADA_RESULT_DELAY_MS);
  }, [clearDobleNadaResultTimer, sendEndRound]);

  useEffect(() => clearDobleNadaResultTimer, [clearDobleNadaResultTimer]);

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
          if (pendingBoardMinigameRef.current?.type === 'Doble o Nada' && isSubmittingDobleNadaRef.current) {
            dispatch({ type: 'DOBLE_NADA_SUBMISSION_FAILED' });
          }
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
            const balances = data.balances as Record<string, number>;
            const pendingBoardMinigame = pendingBoardMinigameRef.current;

            dispatch({
              type: 'BALANCES_CHANGED',
              balances,
            });

            if (pendingBoardMinigame?.type === 'Doble o Nada' && awaitingDobleNadaBalanceRef.current) {
              awaitingDobleNadaBalanceRef.current = false;
              const resolvedUser = pendingBoardMinigame.user;
              const previousBalance = playersRef.current[resolvedUser]?.balance;
              const nextBalance = balances[resolvedUser];

              if (typeof previousBalance === 'number' && typeof nextBalance === 'number') {
                const delta = nextBalance - previousBalance;
                const myUsername = sessionStorage.getItem('username');
                const submittedBet = resolvedUser === myUsername
                  ? submittedDobleNadaBetRef.current
                  : null;

                dispatch({
                  type: 'SHOW_DOBLE_NADA_RESULT',
                  result: {
                    user: resolvedUser,
                    bet: submittedBet ?? Math.abs(delta),
                    outcome: delta > 0 ? 'ganado' : delta < 0 ? 'perdido' : 'pasado',
                    delta,
                  },
                });
                finalizeDobleNadaFlow(resolvedUser);
              }
            }
            break;
          }

          case 'minijuego_resultados': {
            dispatch({
              type: 'SHOW_MINIGAME_RESULTS',
              resultados: data.resultados as Record<string, { posicion: number; score: number }>,
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
            const minijuego = data.minijuego as string;
            // Dilema del prisionero (casilla VS)
            if (minijuego === 'Dilema del Prisionero') {
              const myUsername = sessionStorage.getItem('username');
              dispatch({ type: 'SHOW_DILEMA_PENDING', user: myUsername ?? '' });
            } 
            else if (minijuego === 'Mano de Poker') {
              dispatch({ type: 'SHOW_POKER_PENDING' });
            }
            // Los minijuegos de orden llegan con estado_partida/detalles.
            else if ('estado_partida' in data) {
              const details = typeof data.detalles === 'object' && data.detalles !== null
                ? data.detalles as OrderMinijuegoDetails
                : null;
              dispatch({ type: 'HIDE_VIDEOJUGADOR_ELECCION' });
              dispatch({ type: 'SET_CURRENT_ORDER_MINIJUEGO', minijuego, details });
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
            if (data.minijuego === 'Doble o Nada') {
              awaitingDobleNadaBalanceRef.current = true;
              dispatch({ type: 'SHOW_DOBLE_NADA', user: data.user as string });
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

          case 'dice_shown': {
            const punt = data.punt as number[];
            if (Array.isArray(punt)) {
              const diceTypes: DiceType[] = ['oro', 'plata', 'bronce', 'normal'];
              const maxSpecials = [6, 4, 2];

              const transformed = punt.map((total, index) => {
                const isFourth = index === 3;
                if (isFourth) {
                  return { dado1: total, dado2: 0, diceType: 'normal' };
                } else {
                  const maxSpecial = maxSpecials[index];
                  const d2 = Math.min(maxSpecial, total - 1);
                  const d1 = total - d2;
                  return { dado1: d1, dado2: d2, diceType: diceTypes[index] };
                }
              });

              dispatch({ type: 'SHOW_VIDENTE_MODAL', tiradas: transformed });
            }
            break;
          }

          case 'obtener_objeto': {
            dispatch({ 
              type: 'SET_PENDING_OBJETO_RULETA', 
              data: { 
                user: data.user as string, 
                objeto: data.objeto as string, 
                descripcion: data.descripcion as string 
              } 
            });
            break;
          }

          case 'poker_inicio_ronda': {
            const misCartas = (data.mis_cartas as BackendCard[]).map(mapBackendCard);
            dispatch({
              type: 'POKER_INICIO_RONDA',
              fase: data.fase as string,
              misCartas,
            });
            break;
          }

          case 'poker_nueva_fase': {
            const mesaVisible = (data.mesa_visible as BackendCard[]).map(mapBackendCard);
            dispatch({
              type: 'POKER_NUEVA_FASE',
              fase: data.fase as string,
              bote: data.bote_actual as number,
              mesaVisible,
              jugadoresActivos: data.jugadores_activos as string[],
            });
            break;
          }

          case 'poker_apuesta_actualizada': {
            dispatch({
              type: 'POKER_APUESTA_ACTUALIZADA',
              user: data.user as string,
              apuestaObjetivo: data.nueva_apuesta_objetivo as number,
            });
            break;
          }

          case 'poker_resultados': {
            const mesaCompleta = Array.isArray(data.mesa_completa)
              ? (data.mesa_completa as BackendCard[]).map(mapBackendCard)
              : [];
            const resultadosOrdenados = Array.isArray(data.resultados_ordenados)
              ? (data.resultados_ordenados as any[]).map((r: any) => ({
                  user: r.user as string,
                  mano: r.mano as string,
                  cartas: Array.isArray(r.cartas)
                    ? (r.cartas as BackendCard[]).map(mapBackendCard)
                    : [],
                }))
              : [];
            dispatch({
              type: 'POKER_RESULTADOS',
              resultados: {
                idGanadores: data.id_ganadores as string[],
                boteGanado: data.bote_ganado as number,
                resultadosOrdenados,
                mesaCompleta,
              },
            });
            break;
          }
        }
      } catch {
        // Mensaje no-JSON u otros errores → ignorar
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [finalizeDobleNadaFlow]);

  /** Llamado por BoardOverlay al finalizar la cadena de animación de un jugador.
   *  Si es el jugador local y está esperando end_round, lo envía automáticamente. */
  const notifyAnimationEnded = useCallback((username: string) => {
    const isLocalPlayer = username === state.myUsername;
    const pendingBoardMinigame = pendingBoardMinigameRef.current;
    if (pendingBoardMinigame?.type === 'Doble o Nada') {
      if (isLocalPlayer && pendingBoardMinigame.user === state.myUsername) {
        dispatch({ type: 'OPEN_DOBLE_NADA' });
      }
      return;
    }

    if (pendingBoardMinigame?.type === 'Dilema del Prisionero') {
      if (isLocalPlayer && pendingBoardMinigame.user === state.myUsername) {
        dispatch({ type: 'OPEN_DILEMA' });
      }
      return;
    }

    if (pendingBoardMinigame?.type === 'Mano de Poker') {
      // El póker se abre para TODOS cuando la ficha que se movía termina.
      // Asumimos que la animación que termina y lanza el minijuego es la del jugador en turno.
      dispatch({ type: 'OPEN_POKER' });
      return;
    }

    // Si hay una ruleta pendiente para este jugador
    const pendingRuleta = pendingObjetoRuletaRef.current;
    if (pendingRuleta && pendingRuleta.user === username) {
      if (isLocalPlayer) {
        dispatch({ type: 'SHOW_RULETA' });
      } else {
        // Espectador: esperar 2 segundos antes de mostrar la ruleta
        setTimeout(() => {
          dispatch({ type: 'SHOW_RULETA' });
        }, 2000);
      }
      return;
    }

    if (isLocalPlayer && awaitingEndRoundRef.current) {
      sendEndRound();
    }
    // Pequeño delay extra antes de desbloquear el botón del siguiente jugador
    setTimeout(() => {
      dispatch({ type: 'SET_ANYONE_ANIMATING', value: false });
    }, POST_ANIMATION_DELAY_MS);
  }, [sendEndRound, state.myUsername, state.pendingObjetoRuleta]);

  const sendScoreReflejos = useCallback((reactionTimeMs: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score: reactionTimeMs * 1000 },
    }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
  }, []);

  const sendScoreOrden = useCallback((score: number, objetivo?: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    // Reflejos: el backend espera ms*1000. El resto de minijuegos usan el score directo.
    const minijuego = state.currentOrderMinijuego;
    const payload: any = minijuego === 'Reflejos'
      ? { score: score * 1000 }
      : { score };
    
    if (objetivo !== undefined) {
      payload.objetivo = objetivo;
    }

    ws.send(JSON.stringify({ action: 'score_minijuego', payload }));
    dispatch({ type: 'HIDE_ORDER_MINIGAME' });
  }, [state.currentOrderMinijuego]);

  const sendScoreDobleNada = useCallback((score: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    dispatch({ type: 'SUBMIT_DOBLE_NADA', score });
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score },
    }));
  }, []);

  const sendIniRound = useCallback((minijuego: string, descripcion: string) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ action: 'ini_round', payload: { minijuego, descripcion } }));
    dispatch({ type: 'HIDE_VIDEOJUGADOR_ELECCION' });
  }, []);
  
  const sendRoboBanquero = useCallback((targetUser: string) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ 
      action: 'banquero', 
      payload: { robar_a: targetUser } 
    }));
    dispatch({ type: 'MARK_ABILITY_USED' });
    dispatch({ type: 'SET_SHOW_BANQUERO_MODAL', value: false });
  }, []);

  const sendScoreDilema = useCallback((decision: "cooperar" | "traicionar") => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      action: 'score_minijuego',
      payload: { score: decision },
    }));
    dispatch({ type: 'HIDE_DILEMA' });
    
    // Si soy el jugador activo que movió, cierro el turno definitivamente
    if (awaitingEndRoundRef.current) {
      sendEndRound();
    }
  }, [sendEndRound]);

  const sendPokerAction = useCallback((decision: 'apostar' | 'retirarse', cantidad: number) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      action: 'poker_accion',
      payload: { decision, cantidad },
    }));
    dispatch({ type: 'POKER_MARK_ACTED' });
  }, []);

  // Datos derivados
  const myPlayer = state.myUsername ? (state.players[state.myUsername] ?? null) : null;
  const isMyTurn =
    myPlayer !== null &&
    myPlayer.turnOrder === state.currentTurnOrder &&
    !state.hasMoved;
  const playerOrder = Object.values(state.players).sort((a, b) => a.turnOrder - b.turnOrder);

  return (
        <GameContext.Provider value={{ state, isMyTurn, myPlayer, playerOrder, sendMovePlayer, sendEndRound, sendScoreReflejos, sendScoreOrden, sendScoreDobleNada, sendIniRound, markItemPurchased, notifyAnimationEnded, isAnyoneAnimating: state.isAnyoneAnimating, dispatch, sendRoboBanquero, sendScoreDilema, sendPokerAction }}>



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

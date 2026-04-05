"use client";

import React from "react";
import { useGameContext, type GamePlayer } from "@/features/board/context/GameContext";

export interface Player {
  id: string;
  name: string;
  role: "Banquero" | "Videojugador" | "Escapista" | "Vidente";
  coins: number;
  avatarUrl: string;
}

const RoleAvatar = ({ player }: { player: Player }) => {
  const roleColors = {
    Banquero: "bg-yellow-500",
    Videojugador: "bg-blue-500",
    Escapista: "bg-green-500",
    Vidente: "bg-purple-500",
  };

  return (
    <div className={`w-10 h-10 border-2 border-white flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden ${roleColors[player.role]}`}>
      <img src={player.avatarUrl} alt={player.role} className="w-full h-full object-cover" />
    </div>
  );
};

const PlayerCard = ({ player, isTurn }: { player: Player; isTurn: boolean }) => {
  return (
    <div
      className={`relative flex items-center gap-2 p-2 bg-[var(--color-sp-bg-medium)] border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] min-w-[200px] transition-all duration-300 ${isTurn
          ? "border-green-400 scale-[1.05] z-10 [filter:drop-shadow(0_0_12px_rgba(74,222,128,0.8))_drop-shadow(0_0_20px_rgba(74,222,128,0.4))]"
          : "border-white"
        }`}
    >
      {/* Avatar de Personaje */}
      <RoleAvatar player={player} />

      {/* Información del Jugador */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center">
          <span className="text-[var(--color-sp-text-light)] font-pixel text-xs truncate max-w-[100px]">
            {player.name}
          </span>
          <span className="text-[var(--color-sp-coin-light)] font-pixel text-[10px]">
            {player.coins}¢
          </span>
        </div>

        <div className="text-[9px] text-[var(--color-sp-text-light)]/70 font-pixel uppercase tracking-wider leading-none">
          {player.role}
        </div>
      </div>
    </div>
  );
};

function mapGamePlayer(gp: GamePlayer, fallbackIdx: number): Player {
  // characterWsName es el nombre capitalizado que coincide con el tipo Player['role']
  const roleNames = ["Banquero", "Videojugador", "Escapista", "Vidente"] as const;
  const role = (gp.characterWsName as Player['role']) ?? roleNames[fallbackIdx % 4];
  const avatarUrl = gp.character
    ? `/personajes_profile/${gp.character}_profile.png`
    : `/personajes_profile/${roleNames[fallbackIdx % 4].toLowerCase()}_profile.png`;

  return {
    id: gp.username,
    name: gp.username,
    role,
    coins: gp.balance,
    avatarUrl,
  };
}

const PlayerHUD = () => {
  const { playerOrder, state, myPlayer } = useGameContext();
  const { currentTurnOrder, awaitingEndRound } = state;

  const visualTurnOrder = (awaitingEndRound && myPlayer)
    ? myPlayer.turnOrder
    : currentTurnOrder;

  return (
    <aside className="flex flex-col gap-2 p-6 pointer-events-auto">
      {playerOrder.map((gp, idx) => {
        const player = mapGamePlayer(gp, idx);
        const isTurn = gp.turnOrder === visualTurnOrder;
        return <PlayerCard key={player.id} player={player} isTurn={isTurn} />;
      })}
    </aside>
  );
};

export default PlayerHUD;

"use client";

import React from "react";

/**
 * Interfaz que define la estructura de un jugador.
 * id: Identificador único del jugador.
 * name: Nombre para mostrar.
 * role: Rol asignado (Banquero, Videojugador, Escapista, Vidente).
 * coins: Cantidad de monedas.
 */
export interface Player {
  id: string;
  name: string;
  role: "Banquero" | "Videojugador" | "Escapista" | "Vidente";
  coins: number;
  avatarUrl: string;
}

/**
 * Datos mockeados para visualización del HUD.
 * En el futuro, estos datos se obtendrán del backend o del estado global.
 */
const MOCK_PLAYERS: Player[] = [
  { id: "1", name: "David", role: "Banquero", coins: 2, avatarUrl: "/personajes_profile/banquero_profile.png" },
  { id: "2", name: "Elena", role: "Escapista", coins: 5, avatarUrl: "/personajes_profile/escapista_profile.png" },
  { id: "3", name: "Marcos", role: "Videojugador", coins: 3, avatarUrl: "/personajes_profile/videojugador_profile.png" },
  { id: "4", name: "Lucía", role: "Vidente", coins: 1, avatarUrl: "/personajes_profile/vidente_profile.png" },
];

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

const PlayerCard = ({ player }: { player: Player }) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--color-sp-bg-medium)] border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] min-w-[200px]">
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

const PlayerHUD = () => {
  return (
    <aside className="flex flex-col gap-2 p-1 pointer-events-auto">
      {MOCK_PLAYERS.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}

      {/* 
          NOTA PARA EL FUTURO:
          Aquí se conectará el estado real de los jugadores.
          Ejemplo: const { players } = useGameStore();
      */}
    </aside>
  );
};

export default PlayerHUD;

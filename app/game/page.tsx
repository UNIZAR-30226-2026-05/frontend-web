"use client";

import Dice from "@/features/board/components/Dice";
import PlayerHUD from "@/features/board/components/PlayerHUD";
import PixelButton from "@/components/UI/PixelButton";
import ShopModal from "@/features/shop/components/ShopModal";
import BoardOverlay from "@/features/board/components/BoardOverlay";
import { getGameSocket } from "@/lib/gameSocket";
import { useEffect, useState } from "react";

export default function GamePage() {
  const [isShopOpen, setIsShopOpen] = useState(false);

  useEffect(() => {
    const ws = getGameSocket();

    if (!ws) {
      console.warn("No hay una conexion WebSocket activa en /game");
      return;
    }

    const onMessage = (event: MessageEvent) => {
      console.log("Mensaje en /game:", event.data);
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

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[url('/tablero_def.png')] bg-contain bg-no-repeat bg-center">
      
      {/* Capa de Fichas de Jugadores y Lógica de Tablero */}
      <BoardOverlay />

      {/* HUD de Jugadores (Lado izquierdo) */}
      <div className="absolute top-2 left-2 z-50">
        <PlayerHUD />
      </div>

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
      </div>

    </main>
  );
}

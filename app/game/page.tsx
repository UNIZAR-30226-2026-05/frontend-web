import Dice from "@/features/board/components/Dice";
import PlayerHUD from "@/features/board/components/PlayerHUD";

export default function GamePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[url('/tablero_def.png')] bg-contain bg-no-repeat bg-center">

      {/* HUD de Jugadores (Lado izquierdo) */}
      <div className="absolute top-2 left-2 z-50">
        <PlayerHUD />
      </div>

      {/* Contenedor superpuesto para controles (esquina inferior derecha) */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex flex-col items-end gap-4">
        <Dice />
      </div>

    </main>
  );
}
